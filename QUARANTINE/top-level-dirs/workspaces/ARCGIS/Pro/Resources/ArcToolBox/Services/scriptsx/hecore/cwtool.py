"""CreateWatersheds tool implementation"""
# import from common package. noqa. pylint: disable=import-error
import os

import arcpy

from common import (PATool, PAFeatureLayer, SimpleRenderer, UniqueValueRenderer,
                    PAErrorProcessor, LogUtils, FeatureServiceLayerPublisher,
                    NoCostMixin, ModelBuilderMixin, ParameterUnpackMixin,
                    PAEnvironment, AnalysisUtils)
from .executor import CWExecutor


__all__ = ["CWTool"]
LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "CreateWatersheds"
ERROR_CODES = [100035, 100048, 100091, 100123, 100126, 100127, 100129, 100130, 100143]


class CWTool(ParameterUnpackMixin, ModelBuilderMixin, NoCostMixin, PATool):
    """Implement the CreateWatersheds tool."""

    def get_parameters(self):
        """Overwrite the abstractmethod of get_parameters."""
        remote_server_ver = self.get_remote_server_version("hydrology")
        input_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                  "parameterName": "inputLayer"},
                                     use_as_soap_input=True,
                                     remote_server_version=remote_server_ver)
        self.check_overwrite_sr(input_layer.spatialReference)  # type: ignore
        (s_dist, s_units, sdb, generalize) = self.unpack([1, 2, 3, 4],
                                                         as_text=[True, True, True, False],
                                                         default_empty_val=["#", "#", "FINEST", "True"])

        if self.is_running_in(PAEnvironment.MODELBUILDER):
            ws_output_lyr = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(7))
            sp_output_lyr = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(8))
        else:
            ws_output_lyr = AnalysisUtils.initialize_output_layer(input_layer.count,
                                                                  "WaterShedOutput",
                                                                  hw_wkspc=None)
            sp_output_lyr = AnalysisUtils.initialize_output_layer(input_layer.count,
                                                                  "SnapPointOutput",
                                                                  hw_wkspc=None)
        self.executor: CWExecutor = CWExecutor(input_layer,
                                               ws_output_lyr,
                                               sp_output_lyr,
                                               s_dist, s_units,
                                               sdb, generalize,
                                               self.portal_description)

    def set_visualization(self):
        """Set the renderer to the output_layer."""
        ws_renderer = UniqueValueRenderer(self.executor.watershed_output,
                                          transparency=30,
                                          unique_value_fields=["PourPtID"])
        self.executor.watershed_output.set_drawing(ws_renderer)
        sp_renderer = SimpleRenderer(self.executor.snappoint_output, self.task_name)
        self.executor.snappoint_output.set_drawing(sp_renderer)

    def publish_outputs(self):
        """Publish the outputs as a feature service."""
        publisher = FeatureServiceLayerPublisher(self.output_name,
                                                 tool_version=self.version)
        publisher.add_layer_to_publish(self.executor.watershed_output, 8,
                                       "WatershedFeatures", layer_index=0)
        publisher.add_layer_to_publish(self.executor.snappoint_output, 7,
                                       "Adjusted Points", layer_index=1)
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        values = [self.executor.input_layer.count,
                  self.executor.search_distance,
                  self.executor.search_units,
                  self.executor.source_database,
                  self.executor.generalize,
                  self.output_name.output_cost]
        cost = 0
        LogUtils.log_usage(self.task_name, self.executor.input_layer.count, cost, values)


def execute_tool(version: float = 1):
    """Entry point for CreateWatersheds tool."""
    try:
        cw_tool = CWTool(TASK_NAME, output_name_index=5, context_index=6,
                         version=version)
        cw_tool.run()
    except Exception as err:
        # Show error messages associate with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
