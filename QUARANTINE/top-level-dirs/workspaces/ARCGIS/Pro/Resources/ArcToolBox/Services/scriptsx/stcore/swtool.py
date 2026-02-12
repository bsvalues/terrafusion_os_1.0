"""SummarizeWithin tool implementation."""
# import from common package. noqa. pylint: disable=import-error
import arcpy
import arcpy.management

from common import (PATool, PAFeatureLayer, AnalysisUtils, LogUtils, FieldUtils,
                    FSECPublisher, PALayerUtils, PAErrorProcessor,
                    IntermCleanMixin, ModelBuilderMixin,
                    ParameterUnpackMixin, LogExecutionTime,
                    PAEnvironment, AOLUtils)

from .stcommon import create_tessellation, SummaryOutputHandler
from .swexecutor import SWExecutor

LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "SummarizeWithin"
ERROR_CODES = [100004, 100005, 100006, 100024, 100018, 100019, 100048, 100052,
               100119, 100125, 100255, 100256]


class SWTool(ModelBuilderMixin, ParameterUnpackMixin, PATool, IntermCleanMixin):
    """Module provides execution logic for summarize within tool."""

    def get_parameters(self):
        """Implement the abstractmethod of get_parameters."""
        if self.task_name.lower() == "aggregatepoints":
            self.perf_ap_chk = True
        else:
            self.perf_ap_chk = False
        self.interm_outputs = []
        if self.version < 2.0:
            # index of the summary layer and summary boundary layer
            (sl_idx, sbl_idx) = (1, 0)
            # index of sum_shpae, sum_units, summary_fields, group_by_field,
            # min_majority, shape_percent parameters
            (ss_idx, su_idx, sf_idx, gbf_idx, mm_idx, ps_idx) = (2, 3, 4, 5, 6, 7)
            # index of bin_type, bin_size, bin_size_units parameters
            (bt_idx, bs_idx, bsu_idx) = (10, 11, 12)
            # boundary layer name
            blyr_name = "sumWithinLayer"
        else:
            (sl_idx, sbl_idx) = (0, 1)
            (bt_idx, bs_idx, bsu_idx) = (2, 3, 4)
            # index of keep boundaries with no features
            kb_idx = 5
            (ss_idx, su_idx, sf_idx, gbf_idx, mm_idx, ps_idx) = (6, 7, 8, 9, 10, 11)
            blyr_name = "summaryPolygon"

        summary_layer: PAFeatureLayer = PAFeatureLayer(sl_idx,
                                                       metadata={"parameterDataType": "Feature Set",
                                                                 "parameterName": "summaryLayer"})
        if "multipoint" in summary_layer.shapeType.lower():
            summary_layer = PALayerUtils.convert_multiparts_to_single(summary_layer,  # type: ignore
                                                                      wrap_output_as_layer=True)
            self.interm_outputs.append(summary_layer)
        summary_boundary_layer = PAFeatureLayer(sbl_idx, metadata={"parameterDataType": "Feature Set",
                                                                   "parameterName": blyr_name,
                                                                   "parameterType": "Optional"})
        (sum_shape, summary_fields) = self.unpack([ss_idx, sf_idx], as_text=False)
        (sum_units, group_by_field) = self.unpack([su_idx, gbf_idx], as_text=True)

        if "Point" in summary_layer.shapeType:
            sum_shape = True

        if not sum_units:
            sum_units = None
        if not group_by_field:
            group_by_field = None
        if not summary_fields:
            summary_fields = None
        if group_by_field:
            (min_majority, shape_percent) = self.unpack([mm_idx, ps_idx],
                                                        as_text=False)
        else:
            (min_majority, shape_percent) = (False, False)

        if min_majority or shape_percent:
            sum_shape = True

        keep_all_bounds = True if self.version < 2.0 else arcpy.GetParameter(kb_idx)  # type: ignore
        (bin_type, bin_size, bin_size_units) = self.unpack([bt_idx, bs_idx, bsu_idx],
                                                           as_text=[True, False, False])
        if not self.get_param_as_text(bs_idx).strip():
            bin_size = "#"
        if not bin_size_units:
            bin_size_units = "#"

        if summary_boundary_layer:
            self.hex_grids = False
            self.check_overwrite_sr(summary_boundary_layer.spatialReference)  # type: ignore
        else:
            self.check_overwrite_sr(summary_layer.spatialReference)  # type: ignore
            tess_path = create_tessellation(summary_layer, None, bin_type, bin_size, bin_size_units)  # type: ignore
            summary_boundary_layer = PAFeatureLayer(tess_path)
            self.hex_grids = True
            # clear selection if any on points layer
            # https://devtopia.esri.com/ArcGISPro/geoprocessing/issues/1755
            arcpy.management.SelectLayerByAttribute(summary_layer.layer, "CLEAR_SELECTION", None, None)

        if self.is_running_in(PAEnvironment.MODELBUILDER):
            summarized_output = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(13))
            if group_by_field:
                groupby_table = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(14))
            else:
                groupby_table = None
        else:
            self.cost_parameters = {"summaryLayer": summary_layer, "sumShape": sum_shape,
                                    "shapeUnits": sum_units, "summaryFields": summary_fields,
                                    "groupByField": group_by_field, "percentShape": shape_percent,
                                    "sumWithinLayer": summary_boundary_layer}
            
            if (
                summary_layer.contains_field_type("TimestampOffset")
                or (summary_boundary_layer and summary_boundary_layer.contains_field_type("TimestampOffset"))
            ):
                hw_wkspc = AOLUtils.get_scratch_wkspc()
            else:
                hw_wkspc = AnalysisUtils.get_hw_wkspc(self.output_name)

            summarized_output = AnalysisUtils.initialize_output_layer(summary_boundary_layer.count,
                                                                      "summarizedOutput",
                                                                      hw_wkspc=hw_wkspc)

            if group_by_field:
                groupby_table = AnalysisUtils.initialize_output_layer(summary_boundary_layer.count,
                                                                      "summaryTable",
                                                                      hw_wkspc=hw_wkspc)
            else:
                groupby_table = None

        if sum_shape and not sum_units and summary_layer.shapeType != "Point":
            area_unit = True if summary_layer.shapeType == "Polygon" else False
            if self.is_running_in(PAEnvironment.MODELBUILDER):
                sum_units = AnalysisUtils.get_units_in_mb(area_unit)
            else:
                sum_units = AnalysisUtils.get_units(self.portal_description, area_unit)

        if not sum_shape and sum_units:
            sum_units = None

        self.calc_shp_area = True
        if self.version > 1.0:
            self.calc_shp_area: bool = self.get_param(14)
        
        self.executor: SWExecutor = SWExecutor(summary_layer, summary_boundary_layer,
                                               summarized_output, groupby_table,
                                               summary_fields, group_by_field,
                                               bin_type, bin_size, bin_size_units,
                                               min_majority, shape_percent,
                                               keep_all_bounds, sum_units,  # type: ignore
                                               sum_shape=sum_shape)

    def set_visualization(self):
        """Implement the abstractmethod of set_visualization."""
        if self.is_running_in(PAEnvironment.MODELBUILDER):
            units = AnalysisUtils.get_units_in_mb(True)
        else:
            units = AnalysisUtils.get_units(self.portal_description, True)
        LOGGER.debug(f"units: {units}.")
        if self.calc_shp_area:
            with LogExecutionTime("Create ShapeArea Field:"):
                FieldUtils.create_shape_area_field(self.executor.output_lyr, units)
        SummaryOutputHandler(self.executor.output_lyr, self.executor.groupby_stat_output,
                             self.executor.summary_lyr.layer_name, self.hex_grids,
                             self.executor.fields_info,
                             self.executor.summary_lyr.shapeType,
                             self.executor.groupby_field).handle()

    def publish_outputs(self):
        """Implement the abstractmethod of publish_outputs."""
        with arcpy.EnvManager(extent=None):
            (res_idx, gbs_idx) = (13, 14) if self.version < 2.0 else (15, 16)
            publisher = FSECPublisher(self.output_name, tool_version=self.version)
            publisher.add_layer_to_publish(self.executor.output_lyr, res_idx, "resultLayer",
                                           layer_index=0)
            if self.executor.groupby_stat_output:
                publisher.add_layer_to_publish(self.executor.groupby_stat_output, gbs_idx,
                                               "GroupBySummary", layer_index=1)
            publisher.publish()

    def log_usage_metering(self):
        """Implement the abstractmethod of log_usage_metering."""
        num_objects = self.executor.summary_lyr.count + self.executor.summary_boundary_lyr.count
        keep_empty_bound_cost = 1 if self.executor.keep_boundaries_with_no_features else 2
        group_field_count = 2 if self.executor.groupby_field else 1
        sum_fields_count = len(self.executor.summary_fields) if self.executor.summary_fields else 0
        values = [self.executor.summary_lyr.count, self.executor.summary_boundary_lyr.count,
                  keep_empty_bound_cost, sum_fields_count, group_field_count,
                  self.output_name.output_cost]
        LogUtils.log_usage(self.task_name, num_objects, num_objects * 0.001, values)


def execute_tool(version: float, output_name_idx: int, context_idx: int):
    """Entry of the SummarizeWithin tool."""
    tool_initialized = False
    try:
        sw_tool = SWTool(TASK_NAME, output_name_index=output_name_idx,
                         context_index=context_idx, version=version)
        tool_initialized = True
        sw_tool.run()
    except Exception as err:  # noqa. pylint: disable=broad-except
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
    finally:
        if tool_initialized:
            sw_tool.clean()  # type: ignore
