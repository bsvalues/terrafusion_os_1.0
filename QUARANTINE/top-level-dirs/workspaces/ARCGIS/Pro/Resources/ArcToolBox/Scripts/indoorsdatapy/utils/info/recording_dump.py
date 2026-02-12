#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Creates table with information for given recordings

Settings
--------
* columns - list - columns to include, must mach names in
  recording_access.get_recording_info()
* recordingaccess - RecordingAccess settings

Settings can be given as json string on commandline as follows:
    -s '{"columns":[...], "recordingaccess":{...}, ...}'

Examples
--------
* Print selected columns from 6 recordings
    python recordingsummary.py -r 2750 2751 2702 2703 2704 2721 -d -s \
    '{"columns":["id", "building_id", "duration", "n_steps"]}'

* Save all default as csv
    python recordingsummary.py -r 2750 2751 2702 2703 2704 2721 \
    -o output -f csv

Attributes
----------
logger : logginglogger
    Logger
SETTINGS : Dict
    Default settings
"""

import logging
from argparse import ArgumentParser
from copy import deepcopy
from json import loads

from indoorsdatapy.access.provider.load_access import access_loader
from indoorsdatapy.common.pd_utils import save_df
from indoorsdatapy.common.time_util import TimeContext
from indoorsdatapy.server_utils.cloud_entity import RECORDINGS
from indoorsdatapy.server_utils.cloud_env import *

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Default settings
SETTINGS = {
    "dump": [
        "acc",
        "mag",
        "gyro",
        "kalman_positions",
        "final_positions"
    ]
}


def make_parser():
    """
    Return
    ------
    ArgumentParser
    """
    parser = ArgumentParser(
        description=main.__doc__,
        epilog="(c) indoo.rs GmbH")

    parser.add_argument(
        '-e', "--environment",
        required=True,
        action='store',
        choices=[DEV, TEST, PROD],
        help='Cloud envtironment')

    parser.add_argument(
        "-n", '--no_cache', action='store_true',
        help="Force download - no use cache")

    parser.add_argument(
        "-F", action='store_true',
        help="Overwrite output file if exists", )

    parser.add_argument(
        "-r", "--recording_ids", metavar="IDs", type=int, nargs="+",
        help="id(s) of recordings to use", required=True)
    parser.add_argument(
        "-R", "--recording_dtos", metavar="DTOs", type=str,
        nargs="+", help="dto(s) of recordings to use")
    parser.add_argument(
        "-s", "--settings", metavar="SETTINGS_JSON", type=str,
        help="Settings (json string)", default=None)
    parser.add_argument(
        "-u", "--recording_db_url", metavar="RECORDING_DB_URL", type=str,
        help="url to recording db", required=True)
    parser.add_argument(
        "-f", "--format", choices=("csv", "pkl", "json"),
        default="csv", help="file format for table output")
    parser.add_argument(
        "-d", "--dump", action="store_true",
        help="If set table will be printed to terminal")
    parser.add_argument(
        "-o", "--output", metavar="OUTPUT_FILE", type=str, default=None,
        help="Name of output file (format will be appended if not included)")
    return parser


def parse_args(parser, argv):
    """Parse arguments

    Parameters
    ----------
    parser : ArgumentParser
        from make_parser

    argv : list
        Argument vector

    Raises
    ------
    ValueError
        If there is no valid output or input

    Return
    ------
    parsed: namespace
    settings: dict
    """
    parsed = parser.parse_args(argv)
    # Check oparse_argsutput settings
    if not parsed.dump and parsed.output is None:
        logger.error("To get output, use at least one of -o or -d")
        parser.print_help()
        raise ValueError("No output")

    # Check recordings
    if (len(parsed.recording_ids) if parsed.recording_ids else 0) + \
            (len(parsed.recording_dtos) if parsed.recording_dtos else 0) == 0:
        logger.error("To get output, use at least one recording")
        parser.print_help()
        raise ValueError("No input")

    settings = deepcopy(SETTINGS)
    settings.update(loads(str(parsed.settings)) if parsed.settings else {})
    return parsed, settings


def main(argv):
    """Main function"""
    parsed, settings = parse_args(make_parser(), argv[1:])

    # Check and load recordings
    # TODO TEST PROTO
    with TimeContext("Load recordings"):
        recordings = access_loader(
            entity=RECORDINGS,
            env=parsed.environment,
            idents=parsed.recording_ids,
            force=parsed.no_cache,
            local_paths=parsed.recording_dtos)

    # Loop over all recordings
    with TimeContext("Loop over all recordings"):
        for irec, (recording_id, recording) in enumerate(recordings.items()):
            with TimeContext("Process recording {} ({}/{})".format(
                    recording_id, irec + 1, len(recordings))):
                for col in settings["dump"]:
                    save_df(getattr(recording, col), "{}_{}".format(
                        recording_id, col), parsed.format)


if __name__ == "__main__":
    import sys

    with TimeContext("recording summary"):
        main(sys.argv)
