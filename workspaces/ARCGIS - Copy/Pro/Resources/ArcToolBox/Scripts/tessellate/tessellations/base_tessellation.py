from ..shapes import ShapeFactory

__all__ = ['BaseTessellation']


class BaseTessellation(object):
    def __init__(self, shape_type, size, extent, method='radius'):
        """A BaseTessellation is the base class defining a tessellated grid of arbitray shapes for use with the
        arcpy-tessellation tools.
        :param size: Float - The desired distance between centroid to vertexes of the tessellated shapes.
        :param extent: arcpy.Extent - The extent to create the tessellation within.
        :return: BaseTessellation - This tessellation
        """
        self.shape_type = shape_type
        self.size = size
        self.extent = extent
        self._origin = ShapeFactory.make_shape(shape_type, size,
                                               self.extent.XMin,
                                               self.extent.YMin)
        self._method = method
        self._shift_row = lambda s: s
        self._rows = 0
        self._columns = 0

    @staticmethod
    def b26_col_name(i):
        """Converts a column number into a sequence of letter using bijective base-26 digits.
        ie: A, B ... Z, AA, AB ...  AZ, BA, BB ...
        :param i: Int - The column number to convert into letter sequence.
        :return: String - The column's letter
        """
        from string import ascii_uppercase
        result = []
        while i > 0:
            i, mod = divmod(i - 1, len(ascii_uppercase))
            result += ascii_uppercase[mod]
        return ''.join(reversed(result))

    @property
    def rows(self):
        return int(self._rows)

    @property
    def columns(self):
        return int(self._columns)

    @property
    def tiles(self):
        """The tiles (shapes) which make up the tessellation.
        :return: Generator - Yields tiles in the tessellation
        """
        from ..shapes import ShapeFactory
        current_y = self._origin.y
        for r in range(self.rows):
            for c in range(self.columns):
                yield ShapeFactory.make_shape(self.shape_type,
                                              self.size,
                                              self._shift_x(self._origin.x, c, r),
                                              self._shift_y(current_y, c, r),
                                              "{}-{}".format(self.b26_col_name(c+1), self.rows - r),
                                              self._method)
            current_y = self._shift_row(current_y)
