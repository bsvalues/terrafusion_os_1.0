from . import Hexagon, Square, Triangle, TransverseHexagon, Diamond

__all__ = ['ShapeFactory']


class ShapeFactory(object):
    """Class following the abstract factory design pattern to create shapes."""

    @classmethod
    def make_shape(cls, shape_type, size, x=0, y=0, oid=None, method='radius',
                   invert=False):
        """Create a Hexagon, Square or Triangle object.

        :param shape_type: The type of shape to create. Valid options include Square, Triangle, Hexagon.
        :param size: The length between the centroid of the created shape and its vertices.
        :param x: The x value of the centroid of the created shape.
        :param y: The y value of the centroid of the created shape.
        :param oid: The unique object identifier for the created shape.
        :return: BaseShape - The created shape.
        """
        if shape_type not in [Hexagon, Square, Triangle, TransverseHexagon,
                              Diamond]:
            raise ValueError("Shape type {} not supported.".format(shape_type))

        if method not in ['radius', 'area']:
            raise ValueError(
                "Calculation method {} not supported. Please use either 'radius' or 'area'".format(
                    method))

        if method == 'radius':
            shape = shape_type(x, y, oid, radius=size)
        else:
            shape_type(x, y, oid, area=size)

        return shape if not invert else ~shape
