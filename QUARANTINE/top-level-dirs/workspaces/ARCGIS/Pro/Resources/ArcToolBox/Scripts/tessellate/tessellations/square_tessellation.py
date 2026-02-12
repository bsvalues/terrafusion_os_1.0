from math import ceil, sqrt
from . import BaseTessellation
from ..shapes import Square, Diamond

__all__ = ['SquareTessellation']


class SquareTessellation(BaseTessellation):
    """Tessellation of 4-sided 2D polygon with equal length sides."""
    shape = Square

    def __init__(self, size, extent):
        """Constructor for a SquareTessellation object.

        :param size: The length between the centroid and vertices of the Squares in this tessellation.
        :param extent: The extent of the plane to cover with this tessellation - [x_min, y_min, x_max, y_max]
        :return: SquareTessellation
        """
        super().__init__(Square, size, extent)
        self._columns = ceil((self.extent.XMax - self.extent.XMin + self._origin.width/2)/self._origin.side_length)
        self._rows = ceil((self.extent.YMax - self.extent.YMin + self._origin.height/2)/self._origin.side_length)
        self._shift_row = lambda y: y + self._origin.side_length

    def _shift_x(self, x, col=None, row=None):
        return x + (self._origin.side_length * col)

    def _shift_y(self, y, col=None, row=None):
        return y

class DiamondTessellation(BaseTessellation):
    """Tessellation of 4-sided 2D polygon with equal length sides."""
    shape = Diamond

    def __init__(self, size, extent):
        """Constructor for a DiamondTessellation object.

        :param size: The length between the centroid and vertices of the Diamond in this tessellation.
        :param extent: The extent of the plane to cover with this tessellation - [x_min, y_min, x_max, y_max]
        :return: SquareTessellation
        """
        super().__init__(Diamond, size, extent)
        self._columns = ceil((self.extent.XMax - self.extent.XMin + self._origin.width/2)/self._origin.width)
        self._rows = ceil((self.extent.YMax - self.extent.YMin + self._origin.height/2)/(self._origin.height/2))
        self._shift_row = lambda y: y + self._origin.width/2

    def _shift_x(self, x, col=None, row=None):
        x = x + ((self._origin.side_length * sqrt(2)) * col)

        if row % 2 == 1:
            x += self._origin.width/2

        return x

    def _shift_y(self, y, col=None, row=None):
        return y