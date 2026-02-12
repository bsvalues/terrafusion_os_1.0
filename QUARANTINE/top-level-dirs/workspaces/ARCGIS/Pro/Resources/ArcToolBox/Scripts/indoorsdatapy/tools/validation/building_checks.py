from collections import defaultdict
import logging
from indoorsdatapy.access.utilities import zones_points_by_level
from indoorsdatapy.common.const.zone_type import BOUNDING_BOX, DEAD_ZONE, ZONE
from shapely.geometry import Point, LineString, Polygon, MultiPolygon

logger = logging.getLogger(__name__)


def position_in_zone_checker(recordings_access,
                             building_access,
                             position_type=1,
                             zone_type=2,
                             correct=True):
    """
    Check all positions are in of zone
    Parameters
    ----------
    recordings_access (dict):
            mandatory keys: positions
    building_access (dict):
            mandatory keys: walls,edge_points,floors
    position_type (int):
            accordingly to indoors-protocol definition
    zone_type (int):
            accordingly to indoors-protocol definition

    Returns (bool)
    -------
            Return False if some of positions
            are not inside of at least one of zones

    """

    zones = zones_points_by_level(building_access['zones'],
                                  building_access['zone_points'],
                                  building_access['floors'],
                                  zone_type=zone_type)

    positions = recordings_access.positions_by_level(
        position_type=position_type)

    pos_by_level = defaultdict(list)

    if len(set(positions.keys()) & set(zones.keys())) == 0:
        return correct

    for level, _positions in positions.items():
        for idx, pos in _positions.iterrows():
            pos_by_level[level].append(Point([pos.x, pos.y]))

    result = set()
    for floor, _zones in zones.items():
        if floor not in pos_by_level:
            continue

        for zone_id in set(_zones['id'].values):
            points = _zones[_zones['zone_id'] == zone_id]
            if len(points) == 0:
                continue

            zone = Polygon(
                points.set_index(['sort_order'
                                 ])[['x',
                                     'y']].to_records(index=False).tolist())

            for point in pos_by_level[floor]:
                if not zone.contains(point):
                    result.add(False)
                else:
                    result.add(True)

    if len(result) == 2:
        return False

    if len(result) == 0:
        return correct

    return result.pop()


def recording_cross_zone_checker(recordings_access,
                                 building_access,
                                 position_type=1,
                                 zone_type=2):
    """
    Check if consecutive positions cross zone

    Parameters
    ----------
    recordings_access (dict):
            mandatory keys: positions
    building_access (dict):
            mandatory keys: walls,edge_points,floors
    position_type (int):
            accordingly to indoors-protocol definition
    zone_type (int):
            accordingly to indoors-protocol definition

    Returns (bool)
    -------
            False if two consecutive positions cross at least one of zones

    """

    zones = zones_points_by_level(building_access['zones'],
                                  building_access['zone_points'],
                                  building_access['floors'],
                                  zone_type=zone_type)

    positions = recordings_access.positions_by_level(
        position_type=position_type)

    path_by_level = {
        level: LineString(pos[['x', 'y']].to_records(index=False).tolist())
        for level, pos in positions.items()
    }

    # can be multilevel recording; so we have to iterate over floors
    for floor, _zones in zones.items():
        if floor not in path_by_level:
            continue
        for zone_id in set(_zones['id'].values):
            points = _zones[_zones['zone_id'] == zone_id]
            if len(points) == 0:
                return True

            zone = Polygon(
                points.set_index(['sort_order'
                                 ])[['x',
                                     'y']].to_records(index=False).tolist())
            if path_by_level[floor].intersection(zone):
                return False

    return True


def recording_cross_wall_checker(recordings_access,
                                 building_access,
                                 position_type=1):
    """
    Check if consecutive positions cross wall
    Parameters
    ----------
    recordings_access (dict):
            mandatory keys: positions
    building_access (dict):
            mandatory keys: walls,edge_points,floors
    position_type (int):
            accordingly to indoors-protocol definition

    Returns
    -------
            False if two consecutive positions cross at least one of walls
    """
    walls = building_access.walls_by_floors()

    positions = recordings_access.positions_by_level(
        position_type=position_type)
    path_by_level = {
        level: LineString(pos[['x', 'y']].to_records(index=False).tolist())
        for level, pos in positions.items()
    }

    for floor, _walls in walls.items():
        if floor not in path_by_level:
            continue
        for idx, wall in _walls.iterrows():
            edge = LineString([[wall.x0, wall.y0], [wall.x1, wall.y1]])
            if path_by_level[floor].intersection(edge):
                return False

    return True


def polygon_validator(polygons, info_type):
    valid = True
    for floor, df in polygons.items():
        tmp_bound = []
        for zone_id, zdf in df.groupby(by='zone_id'):
            tmp_bound.append(Polygon(zdf[['x', 'y']].values))
        if tmp_bound:
            plg = MultiPolygon(tmp_bound)
            if not plg.is_valid:
                logger.info('%s on floor lvl %s\n' % (info_type, floor))
                valid = False
    return valid


def polygon_validator(polygons, info_type):
    valid = True
    for floor, df in polygons.items():
        tmp_bound = []
        for zone_id, zdf in df.groupby(by='zone_id'):
            tmp_bound.append(Polygon(zdf[['x', 'y']].values))
        if tmp_bound:
            plg = MultiPolygon(tmp_bound)
            if not plg.is_valid:
                logger.info('%s on floor lvl %s\n' % (info_type, floor))
                valid = False
    return valid


# below checks for validation recordings and input building.
# Functions return true or false
RECORDING_BUILDING_CHECKER = \
    dict(
        GT_bounding_box=lambda r, b: position_in_zone_checker(r, b, 1, 2, True),
        GT_not_dead_zone=lambda r, b: not position_in_zone_checker(
            r, b, 1, 1, False),
        consecutive_GT_not_intersect_dead_zone=
        lambda r, b: recording_cross_zone_checker(r, b, 1, 1),
        consecutive_GT_not_intersect_wall=
        lambda r, b: recording_cross_wall_checker(r, b, 1),
        radio_type_match=lambda r, b: set(r['radios']['type'].unique()) == set(
            b['networks']['type'].unique())
    )

BUILDING_CHECKER = dict(boundaries_validator=lambda b: polygon_validator(
    b.zones_points_by_level(BOUNDING_BOX), 'BOUNDING_BOX'),
                        zone_validator=lambda b: polygon_validator(
                            b.zones_points_by_level(ZONE), 'ZONE'),
                        dead_validator=lambda b: polygon_validator(
                            b.zones_points_by_level(DEAD_ZONE), 'DEAD_ZONE'))
