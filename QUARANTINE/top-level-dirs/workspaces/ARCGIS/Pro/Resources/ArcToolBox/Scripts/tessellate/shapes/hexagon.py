from math import pi, sqrt
from .base_shape import RegularPolygon

__all__ = ['Hexagon', 'TransverseHexagon']


class Hexagon(RegularPolygon):
    """ 6-sided 2D polygon with equal len sides. Flat top"""
    sides = 6

    def __init__(self, x, y, oid, radius=None, area=None):
        """Constructor for a Hexagon object.
        :param x: The x value of the centroid.
        :param y: The y value of the centroid.
        :param radius: Optional - The length between the centroid and the vertexes of this Triangle. Is is an equilateral triangle.
        :param area: Optional - The area of the Triangle.
        :return: Hexagon object.
        """
        super().__init__(Hexagon, x, y, oid, radius, area)
        self._angle_func = lambda i: (2*pi/6*i)

    @property
    def width(self):
        return self.side_length + self.apothem / sqrt(3)

    @property
    def height(self):
        return self.apothem*2


class TransverseHexagon(RegularPolygon):
    """ 6-sided 2D polygon with equal len sides. Pointy top (aka transverse) """
    sides = 6

    def __init__(self, x, y, oid, radius=None, area=None):
        """Constructor for a Hexagon object.
        :param x: The x value of the centroid.
        :param y: The y value of the centroid.
        :param radius: Optional - The length between the centroid and the vertexes of this Triangle. Is is an equilateral triangle.
        :param area: Optional - The area of the Triangle.
        :return: TransverseHexagon object.
        """
        super().__init__(TransverseHexagon, x, y, oid, radius, area)
        self._angle_func = lambda i: (2*pi/6*i + pi/2)

    @property
    def width(self):
        return self.apothem*2

    @property
    def height(self):
        return self.side_length + self.apothem / sqrt(3)
