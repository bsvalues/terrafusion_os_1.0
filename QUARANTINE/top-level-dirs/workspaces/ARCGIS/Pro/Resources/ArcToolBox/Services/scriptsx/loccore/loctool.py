"""FindExistingLocations tool implementation."""
# import from common package. noqa. pylint: disable=import-error
import os
import json

import arcpy

from common import (PATool, PAFeatureLayerCollection,
                    FeatureServiceLayerPublisher,
                    LogUtils, AnalysisUtils,
                    SimpleRenderer,
                    ModelBuilderMixin,
                    PAErrorProcessor,
                    ParameterUnpackMixin,
                    PAEnvironment)
from .locexecutor import LOCExecutor


LOGGER = LogUtils.setup_logger(__name__)
ERROR_CODES = [100053, 100054, 100055, 100056, 100057, 100058,
               100059, 100060, 100049, 100024, 100262, 358,
               561]


class LocFindTool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implementation of FindExistingLocations tools."""
    def __init__(self, task_name: str, output_name_index: int, context_index: int,
                 version: float = 1.0,
                 call_from_fel: bool = True):
        if task_name.lower() == "findexistinglocations":
            self.overlay_output = False
        elif task_name.lower() == "derivenewlocations":
            self.overlay_output = True
        else:
            LOGGER.error("LocFindTool can only be used for FindExistingLocations and DeriveNewLocations tool.")
            raise TypeError
        self.call_from_fel = call_from_fel
        super(LocFindTool, self).__init__(task_name, output_name_index, context_index,
                                          version=version)

    def get_parameters(self):
        """Load parameters of the tool."""
        input_layers = PAFeatureLayerCollection(0, metadata={"parameterDataType": "Feature Set",
                                                             "parameterName": "inputLayers"})
        if len(input_layers.data):
            self.check_overwrite_sr(input_layers.data[0].spatialReference)  # type: ignore
        expressions = json.loads(self.get_param_as_text(1))

        self.out_param_idx = 5
        if self.version < 2.0 and self.overlay_output and not self.call_from_fel:
            self.out_param_idx = 4
        if self.is_running_in(PAEnvironment.MODELBUILDER):
            result_layer = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(self.out_param_idx))
        else:
            result_layer = AnalysisUtils.initialize_output_layer(input_layers.data[0].count,
                                                                 "resultLayer")
            self.cost_parameters = {"inputLayers": input_layers.count, "expressions": expressions}
        self.executor: LOCExecutor = LOCExecutor(input_layers, expressions, result_layer,
                                                 derive_new_loc=self.overlay_output)

    def set_visualization(self):
        """Set the renderer to the output."""
        renderer = SimpleRenderer(self.executor.output_layer, self.task_name)
        self.executor.output_layer.set_drawing(renderer)

    def publish_outputs(self):
        """Publish the outputs as a feature service."""
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
        output_fs_name = "DeriveNewLocationsOutput" if self.overlay_output else "FindExistingLocationsOutput"
        publisher.add_layer_to_publish(self.executor.output_layer, self.out_param_idx,
                                       output_fs_name, layer_index=0)
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        layerCount = len(self.executor.input_layers.data)
        cost = self.executor.input_layers.count * 0.001
        values = [layerCount, self.executor.input_layers.count]
        LogUtils.log_usage(self.task_name, self.executor.input_layers.count, cost, values)


def execute_tool(task_name: str, outputname_index: int, context_index: int,
                 version: float):
    try:
        if version != 1.0 and version != 1.1:
            run_as_fel: bool = arcpy.GetParameter(2)
            call_from_fel = True
        elif task_name == "DeriveNewLocations":
            run_as_fel = False
            call_from_fel = False
        else:
            run_as_fel: bool = arcpy.GetParameter(4) == False
            call_from_fel = True
        
        if run_as_fel:
            task_name = "FindExistingLocations"
        else:
            task_name = "DeriveNewLocations"

        loc_tool = LocFindTool(task_name, output_name_index=outputname_index,
                               context_index=context_index,
                               version=version,
                               call_from_fel=call_from_fel)
        loc_tool.run()
    except Exception as err:
        # Show error messages associate with the tool
        PAErrorProcessor(task_name, ERROR_CODES, err).process()
