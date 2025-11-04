"""SummarizeCenterAndDispersion tool implementaion"""

import os
import arcpy
from .scdexecutor import SCDExecutor
from common import (PATool, PAFeatureLayer, FeatureServiceLayerPublisher,
                    LogUtils, ModelBuilderMixin, PAErrorProcessor,
                    ParameterUnpackMixin, PAEnvironment, AnalysisUtils, AOLUtils,
                    PAOutputFeatureLayer)

PARAM_NAMES = {
    "analysisLayer": 0,
    "summarizeType": 1,
    "ellipseSize": 2,
    "weightField": 3,
    "groupField": 4,
    "outputName": 5,
    "context": 6,
    "CentralFeatureResultLayer": 7,
    "MeanCenterResultLayer": 8,
    "MedianCenterResultLayer": 9,
    "EllipseResultLayer": 10
    }

OUTPUT_INDEX = {
    "CentralFeature": 7,
    "MeanCenter": 8,
    "MedianCenter": 9,
    "Ellipse": 10
}

CENTER_DRAW_INFO = {"esriGeometryPoint": {"renderer": {"type": "simple",
                                "symbol": {"type": "esriSMS",
                                           "style": "esriSMSCircle",
                                           "color": [38, 204, 255, 255],
                                           "size": 18,
                                           "angle": 0,
                                           "xoffset": 0,
                                           "yoffset": 0,
                                           "outline": {"color": [54, 93, 141, 255], "width": 1}}}},
                    "esriGeometryMultipoint": {"renderer": {"type": "simple",
                                "symbol": {"type": "esriSMS",
                                           "style": "esriSMSCircle",
                                           "color": [38, 204, 255, 255],
                                           "size": 18,
                                           "angle": 0,
                                           "xoffset": 0,
                                           "yoffset": 0,
                                           "outline": {"color": [54, 93, 141, 255], "width": 1}}}},
             "esriGeometryPolyline": {"renderer":{"type":"simple",
                                        "symbol": {"type": "esriSLS",
                                                   "style": "esriSLSSolid",
                                                   "color": [38,204,255,255],
                                                   "width": 2}}},
             "esriGeometryPolygon":{"renderer":{"type": "simple",
                                       "symbol": {"type": "esriSFS",
                                                  "style": "esriSFSSolid",
                                                  "color": [38,204,255,255],
                                                  "outline": {
                                                      "type": "esriSLS",
                                                      "style": "esriSLSSolid",
                                                      "color": [54,93,141,255],
                                                      "width": 1.5}}},
                           "transparency":25
                           }
             }

MEDIAN_DRAW_INFO = {
	"renderer": {
		"type": "simple",
		"symbol": {
			"type": "esriSMS",
			"style": "esriSMSCircle",
			"color": [255, 247, 51, 255],
			"size": 18,
			"angle": 0,
			"xoffset": 0,
			"yoffset": 0,
			"outline": {
				"color": [54, 93, 141, 255],
				"width": 1
			}
		}
	}
}

MEAN_DRAW_INFO = {
	"renderer": {
		"type": "simple",
		"symbol": {
			"type": "esriSMS",
			"style": "esriSMSCircle",
			"color": [51, 242, 0, 255],
			"size": 18,
			"angle": 0,
			"xoffset": 0,
			"yoffset": 0,
			"outline": {
				"color": [54, 93, 141, 255],
				"width": 1
			}
		}
	}
}

ELLIPSE_DRAW_INFO = {
    "renderer": {
        "type": "simple",
        "symbol": {
            "type": "esriSFS",
            "style": "esriSFSSolid",
            "color": [0, 0, 0, 0],
            "outline": {
                "type": "esriSLS",
                "style": "esriSLSSolid",
                "color": [230, 51, 255, 255],
                "width": 2.5
            }
        }
    }, "transparency": 0
}

LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "SummarizeCenterAndDispersion"
ERROR_CODES = [308, 401, 898, 978, 100261]


class SCDTool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implement the Summarize Center and Dispersion"""
    def get_parameters(self):
        """Overwrite the abstract method of get_parameters"""
        self.input_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                  "parameterName": "inputLayer"})
        self.check_overwrite_sr(self.input_layer.spatialReference)  # type: ignore

        (summarize_type, ellipse_size, weight_field, group_field) = self.unpack([1, 2, 3, 4],
                                                                                as_text=False)
        output_layer = []
        for sum_type in summarize_type:
            if self.is_running_in(PAEnvironment.MODELBUILDER):
                idx = OUTPUT_INDEX[sum_type]
                output_layer.append(AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(idx)))
            else:
                output_path = AOLUtils.create_unique_name(f"{sum_type}Output", arcpy.env.scratchGDB)
                output_layer.append(PAOutputFeatureLayer(output_path))
        self.executor: SCDExecutor = SCDExecutor(self.input_layer, summarize_type,
                                                 ellipse_size, weight_field,
                                                 group_field, output_layer)
        
        self.cost_parameters = {"analysisLayer": self.input_layer}

    def set_visualization(self):
        """Set the renderer to the output_layer."""
        for i in range (len(self.executor.sum_type_list)):
            summary_type = self.executor.sum_type_list[i]
            if summary_type == 'CentralFeature':
                drawing_info = CENTER_DRAW_INFO["esriGeometry" + self.executor.output_layer[i].shapeType]
            elif summary_type == 'MeanCenter':
                drawing_info = MEAN_DRAW_INFO
            elif summary_type == 'MedianCenter':
                drawing_info = MEDIAN_DRAW_INFO
            else:
                drawing_info = ELLIPSE_DRAW_INFO
                
            self.executor.output_layer[i].set_drawing(None, drawing_info)

    def publish_outputs(self):
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
        for i in range(len(self.executor.sum_type_list)):
            summary_type = self.executor.sum_type_list[i]
            layer_name = summary_type + "Layer"
            publisher.add_layer_to_publish(self.executor.output_layer[i],
                    PARAM_NAMES[summary_type + "ResultLayer"], layer_name,
                    layer_index=i)
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        values = [self.input_layer.shapeType,
                  self.input_layer.count,
                  self.output_name.output_cost]
        cost = self.input_layer.count * 0.001
        num_layers = len(self.executor.output_layer)
        LogUtils.log_usage(self.task_name, num_layers * self.executor.output_layer[0].count,
                           cost, values)


def execute_tool(version: float):
    """Entry of Summarize Center and Deispersion tool."""
    try:
        scd_tool = SCDTool(TASK_NAME, output_name_index=5, context_index=6,
                           version=version)
        scd_tool.run()
    except Exception as err: #Exception as err:  # noqa. pylint: disable=broad-except
        # Show error messages associate with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
