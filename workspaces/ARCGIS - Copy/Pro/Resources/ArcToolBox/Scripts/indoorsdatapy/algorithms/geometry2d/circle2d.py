#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""A 2D circle."""

import math

from indoorsdatapy.algorithms.geometry2d.point2d import Point2D
from indoorsdatapy.algorithms.geometry2d.point2d import enforce_point2d
from indoorsdatapy.algorithms.geometry2d.polygon2d import RegularPolygon2D


class Circle2D(object):
    """
    A 2D circle.

    Parameters
    ----------
    center : Point2D, numpy array, tuple (of numbers) or list (of numbers)
        The center of the circle.
    radius : float
        The radius of the circle.
    """

    def __init__(self, center, radius):
        super(Circle2D, self).__init__()
        self._center = enforce_point2d(center)
        self._radius = radius

    @property
    def center(self):
        """Get the circle center."""
        return self._center

    @property
    def radius(self):
        """Get the circle radius."""
        return self._radius

    def point_inside(self, p, eps=1e-7):
        p = enforce_point2d(p)
        return self.center.distance(p) * (1. + eps) < self.radius

    def is_covered(self, circle):
        """Check if this circle is fully covered by another given circle."""
        return self.center.distance(circle.center) + self.radius \
               <= circle.radius

    def intersects(self, circle, points=False):
        dp = circle.center - self.center
        d = self.center.distance(circle.center)
        if d > (self.radius + circle.radius):
            return None if points else False
        if d < abs(self.radius - circle.radius):
            return None if points else False
        if not points:
            return True
        a = (self.radius * self.radius - circle.radius * circle.radius +
             (d * d)) / (2.0 * d)
        p2 = self.center + d * (a / d)
        h = math.sqrt(self.radius * self.radius - a * a)

        rx = -dp.y * (h / d)
        ry = dp.x * (h / d)

        return Point2D((p2.x + rx, p2.y + ry)), Point2D((p2.x - rx, p2.y - ry))

    def interpolate(self, n_points):
        return RegularPolygon2D(n_points, origin=self.center, side=self.radius)
