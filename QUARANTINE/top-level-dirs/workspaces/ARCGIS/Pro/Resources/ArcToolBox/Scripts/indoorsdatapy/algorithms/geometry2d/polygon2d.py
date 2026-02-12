#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""An arbitrary 2D polygon, an axis parallel polygon and a regular polygon."""

from itertools import combinations

import numpy as np
from indoorsdatapy.algorithms.geometry2d.dimension_error import DimensionError
from indoorsdatapy.algorithms.geometry2d.entity2d import Entity2D
from indoorsdatapy.algorithms.geometry2d.helpers import enforce_nodes_ndarray
from indoorsdatapy.algorithms.geometry2d.line2d import Line2D
from indoorsdatapy.algorithms.geometry2d.point2d import Point2D
from indoorsdatapy.algorithms.geometry2d.point2d import enforce_point2d


class Polygon2D(Entity2D):
    """
    A 2D polygon.

    Parameters
    ----------
    nodes : 2D numpy array, tuple of tuples (of numbers) or list of lists (of
            numbers)
        Coordinates of the polygon vertices.

    Raises
    ------
    DimensionError
        If nodes are not 2D or less than 3 nodes are given.
    TypeError
        If nodes are not of numpy array, tuple or list type.
    """

    def __init__(self, nodes):
        if isinstance(nodes, (np.ndarray, tuple, list)):
            if isinstance(nodes, (tuple, list)):
                nodes = np.array(nodes)
            if nodes.ndim == 2:
                if len(nodes) > 2:
                    super(Polygon2D, self).__init__(nodes)
                else:
                    raise DimensionError("polygons need at least 3 nodes")
            else:
                raise DimensionError("nodes must be 2D")
        else:
            raise TypeError("nodes must be numpy array, list or tuple")

    @property
    def self_intersects(self):
        """
        Check if polygon edges intersect each other.

        Returns
        -------
        boolean
            True if self intersections exist, False otherwise.
        """
        n_left = self._nodes
        n_right = np.vstack((self._nodes[1:], self._nodes[0]))
        poly_edges = np.hstack((n_left, n_right))
        for l1, l2 in combinations(poly_edges, 2):
            line1 = Line2D(l1.reshape((2, 2)))
            line2 = Line2D(l2.reshape((2, 2)))
            if line1.has_node(line2.nodes[0]) or \
                    line1.has_node(line2.nodes[1]):
                continue
            if line1.intersect(line2):
                return True
        return False

    def edges(self):
        n_left = self._nodes
        n_right = np.vstack((self._nodes[1:], self._nodes[0]))
        edges = np.hstack((n_left, n_right))
        for edge in edges:
            yield Line2D(edge.reshape((2, 2)))

    def has_edge(self, line):
        for edge in self.edges():
            if edge == line or Line2D((edge.nodes[1], edge.nodes[0])) == line:
                return True
        return False

    def area(self):
        """
        Calculates the area of the polygon.
        CAUTION: The area formula is valid for any non-self-intersecting
            (simple) polygon, which can be convex or concave and has clockwise
            or counter-clockwise ordered vertices!

        Returns
        -------
        float
            The area of the polygon.
        """
        x = self._nodes[:, 0]
        y = self._nodes[:, 1]
        return 0.5 * np.abs(np.dot(x, np.roll(y, 1)) -
                            np.dot(y, np.roll(x, 1)))

    def node_inside(self, point):
        """
        Determine whether a point is inside this polygon or not.

        Parameters
        ----------
        point : Point2D, numpy array, tuple of tuples (of numbers)
                or list of lists (of numbers)

        Returns
        -------
        boolean
            True if point inside polygon, False otherwise.
        """
        node = enforce_nodes_ndarray(point)
        n = len(self._nodes)
        inside = False

        p1x, p1y = self._nodes[0][0], self._nodes[0][1]
        for i in range(n + 1):
            p2x, p2y = self._nodes[i % n][0], self._nodes[i % n][1]
            if node[1] > min(p1y, p2y):
                if node[1] <= max(p1y, p2y):
                    if node[0] <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (node[1] - p1y) * \
                                      (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or node[0] <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside

    def point_on_edges(self, point):
        """
        Checks whether a point lies on any edge of this polygon or not.

        Parameters
        ----------
        point : Point2D, numpy array, tuple (of numbers) or list (of numbers)
            Point to check.

        Returns
        -------
        boolean
            True if point on any edge, False otherwise.
        """
        point = enforce_point2d(point)
        for i in range(len(self._nodes)):
            if i != len(self._nodes) - 1:
                line = Line2D(nodes=[self._nodes[i], self._nodes[i + 1]])
            else:
                line = Line2D(nodes=[self._nodes[i], self._nodes[0]])
            if line.intersect_point(point=point):
                return True
        return False

    def get_random_point_inside(self):
        """
        Creates a point that lies somewhere inside this polygon.

        Returns
        -------
        Point2D
            Point inside this polygon.
        """
        x, y = self._nodes[:, 0], self._nodes[:, 1]
        ll = (min(x), min(y))
        rh = (max(x), max(y))
        while True:
            x = (ll[0] + (rh[0] - ll[0]) * np.random.rand(1, 1)[0][0])
            y = (ll[1] + (rh[1] - ll[1]) * np.random.rand(1, 1)[0][0])
            if self.node_inside((x, y)):
                break
        return Point2D.from_xy(x, y)

    def closest_point(self, point):
        """
        Calculates the closest point on this polygon's edges to a given point.

        Parameters
        ----------
        point : Point2D, numpy array, tuple (of numbers) or list (of numbers)
            The point to find the closest point for.

        Returns
        -------
        Point2D
            The calculated point on the polygon edges.
        """
        l = Line2D(np.vstack((self._nodes, self._nodes[0])))
        return l.closest_point(point)

    def closest_distance(self, point):
        """
        Calculates the distance between the closest point on this polygon's
        edges to a given point.

        Parameters
        ----------
        point : Point2D, numpy array, tuple (of numbers) or list (of numbers)
            The point to find the closest distance for.

        Returns
        -------
        float
            The closest distance.
        """
        l = Line2D(np.vstack((self._nodes, self._nodes[0])))
        return l.closest_distance(point)

    def intersects_line(self, line):
        """
        Check if polygon intersects with a line.

        Parameters
        ----------
        line : Line2D
            Segmented line to check for intersection with this line.

        Returns
        -------
        boolean
            True if intersection exists, False otherwise.

        Raises
        ------
        TypeError
            If this line or the given line are not segmented lines.
        """
        if not line.is_segment:
            raise TypeError("only for segmented line")

        if self.has_edge(line):
            return False

        if self.node_inside(line.mid_point()) and \
                not self.point_on_edges(line.mid_point()):
            return True

        start_coinc_i = np.all(self._nodes == line.nodes[0], axis=1)
        end_coinc_i = np.all(self._nodes == line.nodes[1], axis=1)
        start_coincides = np.any(start_coinc_i)
        end_coincides = np.any(end_coinc_i)
        if start_coincides:
            for edge in self.edges():
                if not edge.has_node(line.nodes[0]):
                    if edge.intersect(line):
                        return True
            return False
        if end_coincides:
            for edge in self.edges():
                if not edge.has_node(line.nodes[1]):
                    if edge.intersect(line):
                        return True
            return False

        def ccw(A, B, C):
            """Check if nodes are in counterclockwise order"""
            return (C[1] - A[1]) * (B[0] - A[0]) > \
                   (B[1] - A[1]) * (C[0] - A[0])

        C, D = line._nodes[0], line._nodes[1]
        for i in range(len(self._nodes)):
            if i != len(self._nodes) - 1:
                A, B = self._nodes[i], self._nodes[i + 1]
            else:
                A, B = self._nodes[i], self._nodes[0]
            if ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D):
                return True

        return False


class AxisParallelRectangle(Polygon2D):
    """
    A 2D rectangle with sides parallel to x-axis and y-axis, respectively.

    Parameters
    ----------
    left_low : numpy array, tuple (of numbers) or list (of numbers)
        Left lowest vertex of the rectangle.
    right_high : numpy array, tuple (of numbers) or list (of numbers)
        Right highest vertex of the rectangle.

    Attributes
    ----------
    length
    height
    """

    def __init__(self, left_low, right_high):
        """
        Initialize axis parallel rectangle by left lowest and right highest
        vertex.
        """
        nodes = np.array([left_low, (left_low[0], right_high[1]),
                          right_high, (right_high[0], left_low[1])])
        super(AxisParallelRectangle, self).__init__(nodes)
        self._left_low = self._nodes[0]
        self._right_high = self._nodes[2]
        self._length = Point2D(self._nodes[1]) \
            .distance(Point2D(self._nodes[2]))
        self._height = Point2D(self._nodes[0]) \
            .distance(Point2D(self._nodes[1]))

    @property
    def left_low(self):
        """Get left lowest corner node."""
        return self._left_low

    @property
    def right_high(self):
        """Get right highest corner node."""
        return self._right_high

    @property
    def length(self):
        """Get side length of the rectangle parallel to x-axis."""
        return self._length

    @property
    def height(self):
        """Get side length of the rectangle parallel to y-axis."""
        return self._height

    def area(self):
        """
        Calculates area of the rectangle.

        Returns
        -------
        float
            Area of the rectangle.
        """
        return self._length * self._height


class RegularPolygon2D(Polygon2D):
    """
    A regular 2D polygon.

    Parameters
    ----------
    nsides : int
        Number of sides of the regular polygon.
    rotation : float, optional
        Angle of rotation [rad].
    origin : Point2D, numpy array, tuple (of numbers) or list (of numbers),
            optional
        Center of the regular polygon.
    side : float
        Side length of the regular polygon.
    """

    def __init__(self, nsides, rotation=0, origin=Point2D(np.array((0, 0))),
                 side=1.0):
        """Initialize the regular polygon"""
        self._nsides = nsides
        self._rotation = rotation
        self._origin = enforce_point2d(origin)
        self._side = side
        super(RegularPolygon2D, self).__init__(self.make_nodes())

    def make_nodes(self):
        """
        Calculates the locations of the vertices corresponding to this regular
        polygon's definition.

        Returns
        -------
        numpy array
            The vertices of the regular polygon.
        """
        steps = np.linspace(0, 2.0 * np.pi, self._nsides + 1)[:-1] \
                + self._rotation
        return self._origin.nodes + \
               np.stack((np.sin(steps), np.cos(steps))).T * self._side

    @property
    def nsides(self):
        """Get number of sides."""
        return self._nsides

    @property
    def rotation(self):
        """Get rotation of polygon."""
        return self._rotation

    @property
    def origin(self):
        """Get center of polygon."""
        return self._origin

    @property
    def side(self):
        """Get side length of polygon."""
        return self._side
