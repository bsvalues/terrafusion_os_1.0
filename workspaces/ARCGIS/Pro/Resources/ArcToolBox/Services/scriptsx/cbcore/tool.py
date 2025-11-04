"""CreateBuffers tool implementation."""
# pylint: disable=C0411, C0413
# functions called implicitly in __init__. noqa. pylint: disable=attribute-defined-outside-init
# noqa. pylint: disable=logging-format-interpolation
# Use properties of executor. pylint: disable=E1101
# import from common package. noqa. pylint: disable=import-error

from .executor import CBExecutor
from common import (PATool, PAFeatureLayer, FieldUtils, LogExecutionTime,
                    AnalysisUtils, LogUtils, SimpleRenderer, UniqueValueRenderer,
                    FeatureServiceLayerPublisher, ModelBuilderMixin,
                    ParameterUnpackMixin, PAErrorProcessor, PAEnvironment,
                    AOLUtils)

LOGGER = LogUtils.setup_logger(__name__)

TASK_NAME = "CreateBuffers"
ERROR_CODES = [26, 109, 728, 100024, 539]


class CBTool(ModelBuilderMixin, ParameterUnpackMixin, PATool):
    """Provides execution logic for create buffers tool."""

    def get_parameters(self):
        """Implement the abstractmethod of get_parameters."""
        # Create an instance of PAFeatureLayer from the first parameter.
        input_layer: PAFeatureLayer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                                  "parameterName": "inputLayer"})
        self.check_overwrite_sr(input_layer.spatialReference)  # type: ignore
        indexes = [i for i in range(1, 8)]
        (dists, field, units, dissolve_type, ring_type, side_type, end_type) = self.unpack(param_indexes=indexes,
                                                                                           as_text=True)
        self.calc_shp_area = True
        if self.version >= 2.0:
            self.calc_shp_area: bool = self.get_param(10)
        dists = dists.split(";")
        dissolve_type = dissolve_type.lower()
        ring_type = ring_type.lower()
        side_type = side_type.lower()
        end_type = end_type.lower()
        if self.is_running_in(PAEnvironment.MODELBUILDER):
            buffered_output = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(10))
        else:
            if (
                len(dists) > 1
                and ring_type == "rings"
                and (not dissolve_type or dissolve_type != "none")
            ):
                hw_wpc = AOLUtils.get_scratch_wkspc()
            else:
                hw_wpc = AOLUtils.get_output_wkspcx(input_layer.count)
            buffered_output = AnalysisUtils.initialize_output_layer(input_layer.count,
                                                                    "BufferedOutput",
                                                                    hw_wkspc=hw_wpc)

            # This dict serves implicitly as the input for cost logging.
            self.cost_parameters = {"inputLayer": input_layer,
                                    "distances": dists,
                                    "field": field,
                                    "units": units,
                                    "dissolveType": dissolve_type,
                                    "ringType": ring_type,
                                    "sideType": side_type,
                                    "endType": end_type}
        self.executor: CBExecutor = CBExecutor(input_layer, buffered_output,  # type: ignore
                                               dists, field, units,
                                               dissolve_type, ring_type,
                                               side_type, end_type)

    def set_visualization(self):
        """Set the renderer to the output layer before publish.

        Returns:
            A dictionary keyed by the absolute path of the outputs to be published and valued by the drawing info.

        """
        if "meters" in self.executor.units.lower():
            units = "SquareKilometers"
        else:
            units = "SquareMiles"

        if self.calc_shp_area:
            with LogExecutionTime("Create ShapeArea Field:"):
                LOGGER.debug(f"units: {units}")
                FieldUtils.create_shape_area_field(self.executor.output_layer, units)

        if len(self.executor.distances) > 1:
            renderer = UniqueValueRenderer(self.executor.output_layer, 50, ["BUFF_DIST"])
        else:
            renderer = SimpleRenderer(self.executor.output_layer, self.task_name)
        self.executor.output_layer.set_drawing(renderer)

    def publish_outputs(self):
        """Publish the outputs as a feature service.

        Raises:
            Error if publish output fails.

        """
        # Create a FeatureServiceLayerPublisher with the output_name property.
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
        out_idx = 10 if self.version < 2.0 else 11
        publisher.add_layer_to_publish(self.executor.output_layer, out_idx, "BufferedFeatures",
                                       layer_index=0)
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        cost_factor = 0.001
        dissolve_cost = {'Dissolve': 2, 'Split': 3}
        cost = self.executor.output_layer.count * cost_factor

        values = [AnalysisUtils.get_shape_type_code(self.executor.output_layer),
                  self.executor.output_layer.count,
                  len(self.executor.distances),
                  dissolve_cost.get(self.executor.dissolve_type, 1),
                  self.output_name.output_cost]
        LogUtils.log_usage(self.task_name, self.executor.output_layer.count, cost, values)


def execute_tool(version: float):
    try:
        cb_tool = CBTool(TASK_NAME, output_name_index=8, context_index=9,
                         version=version)
        cb_tool.run()
    except Exception as err:
        # Show error messages associate with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err,
                         {52: lambda _ : LOGGER.error(100368, extra={"message_ID": 100368})}).process()
