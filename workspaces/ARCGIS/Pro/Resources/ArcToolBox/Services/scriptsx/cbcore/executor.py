"""CreateBuffers core logic executor."""
from common import (LogUtils, PAExecutor, AnalysisUtils,
                    LogExecutionTime, PAOutputFeatureLayer,
                    FieldUtils)
from .buffer import SingleBuffer, ThiessenBuffer, RingBuffer, MultiBuffer

LOGGER = LogUtils.setup_logger(__name__)


class CBExecutor(PAExecutor):
    """Provide core logic for the CreateBuffers tool."""

    BUFFER_SIDE_TYPES = {'full': 'FULL',
                         'left': 'LEFT',
                         'right': 'RIGHT',
                         'outside': 'OUTSIDE_ONLY'}
    BUFFER_DISSOLVE_TYPES = {'none': 'NONE',
                             'dissolve': 'ALL',
                             'split': 'SPLIT'}
    SUPPORTED_NUM_FTYPES = ["Integer", "SmallInteger", "BigInteger", "Double", "Single", "OID"]

    def __init__(
        self,
        input_layer: PAOutputFeatureLayer,
        output_layer: PAOutputFeatureLayer,
        distances: list,
        field: str = "",
        units: str = "",
        dissolve_type: str = "",
        ring_type: str = "",
        side_type: str = "",
        end_type: str = ""
    ):
        """Set up the property of the object.

        Args:
            input_layer: an instance of PAFeatureLayer.
            output_layer: an instance of PAOutputFeatureLayer to save the execution result.
            distances: a list of floats represents buffer distance.
            field: a string represents the field name with numeric values as buffer distance.
            units: a string represents the units of the buffer distance.
            dissolve_type: a string represents type of dissolve.
            ring_type: a string repreents the type of rings.
            side_type: a string represents the type of sides.
            end_type: a string represents the end type.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.input_layer = input_layer
        self.output_layer = output_layer
        self.distances = distances
        self.field = field
        self.units = units
        self.dissolve_type = dissolve_type
        self.ring_type = ring_type
        self.side_type = side_type
        self.end_type = end_type

    def validate_parameters(self) -> bool:
        """Validate input parameters."""
        if self.output_layer.data is None:
            LOGGER.debug('output_layer is missing.')
            return False

        # distances and fields can not be empty at the same time
        if not self.distances and self.field.strip() == '':
            LOGGER.error(100368, extra={"message_ID": 100368})
            return False

        # if both field and distances is set, drop the distances value
        if self.field.strip() and self.distances:
            self.distances = []

        if self.field.strip():
            try:
                field_type = FieldUtils.get_fields_types([self.field], self.input_layer.fields)[0]
                if field_type not in self.SUPPORTED_NUM_FTYPES:
                    LOGGER.error(539, extra={"message_ID": 539, "field": self.field})
                    return False
            except (ValueError, IndexError):
                LOGGER.error(539, extra={"message_ID": 539, "field": self.field})
                return False

        if self.side_type:
            self.side_type = self.BUFFER_SIDE_TYPES[self.side_type.lower()]

        if self.end_type:
            self.end_type = self.end_type.upper()

        if self.dissolve_type:
            self.dissolve_type = self.BUFFER_DISSOLVE_TYPES[self.dissolve_type.lower()]

        if self.input_layer.shapeType == "Point":
            self.side_type = "FULL"
        elif self.input_layer.shapeType == "Polyline":
            if self.side_type == "OUTSIDE_ONLY":
                self.side_type = "FULL"
        elif self.input_layer.shapeType == "Polygon":
            if self.side_type in ["LEFT", "RIGHT"]:
                self.side_type = "FULL"

        return True

    def execute(self):
        """Execute the core logic of CreateBuffers.

        Args:
            No arguments.
        Returns:
            No return value. The output is going to be generated based on the specification of output_layer.
        Raises:
            No exceptions.

        """
        LOGGER.debug("self.input_layer.datatype: {}".format(self.input_layer.data_type))
        params = {"input_layer": self.input_layer.layer,
                  "output_layer": self.output_layer.data,
                  "units": self.units,
                  "side_type": self.side_type,
                  "end_type": self.end_type,
                  "field": self.field,
                  "dissolve_type": self.dissolve_type,
                  "ring_type": self.ring_type,
                  "calc_field": True}
        geodesic = 1 if AnalysisUtils.use_geodesic(sp_ref=self.input_layer.spatialReference) else 0
        params["geodesic"] = geodesic
        LOGGER.debug(f"geodesic: {geodesic}")
        with LogExecutionTime("Create Buffer:"):
            if self.dissolve_type.upper() == "SPLIT":
                # this should apply to points only
                if len(self.distances) > 0:  # noqa. pylint: disable=len-as-condition
                    distance = self.distances[0]
                else:
                    distance = 0
                params["distance"] = distance
                params["dissolve_type"] = "ALL"
                ThiessenBuffer(**params).create()
            elif self.field:
                params["distance"] = 0
                SingleBuffer(**params).create()
            elif len(self.distances) == 1:
                params["distance"] = self.distances[0]
                SingleBuffer(**params).create()
            elif self.ring_type == "rings" and (not self.dissolve_type or self.dissolve_type == "none"):
                oidfieldname = self.input_layer.oidfieldname
                params["distance"] = self.distances
                params["oid_field_name"] = oidfieldname
                RingBuffer(**params).create()
            else:
                params["distance"] = self.distances
                MultiBuffer(**params).create()
