#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
usage: transform_building2.py [-h] [-o ORIGIN] [-d DESTINATION]
                              --destination_deg DESTINATION_DEG
                              [--scale SCALE] [-B DTO]
                              [-r PATH]

Transform

optional arguments:
  -h, --help            show this help message and exit
  -o ORIGIN, --origin ORIGIN
                        geojson: left upper and right bottom corners of
                        original map in meters
  -d DESTINATION, --destination DESTINATION
                        geojson: left upper and right bottom corners of
                        destination map in meters
  --destination_deg DESTINATION_DEG
                        geojson: left upper corner of destination map in
                        degree
  --scale SCALE
  -B DTO, --building_dto DTO
                        building protocolbuffers
  -r PATH, --output_dir PATH

"""
import argparse
import json
import logging
import os

import geopandas as gpd
from indoorsdatapy.access.building import BuildingAccess

logger = logging.getLogger(__name__)
logging.basicConfig()


def calculate_scale_from_corners(corners):
    """

    :param corners:
    :return:
    """
    # (dest downRight - dest topLeft)/(origin DownRight - origin topLeft)
    idx_x = 0
    idx_y = 1
    top_left = 0
    bottom_right = 1
    scale_x = (corners['dest'][bottom_right][idx_x] -
               corners['dest'][top_left][idx_x]
               ) / (corners['origin'][bottom_right][idx_x] -
                    corners['origin'][top_left][idx_x])

    scale_y = (corners['dest'][bottom_right][idx_y] -
               corners['dest'][top_left][idx_y]) / (
                      corners['origin'][bottom_right][idx_y] -
                      corners['origin'][top_left][idx_y])

    logger.info('Scale for x is < %s >' % scale_x)
    logger.info('Scale for y is < %s >' % scale_y)

    return (scale_y + scale_x) / 2


def load_corners(origin, destination):
    """

    :param origin:
    :param destination:
    :return:
    """
    gdf_orig = gpd.read_file(origin)
    gdf_dest = gpd.read_file(destination)

    # Not sure about this. It might be also one of the corners ob bounds
    origin_x_left_top = gdf_orig['geometry'].iloc[0].x
    origin_y_left_top = gdf_orig['geometry'].iloc[0].y
    origin_x_right_bottom = gdf_orig['geometry'].iloc[1].x
    origin_y_right_bottom = gdf_orig['geometry'].iloc[1].y

    dest_x_left_top = gdf_dest['geometry'].iloc[0].x
    dest_y_left_top = gdf_dest['geometry'].iloc[0].y
    dest_x_right_bottom = gdf_dest['geometry'].iloc[1].x
    dest_y_right_bottom = gdf_dest['geometry'].iloc[1].y

    return dict(origin=((origin_x_left_top, origin_y_left_top),
                        (origin_x_right_bottom, origin_y_right_bottom)),
                dest=((dest_x_left_top, dest_y_left_top),
                      (dest_x_right_bottom, dest_y_right_bottom)))


def load_corner(gjson):
    gdf_orig = gpd.read_file(gjson)
    return gdf_orig['geometry'].iloc[0].x, gdf_orig['geometry'].iloc[0].y


def scale_waypoints(pb, scale):
    """

    :param pb:
    :param scale:
    :return:
    """
    logger.info('Scaling waypoints')
    for wp in pb.way_points:
        mp = wp.map_point
        mp.x = int(mp.x * scale)
        mp.y = int(mp.y * scale)


def scale_portals(pb, scale):
    """

    :param pb:
    :param scale:
    :return:
    """
    logger.info('Scaling portals')
    for wp in pb.portals:
        mp = wp.entrance
        mp.x = int(mp.x * scale)
        mp.y = int(mp.y * scale)


def scale_xy_helper(df, access_key, result, geo_params):
    """

    :param df:pd.DataFrame
    :param access_key: str
    :param result: dict
    :param geo_params: tuple
    :return:
    """
    frame = df[access_key].copy()
    if frame.empty:
        logger.info('Df < %s >  is empty' % access_key)
        result[access_key] = frame
        return

    logger.debug('Df < %s > before: \n%s' % (access_key, frame.head()))
    logger.info('Transforming: < %s >. row(s): < %s >' % (
        access_key, len(frame.index)))
    frame['x'] = frame['x'] * geo_params['scale']

    frame['y'] = frame['y'] * geo_params['scale']

    logger.debug('Df < %s > after: \n%s' % (access_key, frame.head()))
    logger.info('Difference  < %s > in [ mm ]: \n%s' % (
        access_key, (frame - df[access_key]).head()))

    result[access_key] = frame


def update_building_metadata(pb, corner, geo_data):
    """

    :param pb: protocolbuffer Building
    :param corner:
    :param geo_data:
    :return:
    """
    if corner:
        lon_origin = corner[0]
        lat_origin = corner[1]

        pb.lon_origin = int(lon_origin * 1e6)
        pb.lat_origin = int(lat_origin * 1e6)
        for row in pb.metadata:
            if row.name == 'building_base_coordinate_0':
                logger.info('Updating metadata.building_base_coordinate_0')
                row.value = str(lat_origin)
            if row.name == 'building_base_coordinate_1':
                logger.info('Updating metadata.building_base_coordinate_1')
                row.value = str(lon_origin)

    for floor in pb.floors:
        floor.default_map.per_pixel_base *= geo_data['scale']
        floor.width *= geo_data['scale']
        floor.height *= geo_data['scale']


def main():
    parser = argparse.ArgumentParser(
        description='Transform')

    parser.add_argument(
        '-o', '--origin',
        help='geojson: left upper and right '
             'bottom corners of original map in meters',
        type=str)

    parser.add_argument(
        '-d', '--destination',
        help='geojson: left upper and right bottom '
             'corners of destination map in meters',
        type=str)

    parser.add_argument(
        '--destination_deg',
        help='geojson: left upper corner of destination map in degree',
        type=str)

    parser.add_argument(
        '--scale',
        type=float)


    parser.add_argument(
        '--config',
        help='json with all configuration'
             '{origin:{top_left:[x,y], bottom_right:[x,y]},'
             ' destination:{top_left:[x,y], bottom_right:[x,y]},'
             'destination_deg:[x,y]}',
        type=str)

    parser.add_argument(
        "-B", '--building_dto', metavar="DTO",
        help='building protocolbuffers', type=str)

    parser.add_argument(
        "-r", "--output_dir", metavar="PATH", type=str)

    logger.setLevel(logging.INFO)

    parsed = parser.parse_args()
    data = {}
    corner_deg = None

    if parsed.config:
        c = json.loads(parsed.config)
        corners = dict(
            origin=(c['origin']['top_left'],
                    c['origin']['bottom_right']),
            dest=(c['destination']['top_left'],
                  c['destination']['bottom_right']))

        data['scale'] = calculate_scale_from_corners(corners)
        corner_deg = c['destination_deg']
    elif not any(x is None for x in [parsed.origin, parsed.destination,
                                     parsed.destination_deg]):
        corners = load_corners(parsed.origin, parsed.destination)
        data['scale'] = calculate_scale_from_corners(corners)
    elif parsed.scale:
        data['scale'] = parsed.scale
    else:
        raise AttributeError('Wrong combination of arguments is provided')

    if not os.path.isdir(parsed.output_dir):
        os.makedirs(parsed.output_dir)

    if parsed.building_dto:
        access = BuildingAccess(
            parsed.building_dto, ['zone_points', 'edge_points',
                                  'fingerprint_points', 'network_locations'
                                  ])
        corner = None
        if corner_deg or parsed.destination_deg:
            corner = corner_deg or load_corner(parsed.destination_deg)
        update_building_metadata(access.pb, corner, data)

        result = {}
        scale_xy_helper(access, 'zone_points', result, data)
        scale_xy_helper(access, 'edge_points', result, data)
        scale_xy_helper(access, 'fingerprint_points', result, data)
        scale_xy_helper(access, 'network_locations', result, data)
        scale_waypoints(access.pb, data['scale'])
        scale_portals(access.pb, data['scale'])

        out_path = os.path.join(parsed.output_dir, 'building.pb')
        with open(out_path, 'wb') as out:
            logger.info('saving transformed recording to %s' % out_path)
            access.update_pb(result, out)


if __name__ == "__main__":
    main()
