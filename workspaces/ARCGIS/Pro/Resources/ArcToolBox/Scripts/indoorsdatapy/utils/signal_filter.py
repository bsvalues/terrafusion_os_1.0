#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script for removing radiodata from recordings based on time window size and radio count.
The motivation is to shrink recording segments of low data count.
usage: signal_filter.py [-h] -R DTOS [DTOS ...] -d OUTPUT_DIR
                        [-p OUTPUT_FILE_PREFIX] [-s SETTINGS_JSON] [--verbose]
                        [--quiet] [--overwrite]

Radio signal filter

optional arguments:
  -h, --help            show this help message and exit
  -R DTOS [DTOS ...], --recording_dtos DTOS [DTOS ...]
                        Path of recordings dto(s)
  -d OUTPUT_DIR, --output_dir OUTPUT_DIR
                        Output dir destination
  -p OUTPUT_FILE_PREFIX, --output_prefix OUTPUT_FILE_PREFIX
                        Prefix of output file
  -s SETTINGS_JSON, --settings SETTINGS_JSON
                        Settings (json string)
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH

"""
import logging

from indoorsdatapy.access.factory.pb2df import pb2dfs
from indoorsdatapy.access.factory.utils import save, load_pb
from indoorsdatapy.access.manipulation.update import update_pb
from indoorsdatapy.common.cli import recording_dtos, custom_parser, settings, output_dir, output_prefix
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.common.utils import build_path, get_settings
from indoorsprotocol.recordings_pb2 import Recording
from numpy import arange

logger = logging.getLogger(__name__)

SIGNAL_FILTER_DEFAULT = {'size': 1.,  # size of window in sec
                         'signal_min_n': 10  # threshold of min signal count per size
                         }


def signal_filter(df, size, signal_min_n):
    t_max = df['t'].max()
    t_min = df['t'].min()
    for time in arange(t_min, t_max, size):
        window = df[(df['t'] >= time) & (df['t'] < time + size)]
        if not window.empty and len(window) < signal_min_n:
            df.drop(window.index, inplace=True)

    return df


def main():
    args = [(recording_dtos, {'required': True}), output_dir, output_prefix, settings]
    parser = custom_parser(args, description="Radio signal filter")
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    setting = get_settings(parsed.settings, SIGNAL_FILTER_DEFAULT)

    for dto in parsed.recording_dtos:
        pb_rec = load_pb(Recording, open(dto, 'rb'))
        access = pb2dfs(pb_rec, ['radios'])

        out_file = build_path(parsed.output_dir, prefix=parsed.output_prefix,
                              file_path=dto, extension='.pb')

        with open(out_file, 'wb') as out:
            result = signal_filter(access['radios'], setting['size'], setting['signal_min_n'])
            logging.info('Number of radio signals before: < %s > and after filter < %s >' % (len(access['radios']),
                                                                                             len(result)))

            logger.info('Saving result to %s' % out_file)
            save(update_pb({'radios': result}, pb_rec), out)


if __name__ == '__main__':
    main()
