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

import numpy as np
import pandas as pd
from indoorsdatapy.access.provider.load_access import access_loader
from indoorsdatapy.common.time_util import TimeContext
from indoorsdatapy.server_utils.cloud_entity import *
from indoorsdatapy.server_utils.cloud_env import *

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Default settings
SETTINGS = {
    "do_meta": True,
    "meta": [
        "building_id",
        "start_time",
        "creation_date",
        "duration",
        "device",
        "user_name",
        "metadata"],
    "do_counts": True,
    "counts": [
        "n_accelerations",
        "n_contexts",
        "n_global_positions",
        "n_magnetic_data",
        "n_pressures",
        "n_gyro_data",
        "n_radio_data",
        "n_rotation_data",
        "n_steps",
        "n_ground_truth",
        "n_knn_position",
        "n_final_position",
        "n_kalman_position",
    ],
    "do_rate": True,
    "rate": [
        "acc",
        "mag",
        "gyro",
        "kalman_positions",
        "final_positions",
    ],
    "do_dups": True,
    "dups": [
        "acc",
        "mag",
        "gyro",
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
        "-r", "--recording_ids", metavar="IDs", type=int, nargs="+",
        help="id(s) of recordings to use", required=True)
    parser.add_argument(
        "-R", "--recording_dtos", metavar="DTOs", type=str,
        nargs="+", help="dto(s) of recordings to use", default=None)
    parser.add_argument(
        "-s", "--settings", metavar="SETTINGS_JSON", type=str,
        help="Settings (json string)", default=None)
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


def check_dups(tag, dataframe):
    """Summary

    Note only good for acc, gyro and mag

    Calculates
    * ndf - number of entries in data frame total
    * dt0 - number of 0 delta times
    * xyz0 - number of 0 delta in x y and z
    * txyz0 - number of 0 delta in x y z and t

    Parameters
    ----------
    tag : string
        tag for dict key prefixes
    dataframe : DataFrame
        data to examine

    Returns
    -------
    dict
        dictionary with ndf, dt0, dxyz0 and dtxyz0 for dataframe
    """
    dfdiff = dataframe.diff()
    dt0 = dfdiff["recording_date"] < 1E-8
    xyz0 = (dfdiff["x"] < 1E-8) & (dfdiff["y"] < 1E-8) & (dfdiff["z"] < 1E-8)
    txyz0 = dt0 & xyz0
    return {
        "{}_ndf".format(tag): len(dataframe.index),
        "{}_dt0".format(tag): sum(dt0),
        "{}_dxyz0".format(tag): sum(xyz0),
        "{}_dtxyz0".format(tag): sum(txyz0)}


def check_dt(tag, dataframe, tcol="recording_date"):
    """Check time between samples

    Calculates:
    * dt_mean - average time between samples (0 included)
    * dtf_mean - average time between samples (0 omitted)
    * fdt - fraction of samples with 0 time inbetween

    Parameters
    ----------
    tag : string
        tag for dict key prefixes
    dataframe : DataFrame
        data to examine
    tcol : str, optional
        Time column (default: recording_date)

    Returns
    -------
    dict
        dictionary with dt_mean, dtf_mean, fdt0 for dataframe
    """
    count = len(dataframe.index)
    if count <= 2:
        return {}
    dataframe = dataframe.sort_values(by=tcol)
    deltat = dataframe[tcol].diff()
    gdt = np.diff(np.sort(dataframe[tcol].unique()))
    fdt = gdt.shape[0] * 1. / count
    return {
        "{}_dt".format(tag): deltat.mean(),
        "{}_gdt".format(tag): gdt.mean(),
        "{}_fdt".format(tag): fdt}


def check_info(recording, columns):
    """Get selected columns from recording info"""
    return {
        k: v for k, v in recording.info.items()
        if k in columns}


def save_df(dataframe, filename, fmt):
    """Summary

    Parameters
    ----------
    dataframe : DataFrame
        data to save
    filename : str
        name of file to save
    fmt : str
        File format for table output csv, json or pkl
    """
    # Set output file name
    output = filename
    if fmt not in output:
        output += ".{}".format(fmt)
    logger.info("Saving {} file {}".format(fmt, output))

    # Save to appropriate format
    if "csv" in fmt:
        dataframe.to_csv(
            output, index=False, header=True, sep=",", encoding='utf-8')
    elif "json" in fmt:
        dataframe.to_json(output)
    elif "pkl":
        dataframe.to_pickle(output)
    else:
        raise ValueError("Unkown file format {}".format(fmt))


def main(argv):
    """Main function"""
    parsed, settings = parse_args(make_parser(), argv[1:])

    # Check and load recordings
    # TODO TEST PROTO
    recordings = access_loader(
        entity=RECORDINGS,
        env=parsed.environment,
        idents=parsed.recording_ids,
        force=parsed.no_cache,
        local_paths=parsed.recording_dtos)

    info_columns = ["id"]
    if settings["do_meta"]:
        info_columns.extend(settings["meta"])
    if settings["do_counts"]:
        info_columns.extend(settings["counts"])

    # Loop over all recordings
    with TimeContext("Loop over all recordings"):
        recs = []
        for irec, (recording_id, recording) in enumerate(recordings.items()):
            with TimeContext("Process recording {} ({}/{})".format(
                    recording_id, irec + 1, len(recordings))):
                summary = check_info(recording, info_columns)
                if settings["do_rate"]:
                    for col in settings["rate"]:
                        summary.update(check_dt(col, getattr(recording, col)))
                if settings["do_dups"]:
                    for col in settings["dups"]:
                        summary.update(check_dups(
                            col, getattr(recording, col)))

                recs.append(summary)
    dataframe = pd.DataFrame.from_dict(recs)

    if parsed.output is not None:
        save_df(dataframe, parsed.output, parsed.format)

    if parsed.dump:
        print(dataframe.to_string(index=False))


if __name__ == "__main__":
    import sys

    with TimeContext("recording summary"):
        main(sys.argv)
