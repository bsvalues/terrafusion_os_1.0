#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Validate building for replayer
usage: replayer_building_checker.py [-h] -B DTO [--verbose] [--quiet]
                                    [--overwrite]

Replyer building checker

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
from indoorsdatapy.tools.validation.validators_interface import REPLAYERBuildingChecker

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
    parser = custom_parser(args, description="Replyer building checker")
    parsed = parser.parse_args()

    with open(parsed.recording_dto, 'rb') as f:
        building = BuildingAccess(f)
        replayer_validator = REPLAYERBuildingChecker(building, True)
        valid = replayer_validator()

        logger.info('Building < %s > is < %s >' % (
            parsed.bui, 'valid' if valid else 'not valid'))
        exit(0 if valid else -1)


if __name__ == '__main__':
    main()
