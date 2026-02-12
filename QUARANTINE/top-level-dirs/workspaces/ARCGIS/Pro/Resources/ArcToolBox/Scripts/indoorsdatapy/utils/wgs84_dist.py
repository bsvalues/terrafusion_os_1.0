"""
Calculate distance on Earth approximated by ellipsoid using Vincenty formula
usage: wgs84_dist.py [-h] --lon_a LON_A --lat_a LAT_A --lon_b LON_B --lat_b
                     LAT_B

Calculate accurately distance of two lat,long coordinates on WGS-84 ellipsoid

optional arguments:
  -h, --help     show this help message and exit
  --lon_a LON_A
  --lat_a LAT_A
  --lon_b LON_B
  --lat_b LAT_B

"""

import argparse
import logging

from indoorsdatapy.algorithms.distance_wgs84 import VincentyInverse
from indoorsdatapy.common.logging_setup import cli_logger

logger = logging.getLogger(__name__)
logging.basicConfig()
logger.setLevel(logging.DEBUG)


def main():
    parser = argparse.ArgumentParser(
        description='Calculate accurately distance of two lat,long coordinates '
                    'on WGS-84 ellipsoid')

    parser.add_argument(
        '--lon_a',
        required=True,
        type=float)
    parser.add_argument(
        '--lat_a',
        required=True,
        type=float)
    parser.add_argument(
        '--lon_b',
        required=True,
        type=float)
    parser.add_argument(
        '--lat_b',
        required=True,
        type=float)

    p = parser.parse_args()
    cli_logger(p.verbose, p.quiet)

    a = VincentyInverse([p.lon_a, p.lat_a], [p.lon_b, p.lat_b])
    logger.info('Distance in meeteres:%s' % a.m)
    logger.info('Distance in km: %s' % a.km)
    logger.info('Distance in mm: %s' % a.mm)
    logger.info('Distance in miles: %s' % a.miles)
    logger.info('Distance in n_miles: %s' % a.n_miles)
    logger.info('Distance in ft: %s' % a.ft)
    logger.info('Distance in inches: %s' % a.inches)
    logger.info('Distance in yards: %s' % a.yards)


if __name__ == '__main__':
    main()
