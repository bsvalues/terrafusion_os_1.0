"""CreateThresholdArea tool implementation."""
# import from common package. noqa. pylint: disable=import-error
import arcpy

from common import (PATool, PAFeatureLayer, LogUtils,
                    FeatureServiceLayerPublisher,
                    ParameterUnpackMixin, SimpleRenderer,
                    ModelBuilderMixin, AnalysisUtils,
                    AOLUtils)

from .ctaexecutor import CTAExecutor


LOGGER = LogUtils.setup_logger(__name__)


class CTATool(ModelBuilderMixin, ParameterUnpackMixin, PATool):
    """Implementation of the CreateThresholdArea tool"""

    def get_parameters(self):
        input_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                  "parameterName": "inputLayer"})
        self.check_overwrite_sr(input_layer.spatialReference)  # type: ignore
        param_map = {
            "inputLayer": 0,
            "idField": 1,
            "thresholdVariable": 2,
            "thresholdValues": 3,
            "thresholdExpression": 4,
            "distanceType": 5,
            "distanceUnits": 6,
            "maxIterations": 7,
            "travelDirection": 8,
            "timeOfDay": 9,
            "timeZoneForTimeOfDay": 10,
            "polygonDetail": 11,
            "minimumStep": 12,
            "targetPercentDifference": 13,
            "outputName": 14,
            "context": 15,
            "useData": 16,
            "resultLayer": 17
        }

        id_field = self.get_param_as_text(param_map["idField"])
        thres_var = self.get_param_as_text(param_map["thresholdVariable"])
        thres_val = self.get_param_as_text(param_map["thresholdValues"])
        thres_expr = self.get_param_as_text(param_map["thresholdExpression"])
        dist_type = self.get_param_as_text(param_map["distanceType"])
        dist_units = self.get_param_as_text(param_map["distanceUnits"])
        max_iterations = self.get_param_as_text(param_map["maxIterations"])
        travel_direction = self.get_param_as_text(param_map["travelDirection"])
        time_of_day = self.get_param_as_text(param_map["timeOfDay"])
        time_zone_for_time_of_day = self.get_param_as_text(param_map["timeZoneForTimeOfDay"])
        polygon_detail = self.get_param_as_text(param_map["polygonDetail"])
        minimum_step = self.get_param_as_text(param_map["minimumStep"])
        target_percent_difference = self.get_param_as_text(param_map["targetPercentDifference"])
        use_data = self.get_param_as_text(param_map["useData"])

        # cost_parameters is used to estimate/log cost
        self.cost_parameters = {"inputLayer": input_layer,
                                "distanceType": dist_type,
                                "thresholdVariable": thres_var,
                                "thresholdValues": thres_val,
                                "distanceUnits": dist_units}

        output_layer = AnalysisUtils.initialize_output_layer(None,
                                                             "resultLayer",
                                                             AOLUtils.get_scratch_wkspc())
        self.executor : CTAExecutor = CTAExecutor(input_layer=input_layer,
                                                  output_layer=output_layer,
                                                  threshold_variable=thres_var,
                                                  threshold_vals=thres_val,
                                                  threshold_expression=thres_expr,
                                                  dist_type=dist_type,
                                                  dist_units=dist_units,
                                                  id_field=id_field,
                                                  travel_direction=travel_direction,
                                                  tod=time_of_day,
                                                  timezone_for_tod=time_zone_for_time_of_day,
                                                  polygon_detail=polygon_detail,
                                                  max_iterations=max_iterations,
                                                  min_step=minimum_step,
                                                  target_perc_diff=target_percent_difference,
                                                  use_data=use_data)

    def set_visualization(self):
        """Set the renderer to the output_layer."""
        renderer = SimpleRenderer(self.executor.output_layer, self.task_name)
        self.executor.output_layer.set_drawing(renderer)

    def publish_outputs(self):
        """Publish the outputs as a feature service."""
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
        publisher.add_layer_to_publish(self.executor.output_layer, 17,
                                       "CreateThresholdAreasOutput", layer_index=0)
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        values = [self.executor.input_layer.shapeType,
                  self.executor.input_layer.count,
                  self.output_name.output_cost]
        cost = self.executor.input_layer.count * 0.001
        LogUtils.log_usage(self.task_name, self.executor.output_layer.count, cost, values)
