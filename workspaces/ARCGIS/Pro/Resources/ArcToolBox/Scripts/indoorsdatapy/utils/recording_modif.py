#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
usage: recording_modif.py [-h] [-R DTO] [-b ID] [--verbose] [--quiet]
                          [--overwrite]

__main__- recording: building id updater

optional arguments:
  -h, --help            show this help message and exit
  -R DTO, --recording_dto DTO
                        Path of recordings dto
  -b ID, --building_id ID
                        building id to use
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH

"""

from logging import getLogger

from indoorsdatapy.access.factory.utils import save, load_pb
from indoorsdatapy.common.cli import (recording_dto, custom_parser,
                                      building_id)
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsprotocol.recordings_pb2 import Recording

logger = getLogger(__name__)


def main():
    args = [recording_dto, building_id]

    parser = custom_parser(
        args, description="%s- recording: building id updater " % __name__)

    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    with open(parsed.recording_dto, 'rb') as pb1:
        pb_rec1 = load_pb(Recording, pb1)

    with open(parsed.recording_dto, 'wb') as pb2:
        pb_rec1.building = parsed.building_id
        logger.info(
            "recording.building has been updated to %s" % parsed.building_id)
        save(pb_rec1, pb2)


if __name__ == '__main__':
    main()
