"""AggregatePoints tool implementation."""
# import from common package. noqa. pylint: disable=import-error
import arcpy
import arcpy.management

from common import (PATool, PAFeatureLayer, PAErrorProcessor,
                    AnalysisUtils, LogUtils, PALayerUtils, FieldUtils,
                    FSECPublisher, IntermCleanMixin,
                    ModelBuilderMixin, ParameterUnpackMixin,
                    LogExecutionTime, PAEnvironment, AOLUtils)
from .stcommon import create_tessellation, SummaryOutputHandler
from .apexecutor import APExecutor

LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "AggregatePoints"
ERROR_CODES = [100001, 100002, 100003, 100004, 100005, 100006, 728, 100024,
               100048, 100052, 100125]


class APTool(ModelBuilderMixin, ParameterUnpackMixin, PATool, IntermCleanMixin):
    """Module provides execution logic for aggregate points tool."""

    def get_parameters(self):
        """Implement the abstractmethod of get_parameters."""
        self.interm_outputs = []
        summary_layer: PAFeatureLayer = PAFeatureLayer(0,
                                                       metadata={"parameterDataType": "Feature Set",
                                                                 "parameterName": "pointLayer"})
        if "multipoint" in summary_layer.shapeType.lower():
            summary_layer = PALayerUtils.convert_multiparts_to_single(summary_layer,  # type: ignore
                                                                      wrap_output_as_layer=True)
            self.interm_outputs.append(summary_layer.data)
        summary_boundary_layer = PAFeatureLayer(1, metadata={"parameterDataType": "Feature Set",
                                                             "parameterName": "polygonLayer",
                                                             "parameterType": "Optional"})
        if self.version < 2.0:
            # indexes of keep empty boundaries, summary fields, group field name, 
            # calculate minority majority, and percent shape
            (keb_idx, sf_idx, gfn_idx, cmm_idx, ps_idx) = (2, 3, 4, 5, 6)
            # indexes of bin type, bin size, and bin size unit
            bt_idx, bs_idx, bsu_idx = (9, 10, 11)
        else:
            (bt_idx, bs_idx, bsu_idx) = (2, 3, 4)
            (keb_idx, sf_idx, gfn_idx, cmm_idx, ps_idx) = (5, 6, 7, 8, 9)

        (keep_empty_boundaries, summary_fields, bin_size) = self.unpack([keb_idx, sf_idx, bs_idx],
                                                                        as_text=False)
        (group_field_name, bin_type, bin_size_units) = self.unpack([gfn_idx, bt_idx, bsu_idx],
                                                                   as_text=True)
        if not summary_fields:
            summary_fields = None
        if not group_field_name:
            group_field_name = None
        if not self.get_param_as_text(bs_idx).strip():
            bin_size = "#"
        if not self.get_param_as_text(bsu_idx).strip():
            bin_size_units = "#"

        if group_field_name:
            calc_min_majority = arcpy.GetParameter(cmm_idx)
            percent_shp = arcpy.GetParameter(ps_idx)
        else:
            calc_min_majority = False
            percent_shp = False

        self.calc_shp_area = True
        if self.version >= 2.0:
            self.calc_shp_area: bool = self.get_param(12)

        if summary_boundary_layer:
            self.hex_grids = False
            self.check_overwrite_sr(summary_boundary_layer.spatialReference)  # type: ignore
        else:
            self.check_overwrite_sr(summary_layer.spatialReference)  # type: ignore
            tess_path = create_tessellation(summary_layer, None, bin_type, bin_size, bin_size_units)
            summary_boundary_layer = PAFeatureLayer(tess_path)

            self.hex_grids = True
            # clear selection if any on points layer
            # https://devtopia.esri.com/ArcGISPro/geoprocessing/issues/1755
            arcpy.management.SelectLayerByAttribute(summary_layer.layer, "CLEAR_SELECTION", None, None)

        if self.is_running_in(PAEnvironment.MODELBUILDER):
            aggregate_output = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(12))
            if group_field_name:
                aggregate_table = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(13))
            else:
                aggregate_table = None
        else:
            if (
                summary_layer.contains_field_type("TimestampOffset")
                or (summary_boundary_layer and summary_boundary_layer.contains_field_type("TimestampOffset"))
            ):
                hw_wkspc = AOLUtils.get_scratch_wkspc()
            else:
                hw_wkspc = AnalysisUtils.get_hw_wkspc(self.output_name)

            self.cost_parameters = {"pointLayer": summary_layer,
                                    "keepBoundariesWithNoPoints": keep_empty_boundaries,
                                    "summaryFields": summary_fields,
                                    "groupByField": group_field_name,
                                    "polygonLayer": summary_boundary_layer}
                

            aggregate_output = AnalysisUtils.initialize_output_layer(summary_boundary_layer.count,
                                                                    "aggregatedPolygons",
                                                                    hw_wkspc=hw_wkspc)
            if group_field_name:
                aggregate_table = AnalysisUtils.initialize_output_layer(summary_boundary_layer.count,
                                                                        "summaryTable",
                                                                        hw_wkspc=hw_wkspc)
            else:
                aggregate_table = None

        self.executor: APExecutor = APExecutor(summary_layer, summary_boundary_layer,
                                               aggregate_output, aggregate_table,
                                               summary_fields, group_field_name,
                                               bin_type, bin_size, bin_size_units,
                                               calc_min_majority,  # type: ignore
                                               percent_shp,  # type: ignore
                                               keep_empty_boundaries)

    def set_visualization(self):
        """Implement the abstractmethod of set_visualization."""
        if self.is_running_in(PAEnvironment.MODELBUILDER):
            units = AnalysisUtils.get_units_in_mb(True)
        else:
            units = AnalysisUtils.get_units(arcpy.GetPortalDescription(), True)
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
            (res_idx, gbs_idx) = (12, 13) if self.version < 2.0 else (13, 14)
            publisher = FSECPublisher(self.output_name, tool_version=self.version)
            publisher.add_layer_to_publish(self.executor.output_lyr, res_idx,
                                           "Aggregated Polygons", layer_index=0)
            if self.executor.groupby_stat_output:
                publisher.add_layer_to_publish(self.executor.groupby_stat_output, gbs_idx,
                                               "groupbySummary", layer_index=1)
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
    """Entry point for AggregatePoints tool."""
    tool_initialized = False
    try:
        ap_tool = APTool(TASK_NAME, output_name_index=output_name_idx,
                         context_index=context_idx,
                         version=version)
        tool_initialized = True
        ap_tool.run()
    except Exception as err:  # noqa. pylint: disable=broad-except
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
    finally:
        if tool_initialized:
            ap_tool.clean()  # type: ignore
