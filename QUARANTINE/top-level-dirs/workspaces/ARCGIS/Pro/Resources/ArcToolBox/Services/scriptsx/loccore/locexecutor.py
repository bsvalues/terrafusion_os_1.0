"""Executor of FindExistingLocations."""
# dynamically get/set the property. pylint: disable=E0237, W0201
# noqa. pylint: disable=import-error
from typing import List
import json

import arcpy

from common import (PAOutputFeatureLayer, PAFeatureLayerCollection,
                    LogUtils, PAExecutor, ToolExit,
                    AnalysisUtils, FieldUtils)
from .locutils import LocFinder


LOGGER = LogUtils.setup_logger(__name__)


class LOCExecutor(PAExecutor):
    """Provide core logic for the FindExistingLocations tool."""

    def __init__(self, layers: PAFeatureLayerCollection, expressions: List,
                 output_layer: PAOutputFeatureLayer,
                 derive_new_loc: bool):
        """Unpack the input parameters."""
        self.input_layers = layers
        self.expressions = expressions
        self.output_layer = output_layer
        self.derive_new_loc = derive_new_loc

    def validate_parameters(self) -> bool:
        if self.input_layers.count == 0:
            LOGGER.error(100049, extra={"message_ID": 100049})
            raise ToolExit
        return True

    def execute(self):
        """Execute the core logic."""
        LOGGER.debug(f"expressions: {self.expressions}")
        LocFinder(self.input_layers.data, self.expressions, self.output_layer, self.derive_new_loc).find()
        if self.derive_new_loc:
            if self.output_layer.shapeType == "Polygon":
                units = AnalysisUtils.get_units(arcpy.GetPortalDescription(), True)
                FieldUtils.create_shape_area_field(self.output_layer, units)
            elif self.output_layer.shapeType == "Polyline":
                units = AnalysisUtils.get_units(arcpy.GetPortalDescription(), False)
                FieldUtils.create_shape_length_field(self.output_layer, units)
