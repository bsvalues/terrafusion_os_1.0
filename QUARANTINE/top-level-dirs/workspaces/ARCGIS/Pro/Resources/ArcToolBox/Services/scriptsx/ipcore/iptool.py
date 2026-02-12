"""InterpolatePoints tool implementation."""
# import from common package. noqa. pylint: disable=import-error
import arcpy

from common import (PATool, PAFeatureLayer, PAErrorProcessor,
                    FeatureServiceLayerPublisher, LogUtils,
                    ParameterUnpackMixin, AnalysisUtils,
                    FieldUtils, ModelBuilderMixin,
                    LogExecutionTime, AOLUtils,
                    PAEnvironment)

from .ipexecutor import IPExecutor, InterpOption
from .renderer import InterpRenderer, InterpContourRenderer, InterpPointsRenderer


LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "InterpolatePoints"
ERROR_CODES = [100008, 100091, 40039, 40040, 40069, 100092, 100093, 100104, 100024]


class IPTool(ModelBuilderMixin, ParameterUnpackMixin, PATool):
    """Implementation of the InterpolatePoints tool"""

    def get_parameters(self):
        input_lyr = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                "parameterName": "inputlayer"})
        self.check_overwrite_sr(input_lyr.spatialReference)  # type: ignore
        (field, interp_option, classification_type) = self.unpack(param_indexes=[1, 2, 4],
                                                                  as_text=True)
        interp_option = 5 if not interp_option else int(interp_option)
        interp_option = InterpOption(interp_option)
        (output_pred_err, num_classes, class_breaks) = self.unpack(param_indexes=[3, 5, 6],
                                                                   as_text=False)
        if class_breaks and isinstance(class_breaks, arcpy.ValueTable):
            cb_vals = []
            for i in range(class_breaks.rowCount):
                cb_vals.append(class_breaks.getValue(i, 0))
            class_breaks = cb_vals
        bounding_poly_lyr = PAFeatureLayer(7, metadata={"parameterDataType": "Feature Set",
                                                        "parameterName": "boundingPolygonLayer",
                                                        "parameterType": "Optional"})
        pred_point_lyr = PAFeatureLayer(8, metadata={"parameterDataType": "Feature Set",
                                                     "parameterName": "predictAtPointLayer",
                                                     "parameterType": "Optional"})
        self.calc_shp_area = True
        if self.version >= 2.0:
            self.calc_shp_area: bool = self.get_param(11)

        if self.is_running_in(PAEnvironment.MODELBUILDER):
            output_lyr = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(11))
            if output_pred_err:
                pred_err_lyr = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(12))
            else:
                pred_err_lyr = None
            
            if pred_point_lyr:
                pred_output_lyr = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(13))
            else:
                pred_output_lyr = None
        else:
            self.cost_parameters = {"inputLayer": input_lyr,
                                    "field": field,
                                    "interpolateOption": interp_option.value,
                                    "classificationType": classification_type,
                                    "numClasses": num_classes,
                                    "classBreaks": class_breaks,
                                    "boundingPolygonLayer": bounding_poly_lyr,
                                    "predictAtPointLayer": pred_point_lyr}

            output_lyr = AnalysisUtils.initialize_output_layer(input_lyr.count,
                                                            "interpolatedContours")
            if output_pred_err:
                pred_err_lyr = AnalysisUtils.initialize_output_layer(input_lyr.count,
                                                                    "Errors")
            else:
                pred_err_lyr = None

            if pred_point_lyr:
                hw_wkspc = AnalysisUtils.get_hw_wkspc(self.output_name)
                if hw_wkspc is None:
                    hw_wkspc = AOLUtils.get_output_wkspcx(pred_point_lyr.count)
                pred_output_lyr = AnalysisUtils.initialize_output_layer(pred_point_lyr.count,
                                                                        "PredictedPoints",
                                                                        hw_wkspc=hw_wkspc)
            else:
                pred_output_lyr = None

        self.executor: IPExecutor = IPExecutor(input_lyr, field, output_lyr, interp_option,
                                               classification_type, num_classes,
                                               class_breaks, bounding_poly_lyr,
                                               pred_point_lyr,
                                               output_pred_err,
                                               pred_err_lyr,
                                               pred_output_lyr)

    def set_visualization(self):
        renderer = InterpContourRenderer(self.executor.output_lyr, is_error_surface=False)
        self.executor.output_lyr.set_drawing(renderer)
        if self.calc_shp_area:
            with LogExecutionTime("Create ShapeArea Field:"):
                # add shape area field
                if self.is_running_in(PAEnvironment.MODELBUILDER):
                    units = AnalysisUtils.get_units_in_mb(True)
                else:
                    units = AnalysisUtils.get_units(self.portal_description, True)
                FieldUtils.create_shape_area_field(self.executor.output_lyr, units)

        if self.executor.pred_out_point_lyr:
            p_renderer = InterpPointsRenderer(self.executor.pred_out_point_lyr,
                                              renderer.get_drawing_json())
            self.executor.pred_out_point_lyr.set_drawing(p_renderer)

        if self.executor.pred_err_out:
            e_renderer = InterpContourRenderer(self.executor.pred_err_out, True)
            self.executor.pred_err_out.set_drawing(e_renderer)

    def publish_outputs(self):
        if self.version < 2.0:
            (res_out_idx, perr_idx, ppl_idx) = (11, 12, 13)
        else:
            (res_out_idx, perr_idx, ppl_idx) = (12, 13, 14)
        with arcpy.EnvManager(extent=None):
            publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
            publisher.add_layer_to_publish(self.executor.output_lyr, res_out_idx, "resultLayer", layer_index=0)
            if self.executor.pred_err_out:
                publisher.add_layer_to_publish(self.executor.pred_err_out, perr_idx,
                                               "predictionError", layer_index=1)
            if self.executor.pred_out_point_lyr:
                publisher.add_layer_to_publish(self.executor.pred_out_point_lyr, ppl_idx,
                                               "predictedPointLayer", layer_index=2)
            publisher.publish()

    def log_usage_metering(self):
        shp_code = AnalysisUtils.get_shape_type_code(self.executor.input_lyr)
        values = [shp_code, self.executor.input_lyr.count,
                  InterpRenderer.get_classification_code(self.executor.classification_type),
                  self.executor.num_classes,
                  self.output_name.output_cost]
        LogUtils.log_usage(self.task_name, self.executor.input_lyr.count,
                           self.executor.input_lyr.count * 0.001,
                           values)


def execute_tool(version: float):
    try:
        ip_tool = IPTool(TASK_NAME, output_name_index=9, context_index=10,
                         version=version)
        ip_tool.run()
    except Exception as err:
        # Show error messages associate with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
