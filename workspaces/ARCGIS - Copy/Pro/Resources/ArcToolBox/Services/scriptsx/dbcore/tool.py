"""DissolveBoundaries tool implementation."""
import os

import arcpy

from common import (PATool, PAFeatureLayer, SimpleRenderer,
                    FeatureServiceLayerPublisher, LogUtils, AnalysisUtils,
                    ParameterUnpackMixin, ModelBuilderMixin,
                    PAErrorProcessor, FieldUtils, LogExecutionTime,
                    PAEnvironment, AOLUtils)
from .executor import DBExecutor


TASK_NAME = "DissolveBoundaries"
ERROR_CODES = [100004, 100024, 728, 100003, 100355, 308]
LOGGER = LogUtils.setup_logger(__name__)


class DBTool(ModelBuilderMixin, ParameterUnpackMixin, PATool):
    """Implement the DissolveBoundaries tool."""

    def get_parameters(self):
        input_lyr = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                "parameterName": "inputLayer",
                                                "defaultLayerName": "Input Features"})
        self.check_overwrite_sr(input_lyr.spatialReference)  # type: ignore
        (dissolve_fields, summary_fields, part_features) = self.unpack([1, 2, 3], as_text=False)
        self.calc_shp_area = True
        if self.version >= 2.0:
            self.calc_shp_area: bool = self.get_param(6)

        if self.is_running_in(PAEnvironment.MODELBUILDER):
            output_lyr = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(6))
            area_units = AnalysisUtils.get_units_in_mb(True)
        else:
            area_units = AnalysisUtils.get_units(self.portal_description, polygon_units=True)
            self.cost_parameters = {"inputLayer": input_lyr,
                                    "dissolveFields": dissolve_fields,
                                    "summaryFields": summary_fields}

            hw_wspc = None
            if input_lyr.contains_field_type("TimestampOffset"):
                hw_wspc = AOLUtils.get_scratch_wkspc()

            output_lyr = AnalysisUtils.initialize_output_layer(input_lyr.count,
                                                               "DissolvedOutput",
                                                               hw_wkspc=hw_wspc)
        self.executor: DBExecutor = DBExecutor(input_lyr, dissolve_fields, summary_fields,
                                               part_features, output_lyr,
                                               area_units)

    def set_visualization(self):
        if self.calc_shp_area:
            with LogExecutionTime("Create ShapeArea Field:"):
                FieldUtils.create_shape_area_field(self.executor.output_lyr, self.executor.area_units)
        renderer = SimpleRenderer(self.executor.output_lyr, self.task_name)
        self.executor.output_lyr.set_drawing(renderer)

    def publish_outputs(self):
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
        out_idx = 6 if self.version < 2.0 else 7
        publisher.add_layer_to_publish(self.executor.output_lyr, out_idx,
                                       "DissolvedFeatures",
                                       layer_index=0)
        publisher.publish()

    def log_usage_metering(self):
        dfc = len(self.executor.dissolve_fields) if self.executor.dissolve_fields else 0
        sfc = len(self.executor.summary_fields) if self.executor.summary_fields else 0
        values = [self.executor.input_lyr.count, dfc, sfc, self.output_name.output_cost]
        LogUtils.log_usage(self.task_name, self.executor.input_lyr.count,
                           self.executor.input_lyr.count * 0.001,
                           values)


def execute_tool(version: float):
    """Entry point for DissolveBoundaries tool."""
    try:
        db_tool = DBTool(TASK_NAME, output_name_index=4,
                         context_index=5,
                         version=version)
        db_tool.run()
    except Exception as err:
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err,
                         {3911: lambda _ : LOGGER.error(308, extra={"message_ID": 308})}).process()
