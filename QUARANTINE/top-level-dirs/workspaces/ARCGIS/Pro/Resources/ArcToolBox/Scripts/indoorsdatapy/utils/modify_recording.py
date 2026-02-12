#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script for changing id of recording base on condition.. Please firstly modify the condition
usage: modify_recording.py [-h] -R DTO -o OUTPUT_FILE [--verbose] [--quiet]
                    [--overwrite]

__main__ - Custom script for modify id of floors. Needs to be modified for
each particular usage

optional arguments:
  -h, --help            show this help message and exit
  -R DTO, --recording_dto DTO
                        Path of recordings dto
  -o OUTPUT_FILE, --output_fil#!/usr/bin/env python
# -*- coding: utf-8 -*-
e OUTPUT_FILE
                        Output file destination
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH
"""

from logging import getLogger

from indoorsdatapy.access.factory.pb2df import pb2dfs
from indoorsdatapy.access.factory.utils import save, load_pb
from indoorsdatapy.access.manipulation.update import update_pb
from indoorsdatapy.common.cli import recording_dto, custom_parser, output_file
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsprotocol.recordings_pb2 import Recording

logger = getLogger(__name__)


def main():
    args = [(recording_dto, {'required': True}),
            (output_file, {'required': True}),
            ]

    parser = custom_parser(
        args, description="{} - Custom script for modify id of floors."
                          " Needs to be modified for each particular usage".format(
            __name__))
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    field = 'positions'

    with open(parsed.recording_dto, 'rb') as pb:
        pb_rec = load_pb(Recording, pb)
        access = pb2dfs(pb_rec, [field])

    access[field]['floor'] = access[field]['floor'].apply(lambda x: int(x) - 1)

    with open(parsed.output_file, 'wb') as out:
        logger.info('Saving result to %s' % parsed.output_file)
        save(update_pb({field: access[field]}, pb_rec), out)


if __name__ == '__main__':
    main()
