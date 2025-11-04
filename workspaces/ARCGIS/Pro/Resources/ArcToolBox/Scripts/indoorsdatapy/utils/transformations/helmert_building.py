#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Transform points using Helmert transformation
usage: helmert_recording.py [-h] -o ORIGIN -d DESTINATION [-R DTOS [DTOS ...]]
                            [-r PATH]

Transform points using Helmert transformation

optional arguments:
  -h, --help            show this help message and exit
  -o ORIGIN, --origin ORIGIN
                        geojson: set of coordinates of origin points
  -d DESTINATION, --destination DESTINATION
                        geojson: set of coordinates of destination points
  -R DTOS [DTOS ...], --recording_dtos DTOS [DTOS ...]
                        recording protocolbuffers
  -r PATH, --output_dir PATH

"""
import argparse
import logging
import os

from indoorsdatapy.access.building import BuildingAccess
from indoorsdatapy.algorithms.transformations import HelmertHelper
from indoorsdatapy.tools.transformation import get_coefs

logger = logging.getLogger(__name__)
logging.basicConfig()
logger.setLevel(logging.DEBUG)


def transform_xy_helper(df, access_key, result, coefs):
    """

    :param df:pd.DataFrame
    :param access_key: str
    :param result: dict
    :param coefs: tuple
    :return:
    """
    conversion = 1000.
    frame = df[access_key].copy()
    if frame.empty:
        logger.info('Df < %s >  is empty' % (access_key))
        result[access_key] = frame
        return

    logger.debug('Df < %s > before: \n%s' % (access_key, frame.head()))
    logger.info(
        'Transforming: < %s >. row(s): < %s >' % (access_key, len(frame.index)))

    frame['x'] = frame['x'].apply(lambda x: x / conversion)
    frame['y'] = frame['y'].apply(lambda y: y / conversion)

    r = HelmertHelper.similarity_transform(
        frame[['x', 'y']].values, coefs)

    frame['x'] = r[:, 0] * conversion
    frame['y'] = r[:, 1] * conversion
    frame['x'] = frame['x'].apply(lambda x: int(x))
    frame['y'] = frame['y'].apply(lambda y: int(y))

    logger.debug('Df < %s > after: \n%s' % (access_key, frame.head()))
    logger.info('Difference  < %s > in [ mm ]: \n%s' % (
        access_key, (frame - df[access_key]).head()))
    result[access_key] = frame


def main():
    parser = argparse.ArgumentParser(
        description='Transform points using Helmert transformation')

    parser.add_argument(
        '-o', '--origin',
        default=None,
        required=True,
        help='geojson: set of coordinates of origin points',
        type=str)

    parser.add_argument(
        '-d', '--destination',
        required=True,
        help='geojson: set of coordinates of destination points',
        type=str)

    parser.add_argument(
        '--origin_corner',
        required=True,
        help='geojson: ',
        type=str)

    parser.add_argument(
        "-B", '--building_dto', metavar="DTO",
        help='building protocolbuffers', type=str)

    parser.add_argument(
        "-r", "--output_dir", metavar="PATH", type=str)

    parsed = parser.parse_args()

    if not os.path.isdir(parsed.output_dir):
        os.makedirs(parsed.output_dir)

    coefs, out_path_report = get_coefs(parsed.origin, parsed.destination,
                                       parsed.origin_corner, parsed.output_dir)

    if parsed.building_dto:
        access = BuildingAccess(
            parsed.building_dto, ['zone_points', 'edge_points',
                                  'fingerprint_points', 'network_locations'])

        result = {}
        transform_xy_helper(access, 'zone_points', result, coefs)
        transform_xy_helper(access, 'edge_points', result, coefs)
        transform_xy_helper(access, 'fingerprint_points', result, coefs)
        transform_xy_helper(access, 'network_locations', result, coefs)

        out_path = os.path.join(parsed.output_dir, 'building.pb')

        with open(out_path, 'wb') as out:
            logger.info('saving transformed recording to %s' % out_path)
            access.update_pb(result, out)

    with open(out_path_report, 'r') as rd:
        logger.info('Report:' + ''.join(rd.readlines()))


if __name__ == "__main__":
    main()
