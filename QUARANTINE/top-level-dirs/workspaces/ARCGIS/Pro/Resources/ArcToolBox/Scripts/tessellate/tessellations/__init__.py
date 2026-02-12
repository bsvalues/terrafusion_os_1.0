"""A module containing files which define tessellations and a factory constructor for them. A tessellation is created
when a shape is repeated over and over again covering a plane without any gaps or overlaps.

TessellationFactory - Class following the abstract factory design pattern to create shapes.
BaseTessellation - Abstract tessellation of 0 dimension shape.
TriangleTessellation - Tessellation of 3-sided 2D polygon with equal length sides.
SquareTessellation - Tessellation of 4-sided 2D polygon with equal length sides.
HexagonTessellation - Tessellation of 6-sided 2D polygon with equal length sides.
"""

from .base_tessellation import BaseTessellation
from .hexagon_tessellation import HexagonTessellation
from .hexagon_tessellation import TransverseHexagonTessellation
from .square_tessellation import SquareTessellation
from .square_tessellation import DiamondTessellation
from .triangle_tessellation import TriangleTessellation
from .tessellation_factory import TessellationFactory
