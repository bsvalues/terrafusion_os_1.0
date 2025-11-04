"""MergeLayers tool implementation."""
# Methods implicitly called inside of constructor. noqa. pylint: disable=attribute-defined-outside-init
# noqa. pylint: disable=len-as-condition
# noqa. pylint: disable=import-error
import os
import json
from typing import List, Optional
import re

import arcpy
from .executor import MLExecutor

from common import (PATool, PAFeatureLayer, SimpleRenderer,
                    PAFeatureLayerCollection, AnalysisUtils,
                    FeatureServiceLayerPublisher, LogUtils,
                    ModelBuilderMixin, ToolExit,
                    PAErrorProcessor, AOLUtils,
                    PAEnvironment, ParameterUnpackMixin)


LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "MergeLayers"
ERROR_CODES = [468, 100024, 100301]


class MLTool(ModelBuilderMixin, ParameterUnpackMixin, PATool):
    """Provide core logic for MergeLayers tool."""

    @classmethod
    def unpack_merge_attr(
        cls,
        merge_val: Optional[arcpy.ValueTable],
        merge_lyrs_count: int,
        is_single_layer: bool
    ) -> List[List]:
        mattr = {}
        if merge_val:
            for row in range(merge_val.rowCount):
                tmp_row = {}
                if is_single_layer:
                    merge_lyr_id = 0  # type: ignore
                    if merge_lyr_id >= merge_lyrs_count:
                        LOGGER.error(110145, extra={"message_ID": 110145})
                        raise ToolExit
                    val0 = merge_val.getValue(row, 0)
                    val0 = str(val0) if not isinstance(val0, str) else val0
                    tmp_row["mergeLayerField"] = val0 # merge_val.getValue(row, 0)
                    tmp_row["mergeType"] = merge_val.getValue(row, 1).lower()  # type: ignore
                    if tmp_row["mergeType"] != "remove":
                        tmp_row["mergeValue"] = merge_val.getValue(row, 2)
                else:
                    merge_lyr_id: int = int(merge_val.getValue(row, 0))  # type: ignore
                    if merge_lyr_id >= merge_lyrs_count:
                        LOGGER.error(110145, extra={"message_ID": 110145})
                        raise ToolExit
                    tmp_row["mergeLayerField"] = merge_val.getValue(row, 1)
                    tmp_row["mergeType"] = merge_val.getValue(row, 2).lower()  # type: ignore
                    if tmp_row["mergeType"] != "remove":
                        tmp_row["mergeValue"] = merge_val.getValue(row, 3)

                if merge_lyr_id not in mattr:
                    mattr[merge_lyr_id] = [tmp_row]
                else:
                    mattr[merge_lyr_id].append(tmp_row)

        res = []
        for i in range(merge_lyrs_count):
            if i in mattr:
                res.append(mattr[i])
            else:
                res.append([])
        return res

    def get_parameters(self):
        """Implement the get_parameters abstractmethod."""
        input_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                  "parameterName": "inputLayer"})
        self.check_overwrite_sr(input_layer.spatialReference)  # type: ignore
        
        if self.version < 2.0:
            merge_layer = PAFeatureLayer(1, metadata={"parameterDataType": "Feature Set",
                                                      "parameterName": "mergeLayer",
                                                      "parameterType": "Optional"})
            merge_layers = PAFeatureLayerCollection([merge_layer])
        else:
            merge_layers = PAFeatureLayerCollection(1, metadata={"parameterDataType": "Feature Set",
                                                                 "parameterName": "mergeLayers",
                                                                 "parameterType": "Optional"})
        
        if self.version < 1.1:
            merging_attr_str = arcpy.GetParameterAsText(2)
            if merging_attr_str:
                try:
                    merge_attributes = json.loads(merging_attr_str)  # type: ignore
                except ValueError:
                    merge_attributes = merging_attr_str
            else:
                merge_attributes = None
        else:
            # merging_attributes should contain three columns: mergeLayerId, mergeLayerField, mergeType, and mergeValue
            merge_val = None
            if arcpy.GetParameterAsText(2):
                # merge_val = arcpy.ValueTable(4)
                # merge_val.loadFromString(arcpy.GetParameterAsText(2))
                merge_val: Optional[arcpy.ValueTable] = arcpy.GetParameter(2)  # type: ignore
            is_single_layer = False if self.version > 1.1 else True
            merge_attributes = self.unpack_merge_attr(merge_val, len(merge_layers.data), is_single_layer)

        arcpy.env.extent = None  # type: ignore
        LOGGER.debug(f"merging_attributes: {merge_attributes}")
        if self.is_running_in(PAEnvironment.MODELBUILDER):
            merged_output = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(5))
        else:
            # output can not be saved in in_memory (see issue logged at
            # https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/21905).
            merged_output = AnalysisUtils.initialize_output_layer(None, "MergedOutput",
                                                                  AOLUtils.get_scratch_wkspc(),
                                                                  True)
            self.cost_parameters = {"inputLayer": input_layer,
                                    "mergingAttributes": merge_attributes,
                                    "mergeLayers": merge_layers.data}

        self.executor: MLExecutor = MLExecutor(input_layer, merge_layers,
                                               merge_attributes,  # type: ignore
                                               merged_output)

    def set_visualization(self):
        """Set the renderer to the output layer before publish."""
        renderer = SimpleRenderer(self.executor.merge_output, self.task_name)
        self.executor.merge_output.set_drawing(renderer)

    def publish_outputs(self):
        """Publish the output."""
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
        publisher.add_layer_to_publish(self.executor.merge_output, 5, "MergedFeatures",
                                       layer_index=0)
        publisher.publish()

    def log_usage_metering(self):
        """Log the usage metering."""
        # count should be from merge_layer_coll of self.executor since it might be re-initialized.
        num_objects = self.executor.input_layer.count + self.executor.merge_layer_coll.count
        cost_factor = 0.001
        return_type = 1
        cost = num_objects * cost_factor
        merge_attributes_count = 0
        if self.executor.merge_attributes:
            for layer_attr in self.executor.merge_attributes:
                merge_attributes_count += len(layer_attr)
        values = [num_objects, merge_attributes_count, return_type]
        LogUtils.log_usage(self.task_name, num_objects, cost, values)


def err1156_handler(gp_msg):
    """Special handler for message emit from gp error 1156"""
    msg = gp_msg[2].split(":")[1].strip()
    oid = re.findall("Failed on input OID (\d+),", msg)  # noqa. pylint: disable=anomalous-backslash-in-string
    oid = int(oid[0])
    #  drop the single-quotes if there is any since the message has single-quotes already
    field_value = re.findall("could not write value (.+?) to", msg)[0].strip("'")
    field_name = re.findall("to output field (.+?)$", msg)[0]
    msg = f"A field value was incompatible with the field type. Failed on input OID {oid}, could not write value '{field_value}' to output field {field_name}."
    LOGGER.error(gp_msg[1], extra={"message_ID": gp_msg[1], "id": oid, "message_text": msg, "fieldValue": field_value,
                                   "fieldName": field_name})


def execute_tool(version: float = 1):
    """Entry point for MergeLayers tool."""
    try:
        ml_tool = MLTool(TASK_NAME, output_name_index=3, context_index=4,
                         version=version)
        ml_tool.run()
    except Exception as err:
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err, {1156: err1156_handler}).process()
