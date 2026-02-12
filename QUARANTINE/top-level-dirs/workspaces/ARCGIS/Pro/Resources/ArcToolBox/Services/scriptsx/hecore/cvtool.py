"""CreateViewshed tool implementation"""
# import from common package. noqa. pylint: disable=import-error
import os

from common import (PATool, PAFeatureLayer, SimpleRenderer, PAErrorProcessor,
                    LogUtils, NoCostMixin, ParameterUnpackMixin,
                    ModelBuilderMixin, FeatureServiceLayerPublisher,
                    PAEnvironment, AnalysisUtils)
from .executor import CVExecutor


LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "CreateViewshed"
ERROR_CODES = [100024, 100035, 100048, 100091, 100120, 100131, 100132, 100133, 100142, 100143]


class CVTool(ParameterUnpackMixin, ModelBuilderMixin, NoCostMixin, PATool):
    """Implement the CreateViewShed tool."""

    def get_parameters(self):
        """Overwrite the abstractmethod of get_parameters."""
        remote_server_ver = self.get_remote_server_version("elevation")
        input_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                  "parameterName": "inputLayer"},
                                     use_as_soap_input=True,
                                     remote_server_version=remote_server_ver)
        self.check_overwrite_sr(input_layer.spatialReference)  # type: ignore
        (dem_resolution, max_distance_units, obs_height_units, target_height_units) = self.unpack([1, 3, 5, 7],
                                                                                                  as_text=True,
                                                                                                  default_empty_val="#")
        (max_distance, obs_height, target_height, generalization) = self.unpack([2, 4, 6, 8],
                                                                                as_text=False,
                                                                                default_empty_val=["#", "#", "#", None])

        if self.is_running_in(PAEnvironment.MODELBUILDER):
            output_layer = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(11))
        else:
            output_layer = AnalysisUtils.initialize_output_layer(input_layer.count,
                                                                 "CVOutput",
                                                                 hw_wkspc=None)
        self.executor: CVExecutor = CVExecutor(input_layer, output_layer, dem_resolution,
                                               max_distance, max_distance_units,
                                               obs_height, obs_height_units,
                                               target_height, target_height_units,
                                               generalization,
                                               portal_description=self.portal_description)

    def set_visualization(self):
        """Set the renderer to the output_layer."""
        renderer = SimpleRenderer(self.executor.output_layer, self.task_name, transparency=30)
        self.executor.output_layer.set_drawing(renderer)

    def publish_outputs(self):
        """Publish the outputs as a feature service."""
        publisher = FeatureServiceLayerPublisher(self.output_name,
                                                 tool_version=self.version)
        publisher.add_layer_to_publish(self.executor.output_layer, 11, "ViewshedFeatures")
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        cost = 0
        values = [self.executor.input_layer.count,
                  self.executor.max_distance,
                  self.executor.obs_height,
                  self.executor.obs_height_units,
                  self.executor.target_height,
                  self.executor.target_height_units,
                  self.executor.generalization,
                  self.output_name.output_cost]
        LogUtils.log_usage(self.task_name, self.executor.output_layer.count, cost, values)


def execute_tool(version: float = 1):
    """Entry point for CreateViewshed tool."""
    try:
        cv_tool = CVTool(TASK_NAME, output_name_index=9, context_index=10,
                         version=version)
        cv_tool.run()
    except Exception as err:
        # Show error messages associate with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
