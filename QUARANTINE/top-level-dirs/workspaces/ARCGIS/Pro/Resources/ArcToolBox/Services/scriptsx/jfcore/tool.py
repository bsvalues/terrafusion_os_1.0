"""JoinFeatures tool implementation."""
# Use properties of executor. pylint: disable=no-member
# Internal functions with attributes initialization implicitly called in __init__. pylint: disable=W0201
# import from common package. noqa. pylint: disable=import-error
import os
import json
from typing import Union, Dict, List, Optional

import arcpy

from common import (PATool, PAFeatureLayer, SimpleRenderer,
                    FeatureServiceLayerPublisher, PAErrorProcessor,
                    AnalysisUtils, LogUtils, ParameterUnpackMixin,
                    ModelBuilderMixin, FieldUtils, AOLUtils,
                    PAEnvironment)
from .executor import JFExecutor


LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "JoinFeatures"
ERROR_CODES = [728, 100219, 100220, 100221, 100222, 100243, 100052, 100053,
               100245, 100004, 100005, 100006, 100244, 100044]


class JFTool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implement the JoinFeatures tool."""

    @classmethod
    def get_json_from_param(
        cls,
        parameter_index: int,
        param_name: str,
        is_multival: bool
    ) -> Optional[Union[List, Dict]]:
        """Unpack json from parameter."""
        param_json = None
        if not is_multival:
            param_val = cls.get_param_as_text(parameter_index)
            if not param_val:
                return param_json
            try:
                param_json = json.loads(param_val)
            except ValueError:
                LOGGER.error(100245, extra={"message_ID": 100245,
                                            "paramName": param_name})
                raise
        else:
            param_val = arcpy.GetParameter(parameter_index)
            if not param_val:
                return param_json
            param_json = []
            # from version 1.1, this parameter becomes ValueTable
            if isinstance(param_val, arcpy.ValueTable):
                try:
                    for row in range(param_val.rowCount):
                        if param_name == "summaryFields":
                            tmp_json = {"onStatisticField": param_val.getValue(row, 0),
                                        "statisticType": param_val.getValue(row, 1)}
                        else:
                            tmp_json = {"targetField": param_val.getValue(row, 0),
                                        "operator": "equal",
                                        "joinField": param_val.getValue(row, 1)}
                        if tmp_json not in param_json:
                            param_json.append(tmp_json)
                    if not param_json:
                        return None
                except arcpy.ExecuteError:
                    LOGGER.error(100245, extra={"message_ID": 100245,
                                                "paramName": param_name})
                    raise
            else:
                for pval in param_val:  # type: ignore
                    try:
                        pjson = json.loads(pval)
                        if pjson not in param_json:
                            param_json.append(pjson)
                    except ValueError:
                        LOGGER.error(100245, extra={"message_ID": 100245,
                                                    "paramName": param_name})
                        raise

        return param_json

    def get_parameters(self):
        """Load parameters."""
        target_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Record Set",
                                                   "parameterName": "targetLayer"})
        join_layer = PAFeatureLayer(1, metadata={"parameterDataType": "Record Set",
                                                 "parameterName": "joinLayer"})
        if not target_layer.is_table_view:
            self.check_overwrite_sr(target_layer.spatialReference)  # type: ignore
        (srel, srdist, srdu) = self.unpack([2, 3, 4], as_text=[True, False, False])
        if not srel:
            srel = None
        if not srdist:
            srdist = None
        if not srdu:
            srdu = None

        attr_rel = self.get_json_from_param(5, "attributeRelationship", True)
        (join_operation, join_type) = self.unpack([6, 11], as_text=True)
        LOGGER.debug(f"join_operation: {join_operation}")
        operation_vals = {"JoinOneToMany": "JOIN_ONE_TO_MANY",
                          "JoinOneToOne": "JOIN_ONE_TO_ONE"}
        join_operation = operation_vals[join_operation]
        summary_fields = self.get_json_from_param(7, "summaryFields", True)

        record_to_match = self.get_json_from_param(8, "recordToMatch", False)
        # workaround for issue: https://devtopia.esri.com/WebGIS/arcgis-portal-analysis/issues/648
        # where the OID changed to OID_ after copying into the in_memory database.
        hw_wkspc = None
        if FieldUtils.verify_field_exists(target_layer, "OID") or FieldUtils.verify_field_exists(join_layer, "OID"):
            hw_wkspc = AOLUtils.get_scratch_wkspc()
        if self.is_running_in(PAEnvironment.MODELBUILDER):
            result_layer = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(12))
        else:
            result_layer = AnalysisUtils.initialize_output_layer(target_layer.count,
                                                                "joinOutput",
                                                                hw_wkspc=hw_wkspc)
            self.cost_parameters = {"targetLayer": target_layer, "joinLayer": join_layer}

        self.executor: JFExecutor = JFExecutor(target_layer,
                                               join_layer,
                                               result_layer,
                                               srel,
                                               srdist,
                                               srdu,
                                               attr_rel,  # type: ignore
                                               join_operation,
                                               summary_fields,  # type: ignore
                                               record_to_match,  # type: ignore
                                               join_type)

    def set_visualization(self):
        """Set the renderer to the output_layer."""
        if not self.executor.target_layer.is_table_view:
            renderer = SimpleRenderer(self.executor.join_output, self.task_name)
            self.executor.join_output.set_drawing(renderer)

    def publish_outputs(self):
        """Publish the output as a feature service."""
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
        publisher.add_layer_to_publish(self.executor.join_output, 12, "outputLayer")
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        values = [self.executor.target_layer.count,
                  self.executor.join_layer.count,
                  self.executor.join_operation,
                  self.output_name.output_cost]
        num_obj = self.executor.target_layer.count + self.executor.join_layer.count
        cost = num_obj * 0.001
        LogUtils.log_usage(self.task_name, num_obj, cost, values)


def execute_tool(version: float):
    """Entry of JoinFeatures tool."""
    try:
        jf_tool = JFTool(TASK_NAME, output_name_index=9, context_index=10,
                         version=version)
        jf_tool.run()
    except Exception as err:  # noqa. pylint: disable=broad-except
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
