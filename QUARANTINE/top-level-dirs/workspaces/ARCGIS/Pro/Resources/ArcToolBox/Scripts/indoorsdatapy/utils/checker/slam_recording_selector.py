#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
usage: slam_recording_selector.py [-h] [-R DTOS [DTOS ...]] [-o OUTPUT_FILE]
                                  [--verbose] [--quiet] [--overwrite] --type
                                  {initial}

Recording set validator

optional arguments:
  -h, --help            show this help message and exit
  -R DTOS [DTOS ...], --recording_dtos DTOS [DTOS ...]
                        Path of recordings dto(s)
  -o OUTPUT_FILE, --output_file OUTPUT_FILE
                        Output file destination
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists
  --type {initial}      Type of checker

(c) indoo.rs GmbH

"""
import json
import os
import shutil
from logging import getLogger
from sys import stdout

from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.common.cli import (recording_dtos, custom_parser,
                                      output_file, output_dir)
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.tools.validation.validators_interface import (
    SLAMInitialRecordingsSetSelector)

logger = getLogger(__name__)


def main():
    args = [recording_dtos,
            (output_file, {'required': False}),
            (output_dir, {'required': False})
            ]
    parser = custom_parser(args, description="Recording set validator")
    parser.add_argument('--type', default='initial',
                        help="Type of checker",
                        choices=('initial', 'update'), required=True)
    parsed = parser.parse_args()

    accesess = {access: RecordingAccess(open(access, 'rb'))
                for access in parsed.recording_dtos}
    if parsed.type == 'initial':
        slam_validator = SLAMInitialRecordingsSetSelector(accesess)
    if parsed.type == 'update':
        # TODO VALIDATE THIS
        slam_validator = SLAMInitialRecordingsSetSelector(accesess)

    valid = list(slam_validator())

    if parsed.output_dir:
        cli_logger(parsed.verbose, parsed.quiet)
        for path in valid:
            dest_path = os.path.join(parsed.output_dir, os.path.basename(path))
            shutil.copy(path, dest_path)
            logger.info(
                'Selected recording has been copied to < %s >' % dest_path)

    if parsed.output_file:
        with open(parsed.output_file, 'w') as f:
            json.dump(valid, f)
    else:
        stdout.write(json.dumps(valid))
        stdout.flush()


if __name__ == '__main__':
    main()
