"""OverlayLayers tool implementation."""
# import from common package. noqa. pylint: disable=import-error
from common import (PATool, PAFeatureLayer, LogUtils, SimpleRenderer,
                    FeatureServiceLayerPublisher, AnalysisUtils,
                    ParameterUnpackMixin, PAErrorProcessor,
                    PAEnvironment, ModelBuilderMixin)
from .executor import OLExecutor


LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "OverlayLayers"
ERROR_CODES = [366, 385, 426, 438, 100024]


class OLTool(ModelBuilderMixin, ParameterUnpackMixin, PATool):
    """ Implementation of OverlayLayers tool. """

    def get_parameters(self):
        """Read in parameters."""
        input_layer = PAFeatureLayer(0, {"parameterDataType": "Feature Set",
                                         "parameterName": "inputLayer"})
        overlay_layer = PAFeatureLayer(1, {"parameterDataType": "Feature Set",
                                           "parameterName": "overlayLayer"})
        self.check_overwrite_sr(input_layer.spatialReference)  # type: ignore
        # indexes for overlap type, snap, output type, and snap tolerance, respectively 
        (oltype, snap, out_type, snap_tol) = self.unpack([2, 3, 4, 5],
                                                         as_text=[True, False, True, True],
                                                         default_empty_val=["INTERSECT", None, None, None])
        oltype = oltype.upper()
        if self.is_running_in(PAEnvironment.MODELBUILDER):
            output_layer = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(8))
        else:
            output_layer = AnalysisUtils.initialize_output_layer(input_layer.count,
                                                                 "OverlayOutput")
            self.cost_parameters = {"inputLayer": input_layer,
                                    "overlayLayer": overlay_layer,
                                    "overlayType": oltype}
        LOGGER.debug("Output features: {}".format(output_layer))

        
        self.executor: OLExecutor = OLExecutor(input_layer, overlay_layer,
                                               output_layer, oltype,
                                               snap,
                                               out_type,
                                               snap_tol)

    def set_visualization(self):
        """Set renderer to the output."""
        renderer = SimpleRenderer(self.executor.output_layer, self.task_name)
        self.executor.output_layer.set_drawing(renderer)

    def publish_outputs(self):
        """Publish the output as a feature service."""
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
        publisher.add_layer_to_publish(self.executor.output_layer, 8, "OverlayedFeatures", layer_index=0)
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        input_shape_code = AnalysisUtils.get_shape_type_code(self.executor.input_layer)
        overlay_shape_code = AnalysisUtils.get_shape_type_code(self.executor.overlay_layer)
        if self.executor.overlay_type == "UNION":
            overlay_type_cost = 2
        elif self.executor.overlay_type == "ERASE":
            overlay_type_cost = 3
        else:
            overlay_type_cost = 1

        values = [input_shape_code, self.executor.input_layer.count,
                  overlay_shape_code,
                  self.executor.overlay_layer.count,
                  overlay_type_cost,
                  self.output_name.output_cost]
        num_objects = self.executor.input_layer.count + self.executor.overlay_layer.count
        LogUtils.log_usage(self.task_name, num_objects, num_objects * 0.001, values)


def execute_tool(outputname_idx: int, context_idx: int, version: float):
    try:
        ol_tool = OLTool(TASK_NAME, output_name_index=outputname_idx,
                         context_index=context_idx,
                         version=version)
        ol_tool.run()
    except Exception as err:
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
