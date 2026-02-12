from math import pi, sqrt
from .base_shape import RegularPolygon

__all__ = ['Square', 'Diamond']


class Square(RegularPolygon):
    sides = 4

    def __init__(self, x, y, oid, radius=None, area=None):
        super().__init__(Square, x, y, oid, radius, area)
        self._angle_func = lambda i: (2*i+1)*pi/4

    @property
    def width(self):
        return self.side_length

    @property
    def height(self):
        return self.width


class Diamond(RegularPolygon):
    sides = 4

    def __init__(self, x, y, oid, radius=None, area=None):
        super().__init__(Diamond, x, y, oid, radius, area)
        self._angle_func = lambda i: (2*i+1)*pi/4+0.25*pi

    @property
    def width(self):
        return self.side_length * sqrt(2)

    @property
    def height(self):
        return self.width
