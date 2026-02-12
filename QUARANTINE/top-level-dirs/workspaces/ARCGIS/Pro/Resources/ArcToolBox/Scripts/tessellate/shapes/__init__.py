"""A module containing files which define shapes that can tessellate and a factory constructor for them.

ShapeFactory - Class following the abstract factory design pattern to create shapes.
BaseShape - Abstract 0 dimension shape.
Triangle - 3-sided 2D polygon with equal length sides.
Square - 4-sided 2D polygon with equal length sides.
Hexagon - 6-sided 2D polygon with equal length sides.
"""

from .base_shape import RegularPolygon
from .hexagon import Hexagon
from .hexagon import TransverseHexagon
from .square import Square
from .square import Diamond
from .triangle import Triangle
from .shape_factory import ShapeFactory
