#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Validate recordings suitability for Replayer
usage: replayer_recording_checker.py [-h] -R DTO [--verbose] [--quiet]
                                     [--overwrite]

Replyer recording validator

optional arguments:
  -h, --help            show this help message and exit
  -R DTO, --recording_dto DTO
                        Path of recordings dto
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH

"""
import logging
from sys import exit

from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.common.cli import recording_dto, custom_parser
from indoorsdatapy.tools.validation.validators_interface import REPLAYERRecordingChecker

logger = logging.getLogger(__name__)


def main():
    """
    usage: replayer_recording_checker.py -R DTOs

    Recording validator

    optional arguments:
    -R DTOs, --recording_dto DTO
            Path of recordings dto
    (c) indoo.rs GmbH
    """
    args = [(recording_dto, {'required': True})]
    parser = custom_parser(args, description="Replyer recording validator")
    parsed = parser.parse_args()

    with open(parsed.recording_dto, 'rb') as f:
        recording = RecordingAccess(f)
        slam_validator = REPLAYERRecordingChecker(recording, True)
        valid = slam_validator()

        logger.info('Recording < %s > is < %s >' % (
            parsed.recording_dto, 'valid' if valid else 'not valid'))
        exit(0 if valid else -1)


if __name__ == '__main__':
    main()
