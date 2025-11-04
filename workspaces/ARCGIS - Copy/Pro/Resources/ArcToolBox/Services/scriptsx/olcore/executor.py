""" OverlayLayers core logic executor. """
# noqa. pylint: disable = import-error
import os

import arcpy
import arcpy.analysis
import arcpy.management

from common import (LogUtils, PAExecutor, PAFeatureLayer, PAOutputFeatureLayer,
                    ToolExit, AnalysisUtils, FieldUtils, AOLUtils)

LOGGER = LogUtils.setup_logger(__name__)


class OLExecutor(PAExecutor):
    """Core logic for OverlayLayers tool."""
    def __init__(self, input_layer: PAFeatureLayer, overlay_layer: PAFeatureLayer,
                 output_layer: PAOutputFeatureLayer, overlay_type: str = "INTERSECT",
                 snap_to_input: bool = False, output_type: str = "INPUT",
                 tolerance: str = ""):
        """ Set up the properties. """
        self.input_layer = input_layer
        self.overlay_layer = overlay_layer
        self.output_layer = output_layer
        self.overlay_type = overlay_type
        self.rank = ' 1' if snap_to_input else ''
        self.output_type = output_type
        self.tolerance = tolerance

    def validate_parameters(self) -> bool:
        """Validate the input parameters."""
        if not self.input_layer or not self.overlay_layer:
            LOGGER.error(100371, extra={"message_ID": 100371})
            return False

        if self.overlay_type not in ["ERASE", "UNION", "INTERSECT"]:
            LOGGER.error(100370, extra={"message_ID": 100370})
            return False

        return True

    def execute(self):
        """Execute the core logic."""
        if self.overlay_type == "ERASE":
            LOGGER.debug('ERASE: {} {} {} {} {}'.format(self.overlay_type, self.input_layer.layer,
                                                        self.overlay_layer.layer, self.output_layer.data,
                                                        self.tolerance))
            LOGGER.debug(f"output_layer.data: {self.output_layer.data}")
            AnalysisUtils.erase(self.input_layer.layer, self.overlay_layer.layer, self.output_layer.data,
                                self.tolerance)
        elif self.overlay_type == "UNION":
            inputs = '{}{};{}'.format(self.input_layer.layer, self.rank, self.overlay_layer.layer)
            LOGGER.debug('UNION: {} {} {} {}'.format(self.overlay_type, inputs,
                                                     self.output_layer, self.tolerance))
            arcpy.analysis.Union(inputs, self.output_layer.data, '', self.tolerance)
        elif self.overlay_type == "INTERSECT":
            if self.input_layer.shapeType == "Point":
                tolerance = 0
                LOGGER.debug('SpatialJoin {} {} {} {}'.format(self.input_layer, self.overlay_layer,
                                                              self.output_layer, tolerance))
                arcpy.analysis.SpatialJoin(self.input_layer.layer, self.overlay_layer.layer,
                                           self.output_layer.data,
                                           'JOIN_ONE_TO_ONE', 'KEEP_COMMON', '',
                                           'INTERSECT', tolerance)
            elif self.overlay_layer.shapeType == "Point":
                tolerance = 0
                LOGGER.debug('SpatialJoin {} {} {} {}'.format(self.overlay_layer,
                                                              self.input_layer,
                                                              self.output_layer,
                                                              tolerance))
                arcpy.analysis.SpatialJoin(self.overlay_layer.layer, self.input_layer.layer,
                                           self.output_layer.data,
                                           'JOIN_ONE_TO_ONE', 'KEEP_COMMON', '',
                                           'INTERSECT', tolerance)
            else:
                input_cp = self.input_layer.catalogPath or "input_cp"   # just in case catalogPath is ""
                overlay_cp = self.overlay_layer.catalogPath or "overlay_cp"
                if input_cp != overlay_cp:
                    inputs = u'{}{};{}'.format(self.input_layer.layer, self.rank, self.overlay_layer.layer)
                else:
                    # if they point to the same catalogPath, check if different filter are assigned.
                    input_url_json = self.input_layer.url_json
                    overlay_url_json = self.overlay_layer.url_json
                    LOGGER.debug(f"input_url_json: {input_url_json}")
                    LOGGER.debug(f"overlay_url_json: {overlay_url_json}")
                    if input_url_json and overlay_url_json:
                        input_filter = input_url_json.get("filter")
                        overlay_filter = overlay_url_json.get("filter")
                        # if either of the layers don't have any filter, the intersection applied to all features
                        if input_filter is None:
                            inputs = self.input_layer.layer
                        elif overlay_filter is None:
                            inputs = self.overlay_layer.layer
                        elif input_filter == overlay_filter:
                            inputs = self.input_layer.layer
                        else:
                            inputs = f'{self.input_layer.layer}{self.rank};{self.overlay_layer.layer}'
                    else:
                        # use the input_layer as it is if input/overlay is created from feature collection
                        inputs = self.input_layer.layer

                LOGGER.debug(f'{self.overlay_type} {inputs} {self.output_layer} {self.tolerance} {self.output_type}')
                arcpy.analysis.Intersect(inputs, self.output_layer.data, '', self.tolerance, self.output_type)
        else:
            LOGGER.error(f"Invalid overlay_type: {self.overlay_type}")
            raise ToolExit

        self.process_output()

    def process_output(self):
        """Process the overlay output."""
        if "polygon" in self.output_layer.shapeType.lower():
            # This is for the case that the script is running against a non-server testing environment.
            try:
                portal_description = arcpy.GetPortalDescription()
            except ValueError:
                portal_description = None
            units = AnalysisUtils.get_units(portal_description)
            FieldUtils.create_shape_area_field(self.output_layer, units)
        elif "polyline" in self.output_layer.shapeType.lower():
            try:
                portal_description = arcpy.GetPortalDescription()
            except ValueError:
                portal_description = None
            units = AnalysisUtils.get_units(portal_description, False)
            FieldUtils.create_shape_length_field(self.output_layer, units)

        if self.output_layer.shapeType == "Multipoint":
            wkspc = os.path.dirname(self.output_layer.data)
            outputlayer_single = AOLUtils.create_unique_name("OverlayOutput_Single", wkspc)
            arcpy.management.MultipartToSinglepart(self.output_layer.data, outputlayer_single)
            self.output_layer = PAOutputFeatureLayer(outputlayer_single)
