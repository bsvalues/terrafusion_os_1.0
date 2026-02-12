from math import cos, radians, sin, sqrt

__all__ = ['RegularPolygon']


class RegularPolygon(object):
    """A RegularPolygon is the abstract concept defining a polygon which can be tessellated.

        :param shape_type: The name of the shape being created.
        :param x: The x value of the origin shape's centroid.
        :param y: The y value of the origin shape's centroid.
        :param oid: The Object ID for this shape.
        :return: RegularPolygon
        """
    def __init__(self, shape_type, x, y, oid, radius=None, area=None):
        self.shape_type = shape_type
        self.oid = oid
        self._radius = radius
        self._area = area
        self._angle_func = lambda i: 0
        self._sides = shape_type.sides
        self.x = x
        self.y = y
        self._inverted = False

    def __repr__(self):
        """Machine readable representation of the shape."""
        return u"{0.shape_type}(ID={0.oid}, x={0.x}, y={0.y})".format(self)

    def __invert__(self):
        self._inverted = not self._inverted
        return self

    @property
    def inverted(self):
        return self._inverted

    @property
    def area(self):
        return ((self._radius * self._sides * sin(radians(360/self._sides))) / 2) if self._radius else self._area

    @property
    def side_length(self):
        return 2 * self._radius * sin(radians(180/self._sides))

    @property
    def radius(self):
        return sqrt((4*(self._area/self._sides)) / sqrt(3)) if self._area else self._radius

    @property
    def apothem(self):
        return self._radius * cos(radians(180/self._sides))

    @property
    def vertices(self):
        """Generator to return the vertices of the shape.
        :return: Generator containing shape's vertexes.
        """
        for i in reversed(range(self._sides + 1)):
            yield (float(self._radius)*cos(self._angle_func(i))+self.x,
                   float(self._radius)*sin(self._angle_func(i))+self.y)
