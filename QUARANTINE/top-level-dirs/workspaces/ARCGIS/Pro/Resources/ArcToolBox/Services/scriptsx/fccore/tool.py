"""FindCentroids tool implementation."""
# pylint: disable=C0411, C0413
# Use properties of executor. pylint: disable=E1101
# Internal functions with attributes initialition implicitly called in __init__. pylint: disable=W0201
# import from common package. noqa. pylint: disable=import-error
import os

import arcpy

from .executor import FCExecutor

from common import (PATool, PAFeatureLayer, SimpleRenderer,
                    FeatureServiceLayerPublisher,
                    AnalysisUtils, LogUtils, ModelBuilderMixin,
                    PAErrorProcessor, ParameterUnpackMixin,
                    PAEnvironment)


LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "FindCentroids"
ERROR_CODES = [100254]


class FCTool(ModelBuilderMixin, ParameterUnpackMixin, PATool):
    """Implement the FindCentroids tool."""

    def get_parameters(self):
        """Overwrite the abstractmethod of get_parameters."""
        input_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                  "parameterName": "inputLayer"})
        self.check_overwrite_sr(input_layer.spatialReference)  # type: ignore
        point_location: bool = arcpy.GetParameter(1)  # type: ignore

        if self.is_running_in(PAEnvironment.MODELBUILDER):
            result_layer = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(4))
        else:
            self.cost_parameters = {"inputLayer": input_layer}
            result_layer = AnalysisUtils.initialize_output_layer(input_layer.count,
                                                                 "CentroidOutput")
        self.executor: FCExecutor = FCExecutor(input_layer, result_layer, point_location)

    def set_visualization(self):
        """Set the renderer to the output_layer."""
        renderer = SimpleRenderer(self.executor.output_layer, self.task_name)
        self.executor.output_layer.set_drawing(renderer)

    def publish_outputs(self):
        """Publish the outputs as a feature service."""
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
        publisher.add_layer_to_publish(self.executor.output_layer, 4, "FindCentroidsOutput", layer_index=0)
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        values = [self.executor.input_layer.shapeType,
                  self.executor.input_layer.count,
                  self.output_name.output_cost]
        cost = self.executor.input_layer.count * 0.001
        LogUtils.log_usage(self.task_name, self.executor.output_layer.count, cost, values)


def execute_tool(version: float = 1):
    """Entry of FindCentroids tool."""
    try:
        fc_tool = FCTool(TASK_NAME, output_name_index=2, context_index=3,
                         version=version)
        fc_tool.run()
    except Exception as err:  # noqa. pylint: disable=broad-except
        # Show error messages associate with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
