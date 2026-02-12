"""FindCentroids core logic executor."""
# Update sys.path dynamically. pylint: disable=C0411, C0413
# Use the setattr and __slots__. Disable missing attribute. pylint: disable=E1101
import arcpy
import arcpy.management

from common import LogUtils, PAExecutor, PAFeatureLayer, PAOutputFeatureLayer, ToolExit  # noqa. pylint: disable=E0401

LOGGER = LogUtils.setup_logger(__name__)


class FCExecutor(PAExecutor):
    """ Core logic for FindCentroids tool. """

    def __init__(self, input_layer: PAFeatureLayer, output_layer: PAOutputFeatureLayer,
                 point_location: bool = False):
        """Unpack input parameters and set the properties.

        Args:
            input_layer: an instance of PAFeatureLayer with geometry to fetch center from.
            output_layer: an instance of PAOutputFeatureLayer with the results to be stored.
            point_location: a bool to indicate whether the point has to be inside. This applies to layer with
            multi-part geometry.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.input_layer = input_layer
        self.output_layer = output_layer
        self.point_location = point_location

    def validate_parameters(self) -> bool:
        """Validate input parameters."""
        if not self.input_layer:
            LOGGER.error("input_layer can not be empty.")
            return False
        
        if self.input_layer.shapeType == "Point":
            LOGGER.error(100328, extra={"message_ID": 100328})
            raise ToolExit

        return True

    def execute(self):
        """ Execute the core logic. """
        arcpy.management.FeatureToPoint(self.input_layer.layer, self.output_layer.data, 
                                        self.point_location)
