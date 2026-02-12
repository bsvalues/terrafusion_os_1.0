"""ExtractData tool implementation."""
# pylint: disable=C0411, C0413
# several functions called implicitly in __init__. noqa. pylint: disable=attribute-defined-outside-init
# noqa. pylint: disable=logging-format-interpolation
# Use properties of executor. pylint: disable=no-member
# noqa. pylint: disable=import-error
import os
import sys

import arcpy

from .executor import EDExectutor
from common import (PATool, PAFeatureLayer, FilePublisher,
                    PAFeatureLayerCollection, LogUtils, ToolExit,
                    ModelBuilderMixin, ParameterUnpackMixin)
from common.extractutils import ExtractUtils


LOGGER = LogUtils.setup_logger(__name__)


class EDTool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Provide core logic for ExtractData tool."""

    def get_parameters(self):
        """Implement abstractmethod."""
        self.input_layers = PAFeatureLayerCollection(0, metadata={"parameterDataType": "Record Set",
                                                                  "parameterName": "inputLayers"},
                                                     for_extract=True)
        LOGGER.debug("Input_layers were initialized.")
        self.extent_layer = PAFeatureLayer(1, metadata={"parameterDataType": "Feature Set",
                                                        "parameterName": "extentlayer",
                                                        "parameterType": "Optional"})

        if self.extent_layer:
            # If the extent_layer is not polygon, then use the extent of the layer instead.
            LOGGER.debug("shapeType: {}".format(self.extent_layer.shapeType))
            self.extent_layer = ExtractUtils.get_extent_from_nonpolylayer(self.extent_layer)
            arcpy.env.extent = None
        LOGGER.debug("extent_layer was initialized.")

        self.clip = self.get_param(2)
        self.output_format = self.get_param_as_text(3).upper()
        arcpy.SetParameterAsText(6, "")

        if not self.output_format:
            self.output_format = "FILEGEODATABASE"
        self.executor: EDExectutor = EDExectutor(self.input_layers, self.extent_layer,
                                                 self.output_format,
                                                 self.clip)

    def validate_parameters(self):
        """Overwrite the validate_parameters since cost_parameters is created after some validation."""
        (tot_feat_count, layer_with_no_fields) = ExtractUtils.check_layers_within_extent(self.input_layers,
                                                                                         self.output_format,
                                                                                         self.extent_layer, False)
        if tot_feat_count == 0:
            LOGGER.error(100049, extra={"message_ID": 100049})
            raise ToolExit

        if len(layer_with_no_fields) == len(self.input_layers.data):
            LOGGER.error(100050, extra={"message_ID": 100050})
            raise ToolExit

        self.cost_parameters = {"InputLayers": tot_feat_count,
                                "clip": self.clip}
        if not self.check_credits():
            LOGGER.error(100242, extra={"message_ID": 100242})
            raise ToolExit
        LOGGER.debug("Credit checks ok.")

        if not self.executor.validate_parameters():
            LOGGER.error("executor contains invalid parameters.")
            raise ToolExit

        return True

    def set_visualization(self):
        """Overwrite the abstract method. No need to set renderer since the output is a file."""
        LOGGER.debug("No visualization setup is needed for ExtractData.")

    def publish_outputs(self):
        """Publish the outputs as an item."""
        try:
            out_file_name = self.output_name.json['itemProperties']['title']
            result_file = ExtractUtils.file_rename(self.executor.output_file, out_file_name)  # type: ignore
        except (KeyError, OSError, IOError) as err:
            result_file: str = self.executor.output_file  # type: ignore
            if isinstance(err, KeyError):
                LOGGER.debug("User does not specify a name for the output.")
            else:
                LOGGER.debug(f"Unable to rename the output {result_file} to the user specified name.")
        out_file_name = os.path.basename(result_file)

        # Check if zip file or other (.kml or .csv)
        if self.output_format == "FILEGEODATABASE":
            online_format = "File Geodatabase"
        elif (
                self.output_format == 'CSV'
                and os.path.splitext(result_file)[1] == '.zip'
        ):
            online_format = 'CSV Collection'
        elif self.output_format == 'KML':
            if os.path.splitext(result_file)[1] == '.zip':
                online_format = 'KML Collection'
            elif os.path.splitext(result_file)[1] == ".csv":
                online_format = "CSV"
            else:
                online_format = self.output_format
        elif (
                self.output_format == "SHAPEFILE"
                and os.path.splitext(result_file)[1] == ".csv"
        ):
            online_format = "CSV"
        else:
            online_format = self.output_format

        try:
            FilePublisher(self.output_name, arcpy.env.extent, online_format,  # type: ignore
                          result_file, 6).publish()
        except Exception as err:
            LOGGER.error(110343, extra = {"message_ID": 110343, "itemName": out_file_name})
            raise err
        self.cost_parameters["InputLayers"] = self.executor.total_output_feat_count

    def log_usage_metering(self):
        """Implement the log_usage_metering abstract method."""
        clip_cost = 2 if self.clip else 1
        values = [len(self.input_layers.data), self.executor.total_output_feat_count, clip_cost]
        cost = self.executor.total_output_feat_count * 0.001
        LogUtils.log_usage(self.task_name, self.executor.total_output_feat_count, cost, values)
