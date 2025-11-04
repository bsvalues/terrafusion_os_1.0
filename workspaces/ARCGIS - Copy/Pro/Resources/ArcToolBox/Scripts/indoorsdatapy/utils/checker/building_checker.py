#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Check validity of building protocol buffer
usage: building_checker.py [-h] -B DTO [--verbose] [--quiet] [--overwrite]

Geometry building checker

optional arguments:
  -h, --help            show this help message and exit
  -B DTO, --building_dto DTO
                        path of building dto
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH

"""
import logging
from sys import exit

from indoorsdatapy.access.building import BuildingAccess
from indoorsdatapy.common.cli import building_dto, custom_parser
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.tools.validation.validators_interface import BUILDINGGeometryChecker

logger = logging.getLogger(__name__)


def main():
    """
    usage: replayer_building_checker.py -R DTOs

    Recording validator

    optional arguments:
    -R DTOs, --building_dto DTO
            Path of recordings dto
    (c) indoo.rs GmbH
    """
    args = [(building_dto, {'required': True})]
    parser = custom_parser(args, description="Geometry building checker")
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    with open(parsed.building_dto, 'rb') as f:
        building = BuildingAccess(f, ['zones', 'zone_points', 'floors'])

        building_validator = BUILDINGGeometryChecker(building, False)
        valid = building_validator()

        logger.info('Building < %s > is < %s >' % (
            parsed.building_dto, 'valid' if valid else 'not valid'))
        exit(0 if valid else -1)


if __name__ == '__main__':
    main()
