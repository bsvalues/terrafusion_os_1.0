#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script for clipping fingerprint points of the slam_map protocol buffer
 by boundaries of building protocol buffer.

usage: bound_clipper.py [-h] [-M DTO] [-B DTO] -o OUTPUT_FILE
                        [-s SETTINGS_JSON] [--verbose] [--quiet] [--overwrite]

__main__ - Slam_map clipper

optional arguments:
  -h, --help            show this help message and exit
  -M DTO, --slam_map_dto DTO
                        Path of slam dto
  -B DTO, --building_dto DTO
                        path of building dto
  -o OUTPUT_FILE, --output_file OUTPUT_FILE
                        Output file destination
  -s SETTINGS_JSON, --settings SETTINGS_JSON
                        Settings (json string)
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH

"""
import argparse
from logging import getLogger
from shutil import copyfile

from indoorsdatapy.access.building import BuildingAccess
from indoorsdatapy.access.factory.utils import save
from indoorsdatapy.access.slam_map import (load_map_estimates_qr,
                                           serialize_slam_map_helper)
from indoorsdatapy.algorithms.wall_point_clipper import clip_by_walls
from indoorsdatapy.common.cli import (custom_parser, slam_map_dto,
                                      output_file, settings, building_dto)
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.common.utils import get_settings

logger = getLogger(__name__)

DEFAULT_SETTINGS = {'clip_fringe': 1.5}


def main():
    args = [slam_map_dto, building_dto, output_file, settings]
    parser = custom_parser(
        args, description="{} - Slam_map clipper ".format(__name__))
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    if not parsed.output_file:
        raise argparse.ArgumentError(None, 'output_file is missing')

    setting = get_settings(parsed.settings, DEFAULT_SETTINGS)
    est = load_map_estimates_qr(parsed.slam_map_dto)
    before_clip = len(est['estimates'])
    logger.info('Positions before clipping %s' % before_clip)

    clipped = clip_by_walls(
        est['estimates'],
        BuildingAccess(parsed.building_dto, ['zones', 'zone_points', 'floors']),
        building_boundary_fringe=setting['clip_fringe'])

    after_clip = len(clipped)
    if after_clip == 0:
        raise ValueError("No fingerprints remain after clipping")
    logger.info('Positions after clipping %s' % after_clip)

    if before_clip - after_clip == 0:
        logger.info("Positions not clipped. File will be copy")
        copyfile(parsed.slam_map_dto, parsed.output_file)
        logger.info('Original slam radio map has been copy to < %s >' %
                    parsed.output_file)
        return 0

    if est['map_type'] == 1:
        est['map_type'] = 'RADIO_MAP'
    elif est['map_type'] == 0:
        est['map_type'] = 'SLAM_GRID'

    pb = serialize_slam_map_helper(
        grid=clipped,
        building_id=est['building'],
        recording_ids=est['recordings'],
        map_type=est['map_type'],
        hex_side=est.get('hex_side'))

    with open(parsed.output_file, 'wb') as f:
        save(pb, f)
        logger.info('Clipped slam radio map saved to < %s >' %
                    parsed.output_file)


if __name__ == '__main__':
    main()
