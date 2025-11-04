#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""A 2D line."""

import math

import numpy as np
from indoorsdatapy.algorithms.geometry2d.dimension_error import DimensionError
from indoorsdatapy.algorithms.geometry2d.entity2d import Entity2D
from indoorsdatapy.algorithms.geometry2d.helpers import enforce_nodes_ndarray
from indoorsdatapy.algorithms.geometry2d.point2d import Point2D
from indoorsdatapy.algorithms.geometry2d.point2d import enforce_point2d


class Line2D(Entity2D):
    """
    A 2D line.

    Parameters
    ----------
    nodes : 2D numpy array, tuple of tuples (of numbers) or list of lists (of
            numbers)
        Locations defining the vertices of the connected line.
    is_segment : boolean, optional
        True if line is a segment (and only two nodes are given), False
        otherwise.

    Attributes
    ----------
    is_polyline : boolean
        True if line consists of more than one straight line segment (number of
        nodes > 2).

    Raises
    ------
    DimensionError
        If nodes are not 2D, less than 2 nodes are given or a polyline is not
        defined as a segmented line.
    TypeError
        If nodes are not of numpy array, tuple or list type.
    """

    def __init__(self, nodes, is_segment=True):
        self._is_polyline = True if len(nodes) > 2 else False
        if self._is_polyline and not is_segment:
            raise DimensionError("connected lines must be segments")
        self._is_segment = is_segment

        if isinstance(nodes, (np.ndarray, tuple, list)):
            if isinstance(nodes, (tuple, list)):
                nodes = np.array(nodes)
            if nodes.ndim == 2:
                if len(nodes) > 1:
                    super(Line2D, self).__init__(nodes)
                else:
                    raise DimensionError("lines need at least 2 nodes")
            else:
                raise DimensionError("nodes must be 2D")
        else:
            raise TypeError("nodes must be 2D numpy array, list or tuple")

    @classmethod
    def from_points(cls, points, is_segment=True):
        """
        Initialize line from a list of points.

        Parameters
        ----------
        points : list of Point2D
            The vertices of the line (or polyline).
        is_segment : boolean, optional
            True if line is segment, False otherwise.

        Returns
        -------
        Line2D
            The created line having the given points as vertices.
        """
        return cls(np.array([p.nodes for p in points]), is_segment)

    @property
    def start(self):
        """Get first point of line."""
        return Point2D(self._nodes[0])

    @property
    def end(self):
        """Get last point of line."""
        return Point2D(self._nodes[-1])

    @property
    def is_segment(self):
        """Get if line is segment."""
        return self._is_segment

    @property
    def is_polyline(self):
        """Get if line is polyline."""
        return self._is_polyline

    @is_segment.setter
    def is_segment(self, value):
        """
        Set if line is segment.

        Raises
        ------
        DimensionError
            If trying to set is_segment to False on a polyline.
        """
        if self._is_polyline and value:
            self._is_segment = value
        elif not self._is_polyline:
            self._is_segment = value
        else:
            raise DimensionError("connected lines must be segments")

    def has_single_segment(self, segment):
        """
        Check if a line segment is part of this line.

        Parameters
        -----------
        segment : Entity2D, numpy array, tuple of tuples (of numbers)
                  or list of lists (of numbers)

        Returns
        -------
        boolean
            True if segment is part of this line, False otherwise.
        """
        segment = enforce_nodes_ndarray(segment)
        for i, node in enumerate(self._nodes[1:-1]):
            if np.array_equal(node, segment[0]):
                if np.array_equal(self._nodes[i], segment[1]) or \
                        np.array_equal(self._nodes[i + 2], segment[1]):
                    return True
            if np.array_equal(node, segment[1]):
                if np.array_equal(self._nodes[i], segment[0]) or \
                        np.array_equal(self._nodes[i + 2], segment[0]):
                    return True
        return False

    def as_vector(self):
        """
        Creates a position vector considering the starting location of this
        line as origin and the last vertex of this line as end point.

        Returns
        -------
        Point2D
            Point representing the position vector.

        Raises
        ------
        TypeError
            If this line is not segmental.
        """
        if self._is_segment:
            return Point2D(self._nodes[-1] - self.nodes[0])
        else:
            raise TypeError("vectors can only be created from segmental "
                            "non-polyline lines")

    def slices(self, is_segment=True):
        """
        Create single lines from segments of this polyline.

        Parameters
        ----------
        is_segment : boolean
            Decides if the returned lines should be segments or not.

        Returns
        -------
        List of Line2D
            The created lines.
        """
        return [Line2D((n1, n2), is_segment) for n1, n2
                in np.hstack((self._nodes[:-1], self._nodes[1:]))
                    .reshape((len(self._nodes) - 1, 2, -1))]

    def mid_point(self):
        """
        Calculates the mid point of a line segment.

        Returns
        -------
        Point2D
            The point lying in the middle of this line segment.

        Raises
        ------
        DimensionError
            If this line is a polyline.
        """
        if self._is_polyline:
            raise DimensionError("not valid for line polyline")
        return Point2D(np.sum(self._nodes, axis=0) / 2)

    def length(self):
        """
        Calculates the length of this line.

        Returns
        -------
        float
            The line length.
        """
        return np.sum(np.linalg.norm(self._nodes[:-1] - self._nodes[1:],
                                     axis=1))

    def closest_point(self, point):
        """
        Calculates the closest point on this line to a given point.

        Parameters
        ----------
        point : Point2D, numpy array, tuple (of numbers) or list (of numbers)
            The point to find the closest point for.

        Returns
        -------
        Point2D
            The calculated point on the line.
        """
        if self._is_polyline:
            point = enforce_point2d(point)
            min_d = np.inf
            closest_point = None
            for l in self.slices(self.is_segment):
                cp = l.closest_point(point)
                d = point.distance(cp)
                if d < min_d:
                    min_d = d
                    closest_point = cp
            return closest_point

        p = enforce_point2d(point)
        v = self.as_vector()
        u = np.sum(((p.nodes - self.nodes[0]) * v.nodes)) / self.length() ** 2
        if self._is_segment:
            if u < 0.0:
                return self.start
            elif u > 1.0:
                return self.end
        return self.start + u * v

    def closest_distance(self, point):
        """
        Calculates the distance between the closest point on this line to a
        given point.

        Parameters
        ----------
        point : Point2D, numpy array, tuple (of numbers) or list (of numbers)
            The point to find the closest distance for.

        Returns
        -------
        float
            The closest distance.
        """
        p = enforce_point2d(point)
        return np.sqrt(np.sum((self.closest_point(p).nodes - p.nodes) ** 2))

    def intersect(self, line):
        """
        Check if segmented line intersects with other segmented line.

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
        if not self.is_segment or not line.is_segment:
            raise TypeError("only for segmented line")

        def ccw(A, B, C):
            """Check if nodes are in counterclockwise order"""
            return (C[1] - A[1]) * (B[0] - A[0]) > \
                   (B[1] - A[1]) * (C[0] - A[0])

        C, D = line._nodes[0], line._nodes[1]
        for i in range(len(self._nodes) - 1):
            A, B = self._nodes[i], self._nodes[i + 1]
            if ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D):
                return True
        return False

    def intersect_line(self, line):
        """
        Calculates the intersection with a given line.

        Parameters
        ----------
        line : Line2D, 2D numpy array, tuple of tuples (of numbers) or list of
                lists (of numbers)
            The line to calculate the intersection for.

        Returns
        -------
        Point2D or None
            The intersection point or None if no intersection.

        Raises
        ------
        DimensionError
            If this line or the given line is a polyline.
        """
        if self._is_polyline or (isinstance(line, Line2D) and
                                 line.is_polyline):
            raise DimensionError("intersect_line only available for non-"
                                 "polyline lines")
        (x1, y1), (x2, y2) = self._nodes
        (x3, y3), (x4, y4) = line._nodes if isinstance(line, Line2D) else line

        deltax21 = x2 - x1
        deltay21 = y2 - y1
        deltax43 = x4 - x3
        deltay43 = y4 - y3
        deltax13 = x1 - x3
        deltay13 = y1 - y3

        d = deltay43 * deltax21 - deltax43 * deltay21
        na = deltax43 * deltay13 - deltay43 * deltax13
        nb = deltax21 * deltay13 - deltay21 * deltax13

        if abs(d) < self.epsilon:
            # Lines parallel
            return None

        mua = float(na) / d
        mub = float(nb) / d
        if self.is_segment and (mua < 0 or mua > 1 or mub < 0 or mub > 1):
            # Lines cross outside segment
            return None
        return Point2D(np.array((x1 + mua * deltax21, y1 + mua * deltay21)))

    def intersect_point(self, point):
        """
        Check if a given point is on this line.

        Parameters
        ----------
        point : Point2D, numpy array, tuple (of numbers) or list (of numbers)
            Point to check if on this line.

        Returns
        -------
        boolean
            True if point on line, False otherwise.
        """
        point = enforce_point2d(point)

        epsilon = 1E-6

        # Check if slope of a to c is the same as a to b ;
        # that is, when moving from a.x to c.x, c.y must be proportionally
        # increased than it takes to get from a.x to b.x .

        # Then, c.x must be between a.x and b.x, and c.y must be between a.y
        # and b.y.
        # => c is after a and before b, or the opposite
        # that is, the absolute value of cmp(a, b) + cmp(b, c) is either 0
        # ( 1 + -1 ) or 1 ( c == a or c == b)

        for i in range(len(self._nodes) - 1):
            intersects = True

            dbax = self._nodes[i + 1][0] - self._nodes[i][0]
            dbay = self._nodes[i + 1][1] - self._nodes[i][1]
            dcax = point._nodes[0] - self._nodes[i][0]
            dcay = point._nodes[1] - self._nodes[i][1]

            crossproduct = dcay * dbax - dcax * dbay
            if abs(crossproduct) > epsilon:
                intersects = False

            dotproduct = dcax * dbax + dcay * dbay
            if dotproduct < 0:
                intersects = False

            squaredlength = dbax ** 2 + dbay ** 2
            if dotproduct > squaredlength:
                intersects = False

            if intersects:
                return True
        return False

    def intersect_circle(self, circle):
        """
        Calculates intersections of this line with a given circle.
        Source: http://www.vitutor.com/geometry/conics/circle-line.html

        Parameters
        ----------
        circle : Circle2D
            The circle to check for intersections with this line.

        Returns
        -------
        list of Point2D
            List of all intersections of the given circle with this line.
        """
        if self._is_polyline:
            intersections = []
            for l in self.slices(self._is_segment):
                i = l.intersect_circle(circle)
                intersections.extend(i)
            return intersections
        (ax, ay), (bx, by) = self._nodes

        deltax = bx - ax
        deltay = by - ay
        a = deltax * deltax + deltay * deltay
        b = 2.0 * (deltax * (ax - circle.center.x) +
                   deltay * (ay - circle.center.y))
        c = circle.center.x * circle.center.x + \
            circle.center.y * circle.center.y + \
            ax * ax + ay * ay - \
            2.0 * (circle.center.x * ax + circle.center.y * ay) - \
            circle.radius * circle.radius
        discriminant = b * b - 4.0 * a * c

        if abs(a) < self.epsilon or discriminant < -self.epsilon:
            # CASE 1: NO INTERSECTION
            return ()
        if discriminant < self.epsilon:
            # CASE 2: TANGENT
            mu = -b * 0.5 / a
            tangent = Point2D((ax + mu * deltax, ay + mu * deltay))
            # Ensure tangent is on line segment
            if self.is_segment and not self.intersect_point(tangent):
                tangent = None
                return ()
            return (tangent,)
        # CASE 3: SECANT
        mu1 = (-b + math.sqrt(discriminant)) * 0.5 / a
        mu2 = (-b - math.sqrt(discriminant)) * 0.5 / a
        secant1 = Point2D((ax + mu1 * deltax, ay + mu1 * deltay))
        secant2 = Point2D((ax + mu2 * deltax, ay + mu2 * deltay))
        if self.is_segment and not self.intersect_point(secant1):
            secant1 = None
        if self.is_segment and not self.intersect_point(secant2):
            secant2 = None
        return () if secant1 is None and secant2 is None else \
            (secant2,) if secant1 is None and secant2 is not None else \
                (secant1,) if secant1 is not None and secant2 is None else \
                    (secant1, secant2)
