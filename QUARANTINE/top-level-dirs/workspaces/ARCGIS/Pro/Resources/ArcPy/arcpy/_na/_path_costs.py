"""Module for working with PathCosts."""

from enum import IntEnum
from arcgisscripting import na as cna  # pylint:disable=no-name-in-module


# List of names exported from this module
__all__ = ["PathCosts"]


class PathCosts(cna.PathCosts):
    """Perform ...

    # An example showing how to ...
    import arcpy
    import arcpy._na as nax

    """

    # Prevent adding unsupported attributes to class instances
    __slots__ = ()

    def __init__(self):
        """Create a ...

        Args:
                in_...
                            layer object, a string representing the name of a network dataset layer, or a portal URL
                            for a network analysis service. For best performance pass a network dataset layer object
                            or a network dataset layer name.

        Returns:
                No value.

        Raises:
                ValueError if ...

        """
        super().__init__()
