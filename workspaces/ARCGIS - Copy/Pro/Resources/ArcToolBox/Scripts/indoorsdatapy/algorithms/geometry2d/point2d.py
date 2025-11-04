#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""A 2D point with x and y coordinate."""

import math

import numpy as np
from indoorsdatapy.algorithms.geometry2d.dimension_error import DimensionError
from indoorsdatapy.algorithms.geometry2d.entity2d import Entity2D
from indoorsdatapy.algorithms.geometry2d.helpers import enforce_nodes_ndarray


def enforce_point2d(value):
    """
    Make sure a given object is a Point2D.

    Parameters
    ----------
    value : Point2D, numpy array, tuple (of numbers) or list (of numbers)
        Object to convert.

    Returns
    -------
    Point2D
        The point created from the given object.

    Raises
    ------
    TypeError
        If the type of the given object is not convertible to a Point2D.
    """
    if isinstance(value, Point2D):
        return value
    elif isinstance(value, np.ndarray):
        return Point2D(value)
    elif isinstance(value, (tuple, list)):
        return Point2D(np.array(value))
    else:
        raise TypeError("value must be of one of these types: Point2D, "
                        "numpy array, tuple or list")


class Point2D(Entity2D):
    """
    A 2D point with x and y coordinate.

    Parameters
    ----------
    node : 1D numpy array, tuple (of numbers) or list (of numbers)
        Coordinates of the point.

    Raises
    ------
    DimensionError
        If node is not 1D.
    TypeError
        If node is not of numpy array, tuple or list type.
    """

    def __init__(self, node):
        if isinstance(node, (np.ndarray, tuple, list)):
            if isinstance(node, (tuple, list)):
                node = np.array(node)
            if node.ndim == 1:
                super(Point2D, self).__init__(node)
            else:
                raise DimensionError("nodes must be 1D")
        else:
            raise TypeError("node must be 1D numpy array, list or tuple")

    @classmethod
    def from_xy(cls, x, y):
        """
        Creates a Point2D from x and y parameters.

        Parameters
        ----------
        x, y : float
            x, y coordinate of the point.

        Returns
        -------
        Point2D
            The point created from the coordinates.
        """
        return cls(np.array((x, y)))

    @property
    def x(self):
        """Get x coordinate."""
        return self._nodes[0]

    @property
    def y(self):
        """Get y coordinate."""
        return self._nodes[1]

    def __neg__(self):
        """
        Creates a point with sign flipped coordinates.

        Returns
        -------
        Point2D
            Point with sign flipped coordinates.
        """
        return Point2D(-self._nodes)

    def __add__(self, other):
        """
        Adds this point's coordinates and another point's coordinates and
        returns a new point from with the result.

        Parameters
        ----------
        other : Point2D, numpy array, tuple (of numbers) or list (of numbers)
            Container of the coordinates to add.

        Returns
        -------
        Point2D
            Point with resulting coordinates.
        """
        return Point2D(self._nodes + enforce_nodes_ndarray(other))

    __radd__ = __add__

    def __sub__(self, other):
        """
        Substracts another point's coordinates from this point's and returns
        the result as a new point.

        Parameters
        ----------
        other : Point2D, numpy array, tuple (of numbers) or list (of numbers)
            Container of the coordinates to substract.

        Returns
        -------
        Point2D
            Point with resulting coordinates.
        """
        return Point2D(self._nodes - enforce_nodes_ndarray(other))

    __rsub__ = __sub__

    def __mul__(self, value):
        """
        Multiplies the point's coordinates by one or two scalar values and
        returns the result as a new point.

        Parameters
        ----------
        value : int, float, numpy array, Point2D
            Representation of the factor to multiply this points coordinates
            with. If 2D, then multiply x coordinate with first entry and y
            coordinate with second entry.

        Returns
        -------
        Point2D
            Point2D with resulting coordinates.

        Raises
        ------
        TypeError
            If value is not of int, float, numpy array or Point2D type.
        """
        if isinstance(value, (int, float, np.ndarray)):
            return Point2D(self._nodes * value)
        elif isinstance(value, Point2D):
            return Point2D(self._nodes * value.nodes)
        else:
            raise TypeError("value must be int, float, Point2D or np.ndarray")

    __rmul__ = __mul__

    def __div__(self, value):
        """
        Divides the point's coordinates by one or two scalar values and returns
        the result as a new point.

        Parameters
        ----------
        value : int, float, numpy array, Point2D
            Representation of the divisor to divide this points coordinates by.
            If 2D, then divide x coordinate with first entry and y coordinate
            with second entry.

        Returns
        -------
        Point2D
            Point2D with resulting coordinates.

        Raises
        ------
        TypeError
            If value is not of int, float, numpy array or Point2D type.
        """
        if isinstance(value, (int, float, np.ndarray)):
            return Point2D(self._nodes / value)
        elif isinstance(value, Point2D):
            return Point2D(self._nodes / value.nodes)
        else:
            raise TypeError("value must be int, float, Point2D or np.ndarray")

    __rdiv__ = __div__
    __truediv__ = __div__

    def __abs__(self):
        """
        Creates a point with the absolute values of this one's coordinates.

        Returns
        -------
        Point2D
            Point with absolute values of this one's coordinates.
        """
        return Point2D(np.abs(self._nodes))

    def move(self, **kwargs):
        """
        Move point to a new position.

        Parameters
        ----------
        kwargs : named arguments
            Describes the movement depending on the given arguments:
                'node' : Point2D, numpy array, tuple (of numbers)
                        or list (of numbers)
                    New location.
                'x', 'y' : int or float
                    New coordinates x and y.
                'distance', 'angle' : int or float
                    Radial distance and angle [rad] relative to x-axis.
        """
        if 'node' in kwargs:
            self.move_cartesian(kwargs['node'])
        elif 'x' in kwargs or 'y' in kwargs:
            self.move_cartesian(np.array((kwargs['x'], kwargs['y'])))
        elif 'distance' in kwargs and 'angle' in kwargs:
            self.move_polar(distance=kwargs['distance'], angle=kwargs['angle'])

    def move_cartesian(self, node):
        """
        Move point to new position by cartesian coordinates.

        Parameters
        ----------
        node : Point2D, numpy array, tuple (of numbers) or list (of numbers)
            New location.
        """
        self._nodes = enforce_nodes_ndarray(node)

    def move_polar(self, distance, angle):
        """
        Move point a given distance at a given angle [rad] relative to the
        x-axis.

        Parameters
        ----------
        distance : int or float
            Radial distance.
        angle : int or float
            Angle [rad] relative to x-axis.
        """
        self.move_cartesian((self._nodes[0] + distance * math.cos(angle),
                             self._nodes[1] + distance * math.sin(angle)))

    def angle_x_axis_point(self, point):
        """
        Calculates the angle between the horizontal line (parallel to the
        x-axis) going through this point and the line going through this and a
        given point.

        Parameters
        ----------
        point : Point2D
            The other point.

        Returns
        -------
        float
            The resulting angle [rad].
        """
        xy = point.nodes - self._nodes
        return np.arctan2(xy[1], xy[0])

    def distance(self, point):
        """
        Calculates the Euclidean distance between this point and a given
        location.

        Parameters
        ----------
        point : Point2D, numpy array, tuple (of numbers) or list (of numbers)
            The other point.

        Returns
        -------
        float
            The distance between the points.
        """
        return np.linalg.norm(self._nodes - enforce_nodes_ndarray(point))

    def between(self, point):
        """
        Returns a point that is in the middle of this point and a given
        location.

        Parameters
        ----------
        point : Point2D, numpy array, tuple (of numbers) or list (of numbers)
            The other point.

        Returns
        -------
        Point2D
            The point halfway in between.
        """
        return Point2D((self._nodes + enforce_nodes_ndarray(point)) / 2.)

    def nth_closest(self, points, n=1):
        """
        Finds the nth closest point in a point cloud to this one.

        Parameters
        ----------
        points : 2D numpy array, tuple of Point2D or list of Point2D
            The point cloud.
        n : int, optional
            The n in nth closest point.

        Returns
        -------
        numpy array, tuple (of numbers) or list (of numbers)
            Nth closest element in the point cloud.

        Raises
        ------
        TypeError
            If points are not of list/tuple of Point2D or 2D numpy array.
        """
        if isinstance(points, np.ndarray) and points.ndim == 2:
            ps = points
        elif isinstance(points, (tuple, list)) \
                and all([isinstance(p, Point2D) for p in points]):
            ps = np.array([p.nodes for p in points])
        else:
            raise TypeError("points must be list/tuple of Point2D or"
                            "2D numpy array")

        ps = ps - self.nodes
        norms = np.linalg.norm(ps, axis=1)
        index = np.argsort(norms)[n - 1]
        return points[index]

    def angle_between(self, point1, point2):
        """
        Calculates the angle between three points having this point as vertex.

        Parameters
        ----------
        point1, point2 : Point2D, numpy array, tuple (of numbers) or list (of
                numbers)
            The other two points.

        Returns
        -------
        float
            The resulting angle [rad].
        """
        point1 = enforce_point2d(point1)
        point2 = enforce_point2d(point2)
        l01 = self.distance(point1)
        l02 = self.distance(point2)
        l12 = point1.distance(point2)
        try:
            return math.acos((l01 ** 2 + l02 ** 2 - l12 ** 2) / (2 * l01 * l02))
        except ValueError:
            if np.isclose(((l01 ** 2 + l02 ** 2 - l12 ** 2) / (2 * l01 * l02)), -1):
                return math.acos(-1)
            elif np.isclose(((l01 ** 2 + l02 ** 2 - l12 ** 2) / (2 * l01 * l02)), 1):
                return math.acos(1)
            else:
                raise
