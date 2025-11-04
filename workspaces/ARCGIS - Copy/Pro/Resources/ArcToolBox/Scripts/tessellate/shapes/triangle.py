from math import pi, sqrt
from .base_shape import RegularPolygon

__all__ = ['Triangle']


class Triangle(RegularPolygon):
    """3 sided Polygon with equal side lengths."""
    sides = 3

    def __init__(self, x, y, oid, radius=None, area=None):
        """Constructor for an equilateral triangle; All sides are the same length.
        :param x: The x value of the centroid.
        :param y: The y value of the centroid.
        :param radius: Optional - The length between the centroid and the vertexes of this Triangle. Is is an equilateral triangle.
        :param area: Optional - The area of the Triangle.
        :return: Square object.
        """
        super().__init__(Triangle, x, y, oid, radius, area)
        self._angle_func = lambda i: (pi/6)*(3*(i+1)+i)+(pi/3) if self._inverted else (pi/6)*(3*(i+1)+i)

    @property
    def width(self):
        return self.side_length * sqrt(2)

    @property
    def height(self):
        return self.width
