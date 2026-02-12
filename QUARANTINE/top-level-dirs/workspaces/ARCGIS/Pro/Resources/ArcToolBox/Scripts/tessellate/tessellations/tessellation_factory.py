class TessellationFactory(object):
    """Class following the abstract factory design pattern to create tessellations."""

    @classmethod
    def make_tessellation(cls, tessellation_type, size, extent):
        """Create a Tessellation object .

        :param tessellation_type: The type of tessellation to create. Valid options include BaseTessellation,
        SquareTessellation, TriangleTessellation, HexagonTessellation.
        :param size: The length between the centroid of the created shape and its vertices.
        :param extent: The extent of the plane to cover with the created tessellation - [x_min, y_min, x_max, y_max]
        :return: BaseTessellation
        """

        return tessellation_type(size, extent)
