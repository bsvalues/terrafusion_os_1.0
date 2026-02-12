from math import ceil, sqrt
from . import BaseTessellation
from ..shapes import ShapeFactory
from ..shapes import Triangle

__all__ = ['TriangleTessellation']


class TriangleTessellation(BaseTessellation):
    """Tessellation of 3-sided 2D polygon with equal length sides."""
    shape = Triangle

    def __init__(self, size, extent):
        """Constructor for a TriangleTessellation object.

        :param size: The length between the centroid and the vertices of the Triangles in this tessellation.
        :param extent: The extent of the plane to cover with this tessellation - [x_min, y_min, x_max, y_max]
        :return: TriangleTessellation
        """
        super().__init__(Triangle, size, extent)
        self._columns = ceil((self.extent.XMax - self.extent.XMin + (self._origin.side_length/2)) /
                             (self._origin.side_length/2))
        self._rows = ceil((self.extent.YMax - self.extent.YMin + self._origin.apothem) /
                          (self._origin.radius + self._origin.apothem))
        self._shift_row = lambda y: y + (self._origin.side_length/2)*sqrt(3)

    def _shift_x(self, x, col=None, row=None):
        return x + (self._origin.side_length / 2) * col

    def _shift_y(self, y, col=None, row=None):
        return y + ((self._origin.side_length/2)/sqrt(3))

    @property
    def tiles(self):
        """The tiles (shapes) which make up the tessellation. Triangle Tessellation require inverse triangles, override
        of the BaseTessellation tiles property to include that functionality.
        :return: Generator - Yields tiles in the tessellation
        """
        current_y = self._origin.y
        for r in range(self.rows):
            for tile in [ShapeFactory.make_shape(self.shape_type,
                                                 self.size,
                                                 self._shift_x(self._origin.x, c),
                                                 current_y if (c % 2 == 0) else self._shift_y(current_y),
                                                 "{}-{}".format(self.b26_col_name(c+1), self.rows - r),
                                                 self._method,
                                                 False if (c % 2 == 0) else True) if (r % 2 == 0) else
                         ShapeFactory.make_shape(self.shape_type,
                                                 self.size,
                                                 self._shift_x(self._origin.x, c),
                                                 self._shift_y(current_y)if (c % 2 == 0) else current_y,
                                                 "{}-{}".format(self.b26_col_name(c+1), self.rows - r),
                                                 self._method,
                                                 True if (c % 2 == 0) else False)
                         for c in range(self.columns)]:
                yield tile
            current_y = self._shift_row(current_y)
