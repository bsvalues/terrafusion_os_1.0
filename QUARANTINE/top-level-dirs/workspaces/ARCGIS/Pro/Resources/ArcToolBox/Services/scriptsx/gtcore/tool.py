"""GenerateTessellations tool implementation."""
# noqa. pylint: disable=import-error
import arcpy

from common import (PATool, PAFeatureLayer, SimpleRenderer,
                    FeatureServiceLayerPublisher, LogUtils,
                    ModelBuilderMixin, AnalysisUtils,
                    ToolExit, PAErrorProcessor, PAEnvironment,
                    ParameterUnpackMixin, AOLUtils)

from .executor import GTExecutor


LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "GenerateTessellations"
ERROR_CODES = [100268, 100269]


class GTTool(ModelBuilderMixin, ParameterUnpackMixin, PATool):
    """Implementation of the GenerateTessellations tool"""

    def get_parameters(self):
        """Implementation of get_parameters abstract method."""
        extent_layer = PAFeatureLayer(3, {"parameterDataType": "Feature Set",
                                          "parameterName": "extentlayer",
                                          "parameterType": "Optional"},
                                      verify_feature_count=True,
                                      select_features_in_extent=False,
                                      for_extract=False,
                                      max_download_feature_count=None)
        context_text = self.get_param_as_text(6)
        shape_type = self.get_param_as_text(0).upper()
        size = self.get_param(1)
        if not self.get_param_as_text(1).strip():
            size = "#"
        size_unit = self.get_param_as_text(2) or "#"
        intersect_study_area = self.get_param(4)
        h3_resolution = None
        if shape_type == "H3_HEXAGON":
            h3_resolution = self.get_param(7)
            if h3_resolution is None or self.get_param_as_text(7).strip() == "":
                LOGGER.error(110346, extra={"message_ID": 110346})
                raise ToolExit
        elif size == "#":
            LOGGER.error(110347, extra={"message_ID": 110347})
            raise ToolExit

        if extent_layer:
            arcpy.env.extent = None  # type: ignore
            self.check_overwrite_sr(extent_layer.spatialReference)  # type: ignore
        else:
            if arcpy.env.extent is None:  # type: ignore
                LOGGER.error(100269, extra={"message_ID": 100269})
                raise ToolExit
            self.check_overwrite_sr(arcpy.env.extent.spatialReference)  # type: ignore

        if self.is_running_in(PAEnvironment.MODELBUILDER):
            result_layer = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(8))
        else:
            self.cost_parameters = {
                "binType": shape_type,
                "binSize": size,
                "binSizeUnit": size_unit
            }
            if h3_resolution:
                self.cost_parameters["binResolution"] = h3_resolution
            if extent_layer:
                self.cost_parameters["extentLayer"] = extent_layer.data
            else:
                self.cost_parameters["context"] = context_text
            result_layer = AnalysisUtils.initialize_output_layer(None,
                                                                 "resultLayer",
                                                                 AOLUtils.get_scratch_wkspc())

        self.executor: GTExecutor = GTExecutor(result_layer, shape_type,
                                               size, size_unit,
                                               arcpy.env.extent, extent_layer,  # type: ignore
                                               intersect_study_area,
                                               h3_resolution)

    def set_visualization(self):
        """Set the renderer to the output."""
        renderer = SimpleRenderer(self.executor.output_layer, self.task_name)
        self.executor.output_layer.set_drawing(renderer)

    def publish_outputs(self):
        """Publish the outputs as a feature service."""
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
        publisher.add_layer_to_publish(self.executor.output_layer, 8, "TessellationPolygons")
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        values = [self.executor.output_layer.shapeType,
                  self.executor.output_layer.count,
                  self.output_name.output_cost]
        cost = self.executor.output_layer.count * 0.001
        LogUtils.log_usage(self.task_name, self.executor.output_layer.count, cost, values)

    def log_cost(self):
        """Overwrite the cost_params."""
        self.cost_parameters = {"tessellationLayer": self.executor.output_layer.count,
                                "binType": self.executor.shape_type}
        LOGGER.debug(f"cost_parameters: {self.cost_parameters}")
        super().log_cost()


def execute_tool(version: float):
    """Entry of GenerateTessellation tool."""
    try:
        gt_tool = GTTool(TASK_NAME, output_name_index=5, context_index=6,
                         version=version)
        gt_tool.run()
    except Exception as err:
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
