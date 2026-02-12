import functools
import itertools
import math
import random
from typing import Optional

import arcpy


def check_shape(geometry_type: str = None):
    """Function decorator that handles null/empty geometries"""

    def inner(func):
        @functools.wraps(func)
        def wrapper(shape: arcpy.Geometry, *args, **kwargs):
            if shape is None:  # Null stays Null
                return None
            if not shape or shape.firstPoint is None:  # empty geometry becomes empty with new geometry_type
                if geometry_type is None:
                    return shape
                return arcpy.FromWKT(f"{geometry_type} {shape.WKT.split(' ', 1)[1]}", shape.spatialReference)

            return func(shape, *args, **kwargs)

        return wrapper

    return inner


@check_shape("LINESTRING")
def polygon_to_diameter_polyline(shape: arcpy.Polygon) -> Optional[arcpy.Polyline]:
    """Creates a polyline between the vertices in the polygon that are farthest apart"""
    # Extract all vertices from the polygon and find the 4 points with min/max X/Y.
    vertices = tuple(filter(None, itertools.chain.from_iterable(shape.getPart())))
    a = max(vertices, key=lambda p: p.X)
    b = max(vertices, key=lambda p: p.Y)
    c = min(vertices, key=lambda p: p.X)
    d = min(vertices, key=lambda p: p.Y)

    # Find the pair of points that are farthest apart.
    lengths = {}
    # a b c d are not always going to be different points, so we only need to visit the set.
    for start, end in itertools.combinations({a, b, c, d}, r=2):
        length = math.hypot(start.X - end.X, start.Y - end.Y)
        lengths[length] = (start, end)

    return arcpy.Polyline(
        arcpy.Array(lengths[max(lengths)]),
        spatial_reference=shape,
        has_z=shape.firstPoint.Z is not None,
        has_m=shape.firstPoint.M is not None,
    )


@check_shape()
def move(shape: arcpy.Geometry, x: float = 0, y: float = 0, z: float = 0) -> Optional[arcpy.Geometry]:
    """Moves shape by in X,Y,Z dimensions"""
    return shape.move(x, y, None if shape.firstPoint.Z is None else z)


@check_shape("POINT")
def polygon_to_point(shape: arcpy.Polygon) -> Optional[arcpy.PointGeometry]:
    """Creates a point at the centroid of the polygon"""
    point = shape.centroid
    return arcpy.PointGeometry(
        point,
        spatial_reference=shape.spatialReference,
        has_z=point.Z is not None,
        has_m=point.M is not None,
    )


@check_shape("MULTIPOINT")
def polygon_to_multipoint(shape: arcpy.Polygon) -> Optional[arcpy.Multipoint]:
    """Create a multipoint from all vertices in a polygon"""
    polyline = shape.boundary()
    return polyline_to_multipoint(polyline)


@check_shape("LINESTRING")
def polygon_to_polyline(shape: arcpy.Polygon) -> Optional[arcpy.Polyline]:
    """Create a polyline from polygon boundaries"""
    return shape.boundary()


@check_shape("POLYGON")
def polyline_to_polygon(shape: arcpy.Polyline, distance: float = 10) -> Optional[arcpy.Polygon]:
    """Create polygon from a polyline using a buffer"""
    return shape.buffer(distance)


@check_shape("POINT")
def polyline_to_point(shape: arcpy.Polyline, ratio: float = 0.50) -> Optional[arcpy.PointGeometry]:
    """Create a point from a polyline using a ratio of the length of the line"""
    return shape.positionAlongLine(value=ratio, use_percentage=True)


@check_shape("MULTIPOINT")
def polyline_to_multipoint(shape: arcpy.Polyline) -> Optional[arcpy.Multipoint]:
    """Create a multipoint from all vertices in a polyline"""
    vertices = tuple(filter(None, itertools.chain.from_iterable(shape.getPart())))
    first = shape.firstPoint
    return arcpy.Multipoint(
        arcpy.Array(vertices),
        spatial_reference=shape.spatialReference,
        has_z=first.Z is not None,
        has_m=first.Z is not None,
    )


@check_shape("POLYGON")
def point_to_polygon(shape: arcpy.PointGeometry, distance: float = 10) -> Optional[arcpy.Polygon]:
    """Create a polygon from a point using a buffer"""
    return shape.buffer(distance)


@check_shape("LINESTRING")
def point_to_polyline(shape: arcpy.PointGeometry, angle: float = 0, distance: float = 10) -> Optional[arcpy.Polyline]:
    """Create a polyline from a point"""
    geo: arcpy.Point = shape.firstPoint
    rads = math.radians(angle)
    return arcpy.Polyline(
        arcpy.Array([geo, move(shape, distance * math.cos(rads), distance * math.sin(rads)).firstPoint]),
        spatial_reference=shape.spatialReference,
        has_z=geo.Z is not None,
        has_m=geo.M is not None,
    )


@check_shape("MULTIPOINT")
def point_to_multipoint(shape: arcpy.PointGeometry, num_points: int, radius: float) -> Optional[arcpy.Multipoint]:
    """Create a multipoint from a point"""
    if not num_points or not radius:
        return

    # Using random r and theta does not result in a uniform distribution.
    # Weisstein, Eric W. "Disk Point Picking." From MathWorld--A Wolfram Web Resource.
    # https://mathworld.wolfram.com/DiskPointPicking.html

    pi2 = math.pi * 2
    points = []
    x, y, z, m = shape.firstPoint.X, shape.firstPoint.Y, shape.firstPoint.Z, shape.firstPoint.M
    for _ in range(num_points):
        r = math.sqrt(random.uniform(0, radius))
        theta = random.uniform(0, pi2)
        points.append(arcpy.Point(x + r * math.cos(theta), y + r * math.sin(theta), z, m))

    return arcpy.Multipoint(
        arcpy.Array(points),
        spatial_reference=shape.spatialReference,
        has_z=shape.firstPoint.Z is not None,
        has_m=shape.firstPoint.M is not None,
    )


@check_shape("POLYGON")
def multipoint_to_polygon(shape: arcpy.Multipoint) -> Optional[arcpy.Polygon]:
    """Create a polygon from a multipoint using convexHull. If multipoint is only one or two points, buffer to default amount."""
    geom = shape.convexHull()
    if geom.type != "polygon":
        return geom.buffer(10)
    return geom


@check_shape("LINESTRING")
def multipoint_to_polyline(shape: arcpy.Multipoint) -> Optional[arcpy.Polyline]:
    """Create a polyline from a multipoint using convexHull. If multipoint is only one or two points, buffer to default amount first."""
    geom = shape.convexHull()
    if geom.type == "polyline":
        return geom
    elif geom.type == "point":
        return point_to_polyline(geom)
    return geom.boundary()


@check_shape("POINT")
def multipoint_to_point(shape: arcpy.Multipoint) -> Optional[arcpy.PointGeometry]:
    """Create a point from a multipoint from centroid"""
    point = shape.centroid
    return arcpy.PointGeometry(
        point,
        spatial_reference=shape.spatialReference,
        has_z=point.Z is not None,
        has_m=point.M is not None,
    )


def create_point(
    x: float, y: float, z: float = None, m: float = None, spatial_reference: int = None
) -> arcpy.PointGeometry:
    """Create point geometry from x, y. Optionally include z, m, spatial reference"""
    point = arcpy.Point(x, y, z, m)
    sr = arcpy.SpatialReference(spatial_reference)
    return arcpy.PointGeometry(
        point,
        spatial_reference=sr,
        has_z=z is not None,
        has_m=m is not None,
    )
