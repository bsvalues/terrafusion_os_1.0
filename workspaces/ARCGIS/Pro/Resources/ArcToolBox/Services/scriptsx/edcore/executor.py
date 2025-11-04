"""ExtractData core logic executor."""
# noqa. pylint: disable=import-error
from typing import Optional
import arcpy

from common import (LogUtils, PAExecutor, PAFeatureLayer, PAFeatureLayerCollection, ToolExit, AnalysisUtils, AOLUtils)
from common.extractutils import (RESTExtractor, NonRESTExtractor)


LOGGER = LogUtils.setup_logger(__name__)


class EDExectutor(PAExecutor):
    """Implement core logic for the ExtractData tool."""

    def __init__(self, input_layers: PAFeatureLayerCollection, extent_layer: Optional[PAFeatureLayer],
                 output_format: str, clip: bool):
        """Set up the initial properties.

        Args:
            input_layers: an instance of PAFeatureLayerCollection.
            extent_layer: a PAFeatureLayer with the clipping extent information stored.
            output_format: format of output.
            clip: a bool indicates whether to clip layers using the extent_layer. If false, then features intersect
            with the extent_layer will be kept without clipping.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.input_layers = input_layers
        self.extent_layer = extent_layer
        self.output_format = output_format
        self.clip = clip

        self.output_file = None
        self.total_output_feat_count = 0

    def validate_parameters(self) -> bool:
        """Check the input parameters."""
        # check if input_layers is empty
        if not self.input_layers.data:
            LOGGER.error("Empty input for extraction.")
            raise ToolExit

        # if extent_layer is empty, clip can not be True.
        if not self.extent_layer and self.clip:
            LOGGER.warning("Can not clip layers without extent_layer. Set clip to False.")
            self.clip = False

        # if extent_layer is not-empty, it should has polygon geometry type
        if self.extent_layer and self.extent_layer.shapeType != "Polygon":
            LOGGER.error("Invalid extent_layer. Extent_layer can only have geometry type of polygon.")
            raise ToolExit
        
        if self.output_format.lower() in ["kml", "shapefile"]:
            if self.output_format.lower() == "kml":
                unsupp_ftypes = ["TimeOnly", "TimestampOffset"]
            else:
                unsupp_ftypes = ["BigInteger", "DateOnly", "TimeOnly", "TimestampOffset"]
            for lyr in self.input_layers.data:
                fields = arcpy.Describe(lyr.data).fields
                for fld in fields:  # type: ignore
                    if fld.type in unsupp_ftypes:
                        LOGGER.error(100356, extra={"message_ID": 100356, "params": ",".join(unsupp_ftypes)})
                        raise ToolExit

        if (
            self.output_format.lower() in ["csv", "kml"]
            and arcpy.env.outputCoordinateSystem  # type: ignore
            and not AnalysisUtils.is_srs_equal(arcpy.env.outputCoordinateSystem, arcpy.SpatialReference(4326))  # type: ignore
        ):
            LOGGER.warning(100354, extra={"message_ID": 100354})

        return True

    def execute(self):
        """Execute core logic of ExtractData."""
        # validate the extent. If the extent_layer is a point/line layer, use the extent of the layer.
        if self.output_format.upper() == "FILEGEODATABASE" and not self.clip:
            # Call the logic of createReplica based Extractor
            if not self.extent_layer and arcpy.env.extent:
                local_copy = AOLUtils.create_unique_name("extentPoly", "in_memory")
                arcpy.management.CopyFeatures(arcpy.env.extent.polygon, local_copy)
                LOGGER.debug(f"make a local copy at {local_copy}")
                # make a local copy with the extent polygon
                self.extent_layer = PAFeatureLayer(local_copy)
            (self.output_file, self.total_output_feat_count) = RESTExtractor(self.input_layers,
                                                                             self.extent_layer).extract()
        else:
            # Call the logic of regular (non-createReplca based) Extractor
            (self.output_file, self.total_output_feat_count) = NonRESTExtractor(self.input_layers,
                                                                                self.extent_layer,
                                                                                self.output_format,
                                                                                self.clip).extract()
        # raise an error if the output is empty.
        if self.total_output_feat_count == 0:
            LOGGER.error(100049, extra={"message_ID": 100049})
            raise ToolExit
