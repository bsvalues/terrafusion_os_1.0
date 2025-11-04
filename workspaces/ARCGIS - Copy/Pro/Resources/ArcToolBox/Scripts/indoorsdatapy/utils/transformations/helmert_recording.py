#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""usage: helmert_recording.py [-h] -o ORIGIN -d DESTINATION [-R DTOS [DTOS ...]]
                            [-r PATH]

Transform points using Helmert transformation

optional arguments:
  -h, --help            show this help message and exit
  -o ORIGIN, --origin ORIGIN
                        geojson: set of coordinates of origin points
  -d DESTINATION, --destination DESTINATION
                        geojson: set of coordinates of destination points
  -R DTOS [DTOS ...], --recording_dtos DTOS [DTOS ...]
                        recording protocolbuffers
  -r PATH, --output_dir PATH
"""
import argparse
import logging
import os

from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.algorithms.transformations import HelmertHelper
from indoorsdatapy.tools.transformation import get_coefs

logger = logging.getLogger(__name__)
logging.basicConfig()
logger.setLevel(logging.DEBUG)


def main():
    parser = argparse.ArgumentParser(
        description='Transform points using Helmert transformation')

    parser.add_argument(
        '-o', '--origin',
        default=None,
        required=True,
        help='geojson: set of coordinates of origin points',
        type=str)

    parser.add_argument(
        '-d', '--destination',
        required=True,
        help='geojson: set of coordinates of destination points',
        type=str)

    parser.add_argument(
        "-R", '--recording_dtos', metavar="DTOS",
        help='recording protocolbuffers', nargs='+', type=str)

    parser.add_argument(
        "-r", "--output_dir", metavar="PATH", type=str)

    parsed = parser.parse_args()

    if not os.path.isdir(parsed.output_dir):
        os.makedirs(parsed.output_dir)

    coefs, out_path_report = get_coefs(parsed.origin, parsed.destination, (0, 0),
                                       parsed.output_dir)

    if parsed.recording_dtos:
        for rec in parsed.recording_dtos:
            df_rec = RecordingAccess(rec)
            pos = df_rec['positions']
            r = HelmertHelper.similarity_transform(
                pos[['x', 'y']].values, coefs)
            pos['x'] = r[:, 0]
            pos['y'] = r[:, 1]
            out_path = os.path.join(parsed.output_dir, os.path.basename(rec))
            logger.info('saving transformed recording to %s' % out_path)
            df_rec.update_pb({'positions': pos}, out_path)

    with open(out_path_report, 'r') as rd:
        logger.info('Report:' + ''.join(rd.readlines()))


if __name__ == "__main__":
    main()
