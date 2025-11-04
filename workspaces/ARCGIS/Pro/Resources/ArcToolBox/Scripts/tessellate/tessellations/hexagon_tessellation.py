from math import ceil, sqrt
from . import BaseTessellation
from ..shapes import Hexagon, TransverseHexagon

__all__ = ['HexagonTessellation', 'TransverseHexagonTessellation']


class HexagonTessellation(BaseTessellation):
    """ Tessellation of 6-sided 2D polygon with equal length sides. """
    shape = Hexagon

    def __init__(self, size, extent):
        """Constructor for a HexagonTessellation object.

        :param size: The length between the centroid and the vertices of the Hexagons in this tessellation.
        :param extent: The extent of the plane to cover with this tessellation - [x_min, y_min, x_max, y_max]
        :return: HexagonTessellation
        """

        super().__init__(Hexagon, size, extent)

        self._columns = ceil((self.extent.XMax - self.extent.XMin + self._origin.radius) /
                             (self._origin.width))

        self._rows = ceil((self.extent.YMax - self.extent.YMin + self._origin.apothem) /
                          self._origin.height)

        self._shift_row = lambda y: y + self._origin.height

    def _shift_x(self, x, col=None, row=None):
        return x + self._origin.width * col

    def _shift_y(self, y, col=None, row=None):
        if col % 2 == 0:
            return y
        else:
            return y + self._origin.height/2


class TransverseHexagonTessellation(BaseTessellation):
    """ Tessellation of 6-sided 2D polygon with equal length sides. """
    shape = TransverseHexagon

    def __init__(self, size, extent):
        """ Constructor for a TransverseHexagonTessellation object.

        :param size: The length between the centroid and the vertices of the Hexagons in this tessellation.
        :param extent: The extent of the plane to cover with this tessellation - [x_min, y_min, x_max, y_max]
        :return: TransverseHexagonTessellation
        """

        super().__init__(TransverseHexagon, size, extent)

        self._columns = ceil((self.extent.XMax - self.extent.XMin + self._origin.width/2) /
                             self._origin.width)

        self._rows = ceil((self.extent.YMax - self.extent.YMin + self._origin.radius) /
                          self._origin.height)

        self._shift_row = lambda y: y + self._origin.height

    def _shift_x(self, x, col=None, row=None):
        x = x + self._origin.width * col
        if row % 2 == 1:
            return x + self._origin.width / 2
        return x

    def _shift_y(self, y, col=None, row=None):
        return y

