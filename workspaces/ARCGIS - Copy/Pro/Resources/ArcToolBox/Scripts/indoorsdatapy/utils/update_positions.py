#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
It takes specified position type of one recording and copy it to second one
usage: update_positions.py [-h] [-R DTO] [-o OUTPUT_FILE] [--verbose]
                           [--quiet] [--overwrite] [--recording_dto2 DTO]

__main__- Positions updater

optional arguments:
  -h, --help            show this help message and exit
  -R DTO, --recording_dto DTO
                        Path of recordings dto
  -o OUTPUT_FILE, --output_file OUTPUT_FILE
                        Output file destination
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists
  --recording_dto2 DTO

(c) indoo.rs GmbH
"""

from logging import getLogger

import pandas as pd
from indoorsdatapy.access.factory.pb2df import pb2dfs
from indoorsdatapy.access.factory.utils import save, load_pb
from indoorsdatapy.access.manipulation.update import update_pb
from indoorsdatapy.common.cli import (recording_dto, custom_parser,
                                      output_file)
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsprotocol.positions_pb2 import PositionType
from indoorsprotocol.recordings_pb2 import Recording

logger = getLogger(__name__)


def main():
    args = [(recording_dto, {'required': False}),
            (output_file, {'required': False})]

    parser = custom_parser(args,
                           description="%s- Positions updater " % __name__)
    parser.add_argument("--recording_dto2", metavar="DTO", type=str)

    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    rec1 = parsed.recording_dto
    rec2 = parsed.recording_dto2

    with open(rec1, 'rb') as pb1:
        pb_rec1 = load_pb(Recording, pb1)
        rec1_pos = pb2dfs(pb_rec1, ['positions'])['positions']
        rec1_pos = rec1_pos[rec1_pos['type'] == PositionType.Value('GROUND_TRUTH')]

    with open(rec2, 'rb') as pb2:
        pb_rec2 = load_pb(Recording, pb2)
        rec2_pos = pb2dfs(pb_rec2, ['positions'])['positions']
    df = pd.concat([rec1_pos, rec2_pos], ignore_index=True)
    with open(parsed.output_file, 'wb') as out:
        save(update_pb({'positions': df}, pb_rec2), out)


if __name__ == '__main__':
    main()

