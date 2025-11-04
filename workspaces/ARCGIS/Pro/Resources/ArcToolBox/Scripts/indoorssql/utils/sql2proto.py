#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
usage: sql2proto [-h] [-r recording_id | -b building_id] db_url

Create proto buffer using SQL statements.

positional arguments:
  db_url                database url to fetch data from

optional arguments:
  -h, --help            show this help message and exit
  -r recording_id, --recording_id recording_id
                        identifier of the recording to fetch
  -b building_id, --building_id building_id
                        identifier of the building to fetch
"""
import concurrent.futures
import multiprocessing
import os
import sys
from argparse import ArgumentParser
from logging import basicConfig, getLogger, DEBUG
from sys import stdout

from indoorssql.core.sql2proto_core import (RecordingExporter, BuildingExporter,
                                            ExportError)

logger = getLogger(__name__)


def export_recording(id, db_url, output):
    exporter = RecordingExporter(db_url)
    exporter.export(id)

    if exporter.validate():
        if output:
            path = os.path.join(output, str(id) + '.pb')
            with open(path, 'wb') as out:
                exporter.save(out)
            return path
        else:
            exporter.save(stdout)
        logger.debug('Recording_id: %s has been exported' % id)
    else:
        logger.error("sdfdsf")
        raise ExportError("Exported recording is not valid")

    logger.info("Done: " + str(id))


def export_building(db_url, building_id, output):
    exporter = BuildingExporter(db_url, building_id)
    exporter.export()
    prot = exporter.get_proto()
    if prot.IsInitialized():
        if output:
            with open(os.path.join(output,
                                   str(building_id) + '.pb'), 'wb') as out:
                exporter.save(out)
        else:
            exporter.save(stdout)
    else:
        raise ExportError("Exported building is not valid")


def main():
    """Create data transfer object using SQL statements."""
    parser = ArgumentParser(
        description="Create proto buffer using SQL statements.")
    parser.add_argument("db_url", help="database url to fetch data from")
    group = parser.add_mutually_exclusive_group(required=False)
    group.add_argument("-r",
                       "--recording_id",
                       metavar="recording_id",
                       type=int,
                       nargs="+",
                       help="identifier of the recording(s) to fetch")
    group.add_argument(
        "-b",
        "--building_id",
        metavar="building_id",
        help="identifier (unique, first, original one) of the building to fetch"
    )
    parser.add_argument("-o",
                        "--output",
                        metavar="OUTPUT_DIR",
                        help="Name of output directory")
    args = parser.parse_args()

    basicConfig(level=DEBUG)

    if args.output:
        if not os.path.isdir(args.output):
            os.mkdir(args.output)

    if args.building_id:
        try:
            export_building(args.db_url, args.building_id, args.output)
        except ExportError as e:
            logger.error(str(e))
            sys.exit(1)
    elif args.recording_id:
        futures = {}
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=multiprocessing.cpu_count()) as executor:
            for _id in args.recording_id:
                future = executor.submit(export_recording, _id, args.db_url,
                                         args.output)
                futures[_id] = future

        failed = False
        for _id in futures:
            future = futures[_id]
            e = future.exception()
            if e is not None:
                failed = True
                logger.error("Could not export recording %d: %s", _id, e)

        if failed:
            sys.exit(1)


if __name__ == "__main__":
    main()
