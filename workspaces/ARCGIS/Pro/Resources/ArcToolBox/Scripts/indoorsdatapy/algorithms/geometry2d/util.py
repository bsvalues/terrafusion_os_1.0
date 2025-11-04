#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Utility module with mixed functions for 2D geometry.
"""
import sys

import numpy as np
from indoorsdatapy.algorithms.geometry2d.dimension_error import DimensionError
from indoorsdatapy.algorithms.geometry2d.polygon2d import AxisParallelRectangle
from scipy.spatial import ConvexHull


def surrounding_rectangle(entity):
    """
    Determine the smallest axis parallel rectangle around this entity's
    nodes.

    Returns
    -------
    AxisParallelRectangle
        Surrounding rectangle containing all vertices.
    """
    if len(entity.nodes) < 2:
        raise DimensionError("At least 2 nodes necessary to create"
                             "surrounding rectangle")
    x, y = entity.nodes[:, 0], entity.nodes[:, 1]
    return AxisParallelRectangle((min(x), min(y)), (max(x), max(y)))


def convex_hull(entity):
    """
    Calculates the convex hull of this entity.

    Returns
    -------
    2D numpy array
        The vertices of the convex hull of this entity.
    """
    if len(entity.nodes) < 4:
        return entity.nodes
    return entity.nodes[ConvexHull(entity.nodes).vertices]


def bounding_box(iterable):
    """
    Create bounding box for given array
    :param iterable:
    :return: coords of top left and  right bottom corner
    """
    #   TOP  LEFT
    #      -------------
    #      |           |
    #      |     BB    |
    #      |           |
    #      -------------
    #            RIGHT BOTTOM

    min_x, min_y = np.min(iterable[0], axis=0)
    max_x, max_y = np.max(iterable[0], axis=0)
    # (left,top), (right,bottom)
    return np.array([(min_x, max_y), (max_x, min_y)])


def check_bb_intersect(a, b):
    """
    Check if two bounding boxes have intersect
    :param a:  bounding_box a
    :param b: bounding_box b
    :return: true if is intersect
    """
    #  !(r2.left > r1.right
    #  or r2.right < r1.left
    #  or r2.top < r1.bottom
    #  or r2.bottom > r1.top)
    if (b[0][0] > a[1][0] or
            b[1][0] < a[0][0] or
            b[0][1] < a[1][1] or
            b[1][1] > a[0][1]):
        return False
    return True


class PolygonsTouching(Exception):
    """ This exception is triggered when two polygons touch at one point.

    This is for internal use only and will be caught before returning.

    """

    def __init__(self, x=0, y=0):
        self.x, self.y = x, y

    def __str__(self):
        return 'The tested polygons at least touch each other at (%f,%f)' \
               % (self.x, self.y)

    def shift(self, dx, dy):
        self.x += dx
        self.y += dy


def point_inside_polygon(polygon, point):
    x, y = point

    n = len(polygon)
    inside = False

    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y

    return inside


def segment_distance(sp1, sp2, point):
    x1, y1 = sp1
    x2, y2 = sp2
    x, y = point
    px = x2 - x1
    py = y2 - y1
    u = 0 if px == 0 and py == 0 else np.clip(
        ((x - x1) * px + (y - y1) * py) / float(px * px + py * py), 0, 1)
    dx = x1 + u * px - x
    dy = y1 + u * py - y

    return np.sqrt(dx * dx + dy * dy)


def polygon_distance(polygon, point):
    x, y = point
    eps = polygon  # edge points of polygon
    d = sys.float_info.max
    for i in range(len(eps)):
        sd = segment_distance(eps[i - 1], eps[i], point)
        d = np.min([d, sd])

    return d


def line_intersection(line1, line2):
    xdiff = (line1[0][0] - line1[1][0], line2[0][0] - line2[1][0])
    ydiff = (line1[0][1] - line1[1][1], line2[0][1] - line2[1][1])

    def det(a, b):
        return a[0] * b[1] - a[1] * b[0]

    div = det(xdiff, ydiff)
    if div == 0:
        return None

    d = (det(*line1), det(*line2))
    x = det(d, xdiff) / div
    y = det(d, ydiff) / div
    return x, y


def segment_intersection(seg1, seg2):
    """
    Input: segment1, segment2: [(p1_x, p1_y), (p2_x, p2_y)]
    returns true if segments are intersecting
    """

    def ccw(a, b, c):
        return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0])

    a, b = seg1
    c, d = seg2
    return ccw(a, c, d) != ccw(b, c, d) and ccw(a, b, c) != ccw(a, b, d)
