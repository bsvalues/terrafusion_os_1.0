"""TraceDownstreams tool implementation"""
# import from common package. noqa. pylint: disable=import-error
import os

import arcpy

from common import (PATool, PAFeatureLayer, SimpleRenderer,
                    PAErrorProcessor, NoCostMixin,
                    FieldUtils, LogUtils,
                    Renderer, ModelBuilderMixin,
                    GraduatedColorsRenderer,
                    ParameterUnpackMixin,
                    FeatureServiceLayerPublisher,
                    PAEnvironment, AnalysisUtils)
from .executor import TDExecutor


__all__ = ["TDTool"]
LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "TraceDownstream"
ERROR_CODES = [100008, 100035, 100048, 100091, 100122, 100126, 100127, 100128, 100134, 100143]


class TDTool(ParameterUnpackMixin, ModelBuilderMixin, NoCostMixin, PATool):
    """Implement the TraceDownstream tool."""

    def get_parameters(self):
        """Overwrite the abstractmethod of get_parameters."""
        remote_server_ver = self.get_remote_server_version("hydrology")
        input_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                  "parameterName": "inputLayer"},
                                     use_as_soap_input=True,
                                     remote_server_version=remote_server_ver)
        self.check_overwrite_sr(input_layer.spatialReference)  # type: ignore
        (sdist, sunits, mdist, mdu, sdb, grl) = self.unpack([1, 2, 3, 4, 6, 7],
                                                            as_text=True,
                                                            default_empty_val=["#", "#", "#", "#", "FINEST", "True"])
        bounding_poly_layer = PAFeatureLayer(5, metadata={"parameterDataType": "Feature Set",
                                                          "parameterName": "boundingPolygonLayer",
                                                          "parameterType": "Optional"})

        if self.is_running_in(PAEnvironment.MODELBUILDER):
            output_layer = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(10))
        else:
            output_layer = AnalysisUtils.initialize_output_layer(input_layer.count,
                                                                 "CVOutput",
                                                                 hw_wkspc=None)
        self.executor: TDExecutor = TDExecutor(input_layer, output_layer,
                                               sdist, sunits,
                                               mdist, mdu,
                                               bounding_poly_layer, sdb,
                                               grl, self.portal_description)

    def set_visualization(self):
        """Set the renderer to the output_layer."""
        if self.executor.output_render_flag == 0:
            todist_fieldname = FieldUtils.get_field_name(self.executor.output_layer.fields, "ToDistance")
            renderer = GraduatedColorsRenderer(self.executor.output_layer,
                                               todist_fieldname)
            drawing_json = renderer.get_drawing_json()
            lbl_info = Renderer.get_drawing_from_json("td_line_symbol.json")
            lbl_info["labelExpression"] = f"[{todist_fieldname}]"
            drawing_json["labelingInfo"] = [lbl_info]
            self.executor.output_layer.set_drawing(None, drawing_json)
        else:
            renderer = SimpleRenderer(self.executor.output_layer, self.task_name)
            self.executor.output_layer.set_drawing(renderer)

    def publish_outputs(self):
        """Publish the outputs as a feature service."""
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
        publisher.add_layer_to_publish(self.executor.output_layer, 10, "TraceFeatures")
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        poly_name = "None"
        if self.executor.bounding_poly_layer:
            poly_name = self.executor.bounding_poly_layer.layer_name

        values = [self.executor.input_layer.count,
                  self.executor.split_distance,
                  self.executor.split_units,
                  self.executor.max_distance,
                  self.executor.max_distance_units,
                  poly_name,
                  self.executor.source_database,
                  self.executor.generalize,
                  self.output_name.output_cost]
        cost = 0
        LogUtils.log_usage(self.task_name, self.executor.input_layer.count, cost, values)


def execute_tool(version: float = 1):
    """Entry point for TraceDownstream tool."""
    try:
        td_tool = TDTool(TASK_NAME, output_name_index=8, context_index=9,
                         version=version)
        td_tool.run()
    except Exception as err:
        # Show error messages associate with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
