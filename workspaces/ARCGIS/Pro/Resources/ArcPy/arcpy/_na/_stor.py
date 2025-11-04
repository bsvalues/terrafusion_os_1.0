"""Module for working with SnapToRoads."""

from enum import IntEnum
from arcgisscripting import na as cna  # pylint:disable=no-name-in-module


# List of names exported from this module
__all__ = ["SnapToRoads", "SnapToRoadsResult", "SnapToRoadsInputDataType", "SnapToRoadsOutputDataType"]

class SnapToRoadsInputDataType(IntEnum):
    Points = 300
    # PointBarriers = 301
    # LineBarriers = 302
    # PolygonBarriers = 303

class SnapToRoadsOutputDataType(IntEnum):
    SnappedPoints = 350
    Lines = 351

SnapToRoadsResult = cna.SnapToRoadsResult

class SnapToRoads(cna.SnapToRoads):
    """Perform ...

    # An example showing how to ...
    import arcpy
    import arcpy._na as nax

    nd_path = "C:/data/NorthAmerica.gdb/Routing/Routing_ND"
    stor = nax.SnapToRoads(nd_path)
    stor.load(nax.SnapToRoadsInputDataType.Points, "path/to/features")
    result = stor.solve()
    """

    # Prevent adding unsupported attributes to class instances
    __slots__ = ()

    def __init__(self, in_network):
        """Create a service area solver object based on the input network dataset.

        Args:
                in_network: A string representing the full catalog path to the network dataset, a network dataset
                            layer object, a string representing the name of a network dataset layer, or a portal URL
                            for a network analysis service. For best performance pass a network dataset layer object
                            or a network dataset layer name.

        Returns:
                No value.

        Raises:
                ValueError if the in_network does not exist or cannot be opened or if you are not signed in to the
                portal.

        """
        super().__init__(in_network)