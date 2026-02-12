#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script for updating fingerprint points and radio statistics of building by slam map
usage: building_update.py [-h] [-M DTO] [-B DTO] -o OUTPUT_FILE [--verbose]
                          [--quiet] [--overwrite]

Update of Building pb by SlamMap pb: None

optional arguments:
  -h, --help            show this help message and exit
  -M DTO, --slam_map_dto DTO
                        Path of slam dto
  -B DTO, --building_dto DTO
                        path of building dto
  -o OUTPUT_FILE, --output_file OUTPUT_FILE
                        Output file destination
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH

"""
import logging

from indoorsdatapy.access.factory.utils import load_pb, save
from indoorsdatapy.common.cli import (custom_parser, output_file, slam_map_dto,
                                      building_dto)
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.tools.building_update_core import (
    get_updated_building)
from indoorsprotocol.buildings_pb2 import Building
from indoorsprotocol.slams_pb2 import SlamMap

logger = logging.getLogger(__name__)


def main():
    args = [slam_map_dto,
            building_dto,
            output_file]
    parser = custom_parser(args,
                           description="Update of Building pb by SlamMap pb: {}".format(
                               __doc__))

    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    logging.info('Updating building < %s > by SlamMap < %s > ' % (
    parsed.building_dto, parsed.slam_map_dto))
    updated_building = get_updated_building(
        load_pb(Building, open(parsed.building_dto, 'rb')),
        load_pb(SlamMap, open(parsed.slam_map_dto, 'rb')))

    with open(parsed.output_file, 'wb') as out:
        logging.info('Saving updated building to < %s >' % parsed.output_file)
        save(updated_building, out)


if __name__ == "__main__":
    main()
