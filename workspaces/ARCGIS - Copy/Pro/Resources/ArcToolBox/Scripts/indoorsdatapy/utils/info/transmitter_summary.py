#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Prints transmitter statistics

NOTE: Supports multiple input buildings and multiple input recordings

Settings:
* recordingaccess - RecordingAccess settings
* buildingaccess - BuildingAccess settings

Examples:

* Dump summary for several recordings without cache

    python recording_summary.py -d -r  4157 4158 4159 4170 4171 4172 4173 -s '{"recordingaccess":{"cached":false}}'

* Save summary for one building to csv file

    python transmitter_summary.py -f csv -o 626768695 -b 626768695

---
usage: transmitter_summary.py [-h] [-r RECORDING_IDS [RECORDING_IDS ...]]
                              [-b BUILDING_IDS [BUILDING_IDS ...]] [-d]
                              [-o OUTPUT_FILE] [-f {csv,pkl,hd5,json}]
                              [-s SETTINGS_JSON]

transmitter_summary.py - Creates summary of transmitters in recordings or
buildings

optional arguments:
  -h, --help            show this help message and exit
  -r RECORDING_IDS [RECORDING_IDS ...], --recording_ids RECORDING_IDS [RECORDING_IDS ...]
                        ids of recordings to use
  -b BUILDING_IDS [BUILDING_IDS ...], --building_ids BUILDING_IDS [BUILDING_IDS ...]
                        ids of buildings to use
  -d, --dump            If set table will be printed to terminal
  -o OUTPUT_FILE, --output OUTPUT_FILE
                        Name of output file (format will be appended if not
                        included)
  -f {csv,pkl,hd5,json}, --format {csv,pkl,hd5,json}
                        file format for table output
  -s SETTINGS_JSON, --settings SETTINGS_JSON
                        Settings (json string)

(c) indoo.rs GmbH
"""
from argparse import ArgumentParser
from copy import deepcopy
from json import loads
from logging import getLogger, basicConfig, INFO
from sys import argv

import pandas as pd
from indoorsdatapy.access.provider.load_access import access_loader
from indoorsdatapy.common.configurable import dict_update
from indoorsdatapy.common.pd_utils import save_df
from indoorsdatapy.common.time_util import TimeContext
from indoorsdatapy.server_utils.cloud_entity import BUILDINGS, RECORDINGS
from indoorsdatapy.server_utils.cloud_env import *

basicConfig(level=INFO)
logger = getLogger(__name__)

SETTINGS = {}


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
        "-s", "--settings", metavar="SETTINGS_JSON", type=str,
        help="Settings (json string)", default=None)

    output = parser.add_argument_group('Output')
    output.add_argument(
        "-d", "--dump", action="store_true",
        help="If set table will be printed to terminal")
    output.add_argument(
        "-o", "--output", metavar="OUTPUT_FILE", type=str, default=None,
        help="Name of output file (format will be appended if not included)")
    output.add_argument(
        "-f", "--format", choices=("csv", "pkl", "json"),
        default="csv", help="file format for table output")

    recordings = parser.add_argument_group('Recordings')
    recordings.add_argument(
        "-r", "--recording_ids", metavar="IDs", type=int, nargs="+",
        help="id(s) of recordings to use")
    recordings.add_argument(
        "-R", "--recording_dtos", metavar="DTOs", type=str,
        nargs="+", help="dto(s) of recordings to use")
    recordings.add_argument(
        "-u", "--recording_db_url", metavar="RECORDING_DB_URL", type=str,
        help="url to recording db")

    building = parser.add_argument_group('Building')
    building.add_argument(
        "-b", "--building_id", metavar="building_id", type=int,
        help="id of building to draw")
    building.add_argument(
        "-B", "--building_dto", metavar="DTO", type=str,
        help="dto of building to draw")
    building.add_argument(
        "-a", "--building_api_url", metavar="URL", type=str,
        default="https://api.indoo.rs/indoors/rest",
        help="URL to indoo.rs building REST api (give if using building)")
    building.add_argument(
        "-k", "--api_key", metavar="api_key", type=str,
        help="api key for accessing building data (give if using building)")

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
        parser.error("To get output, use at least one of -o or -d")

    if parsed.building_dto and parsed.building_id:
        parser.error("Can only accept one building input")

    building_inputs = 1 if parsed.building_dto else 0
    building_inputs += 1 if parsed.building_id else 0
    parsed.do_buildings = building_inputs > 0
    if parsed.do_buildings:
        if parsed.api_key is None or parsed.building_api_url is None:
            parser.error("No API key or URL")

    recording_inputs = len(parsed.recording_ids) if parsed.recording_ids else 0
    recording_inputs += len(parsed.recording_dtos) if parsed.recording_dtos else 0
    parsed.do_recordings = recording_inputs > 0

    inputs = building_inputs + recording_inputs

    # Check recordings
    if inputs == 0:
        parser.error("To get output, use at least one input")

    if parsed.settings:
        settings = dict_update(SETTINGS, loads(str(parsed.settings)))
    else:
        settings = deepcopy(SETTINGS)

    return parsed, settings


def main():
    parser = make_parser()
    parsed, settings = parse_args(parser, argv[1:])

    stats = []
    if parsed.do_buildings:
        with TimeContext("Process building"):
            try:
                building = access_loader(
                    entity=BUILDINGS,
                    env=parsed.environment,
                    idents=parsed.building_id,
                    force=parsed.no_cache,
                    local_paths=parsed.building_dto)
            except ValueError:
                parser.print_help()
                logger.exception("Failed to load building")
                raise
            for istat, stat in building.statistics.iterrows():
                stats.append((
                    stat.transmitter_id,
                    stat.mean_rssi,
                    stat.std_rssi,
                    stat.transmitter_occ))

    # Check and load recordings
    if parsed.do_recordings:
        with TimeContext("Load recordings"):
            recordings = access_loader(
                entity=RECORDINGS,
                env=parsed.environment,
                idents=parsed.recording_ids,
                force=parsed.no_cache,
                local_paths=parsed.recording_dtos)
            for recording_id, recording in recordings.items():
                for iradio, radio in recording.radio.iterrows():
                    stats.append((
                        radio.transmitter_id, radio.rssi, None, 1))

    stats = pd.DataFrame(
        stats, columns=["transmitter_id", "rssi", "std_rssi", "amount"])

    if len(stats) == 0:
        print("No transmitter statistic collected for the given input")
        return

    grouped_stats = []
    for group, tx_stat in stats.groupby("transmitter_id"):
        stat = tx_stat.describe()
        # print(stat.mean)
        tx_amount, tx_mean, tx_std, tx_min, tx_max, tx_50 = \
            tx_stat["rssi"].describe().loc[
                ["count", "mean", "std", "min", "max", "50%"]].values
        grouped_stats.append(
            (group, tx_amount, tx_mean, tx_std, tx_min, tx_max, tx_50))

    df = pd.DataFrame(
        grouped_stats, columns=[
            "transmitter_id", "count", "mean", "std", "min", "max", "50%"])
    df["range"] = df["max"] - df["min"]

    # File output
    if parsed.output is not None:
        # Set output file name
        output = parsed.output
        if parsed.format not in output:
            output += ".{}".format(parsed.format)
        save_df(df, output, parsed.format)

    if parsed.dump:
        print("Statistic for each transmitter")
        pd.options.display.max_colwidth = 200
        print(df.to_string(index=False))
        print("------")
        stat = df.describe()
        print("Total RSSI statistic:\nmean: {} min: {} max: {}".format(
            stat.loc["mean"]["mean"], stat.loc["min"]["min"],
            stat.loc["max"]["max"]))
        print("------")
        print("Transmitters with few counts:")
        print(df[["transmitter_id", "count"]][df["count"] <= 3].sort_values(
            by="count").to_string(index=False))
        print("------")
        print("10 weakest transmitters (by mean RSSI):")
        print(df[["transmitter_id", "mean"]].sort_values(
            by="mean").head(10).to_string(index=False))
        print("------")
        print("10 transmitters with lowest RSSI span (by RSSI_max-RSSI_min)")
        print(df[["transmitter_id", "range", "count"]].sort_values(
            by="range").head(10).to_string(index=False))
        print("------")
        df["uuid"] = df["transmitter_id"].str.split(".").apply(lambda x: x[0])
        print("UUID group summaries")
        print("UUID\t\t\t\t\tn\tcounts\t<rssi>\t<range>\t[min, max]")
        for group, dat in df.groupby("uuid"):
            print("{}\t{}\t{:.0f}\t{:.1f}\t{:.1f}\t[{:.1f}, {:.1f}]".format(
                group, len(dat), dat["count"].sum(), dat["mean"].mean(),
                dat["range"].mean(), dat["min"].min(), dat["max"].max()))


if __name__ == '__main__':
    main()
