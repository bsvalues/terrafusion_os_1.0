# -*- coding: utf-8 -*-

import logging

from shapely.geometry import Polygon, Point, MultiPolygon
from shapely.validation import explain_validity

logger = logging.getLogger(__name__)


def clip_by_boundary_single_floor(points, boundary, boundary_fringe,
                                  group_by=None, attr_map=None):
    """
    Clipping x y positions by access.building.boundary
    :param points: pd.DataFrame
    :param boundary: pd.DataFrame
    :param boundary_fringe: float
    :param group_by: list
    :param attr_map: dict
    :return: pd.DataFrame
        clipped df
    """
    group_by = group_by or ["x", "y"]
    attr_map = attr_map or {'x': 'x', 'y': 'y'}

    bd = boundary[[attr_map['x'], attr_map['y']]].values
    if bd.size > 0:
        tmp_bound = [Polygon(bdf[['x', 'y']].values)
                     for zone_id, bdf in boundary.groupby(by='zone_id')]
        bd = MultiPolygon(tmp_bound)
        bounds_expand = bd.buffer(boundary_fringe).union(bd)

        return points.groupby(
            group_by, sort=False, as_index=False).filter(
            lambda est: bounds_expand.contains(
                Point(est[[attr_map['x'], attr_map['y']]].values[0])))
    else:
        return points


def clip_by_boundary(points, boundaries, building_boundary_fringe,
                     group_by=None, x='x', y='y', floor='floor',
                     levels=None):
    """
    Clipping x y positions by access.building.boundary. Allows multiple floors

    :param points: df
    :param polygon df
    :param building_boundary_fringe: 
    :param group_by: tuple
    :param x: str
        mapping attr x
    :param y: str
        mapping attr y
    :param floor:str 
        mapping attr floor
    :param levels: int
        floors to be processed
    :return: df
    """
    # clip only points of floors which has bounds and contra
    group_by = group_by or ["q", "r", "floor"]
    lvl = levels or boundaries.keys()
    levels = list(set(points[floor].values).intersection(set(lvl)))
    bounds = {}
    for f in levels:
        tmp_bound = [Polygon(bdf[['x', 'y']].values)
                     for zone_id, bdf in
                     boundaries[int(f)].groupby(by='zone_id')]
        if tmp_bound:
            plg = MultiPolygon(tmp_bound)
            if plg.is_valid:
                bounds[int(f)] = plg
            else:
                bounds[int(f)] = Polygon()
                logger.warning(
                    "Polygon invalid! Explanation: %s" % explain_validity(plg))

    # Expand boundaries by fringe
    bounds_expand = {
        level: b.buffer(
            building_boundary_fringe).union(b) for level, b in bounds.items()}
    pts = points
    if bounds_expand:
        # Filter out any points not contained by the expanded bounds
        pts = points.groupby(
            by=group_by, sort=False, as_index=False).filter(
            lambda est: bounds_expand[int(est[floor].values[0])].contains(
                Point(est[[x, y]].values[0]))
            if int(est[floor].values[0]) in bounds_expand else True)
    return pts


def clip_by_walls(points, building_access, building_boundary_fringe,
                  group_by=("q", "r", "floor"), x='x', y='y', floor='floor',
                  levels=None):
    """

    :param points:  df[x,y,floor_level]
    :param building_access: dict
        access.building
    :param building_boundary_fringe: number
        extension of walls out of polygon
    :param group_by: tuple
        for clipping attributes to use for groupby
    :param x: str
        column name of x
    :param y: str 
        column name of y
    :param floor: str
        column name of floor
    :param levels: list(int)
        specific levels if wanted
    :return: df
        grid
    """
    # Get boundaries from building
    return clip_by_boundary(
        points, building_access.boundaries(), building_boundary_fringe,
        group_by=group_by, x=x, y=y, floor=floor, levels=levels)
