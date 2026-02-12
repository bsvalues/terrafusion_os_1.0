#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""

usage: helmert_key_recording.py [-h] [-e EPSG] -x TRANSLATION_X -y
                                TRANSLATION_Y -s SCALE -r ROTATION -R DTO -o
                                DTO

Transform points using Helmert transformation

optional arguments:
  -h, --help            show this help message and exit
  -e EPSG, --epsg EPSG
  -x TRANSLATION_X, --translation_x TRANSLATION_X
  -y TRANSLATION_Y, --translation_y TRANSLATION_Y
  -s SCALE, --scale SCALE
  -r ROTATION, --rotation ROTATION
  -R DTO                recording dto
  -o DTO, --output_file DTO


"""
import argparse
import logging

import pandas as pd
from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.algorithms.transformations import HelmertHelper

logger = logging.getLogger(__name__)
logging.basicConfig()
logger.setLevel(logging.DEBUG)


def main():
    parser = argparse.ArgumentParser(
        description='Transform points using Helmert transformation')

    parser.add_argument(
        '-e', '--epsg',
        default=None,
        type=str)

    parser.add_argument(
        '-x', '--translation_x',
        required=True,
        type=str)

    parser.add_argument(
        '-y', '--translation_y',
        required=True,
        type=str)

    parser.add_argument(
        '-s', '--scale',
        required=True,
        type=str)

    parser.add_argument(
        '-r', '--rotation'
        , required=True,
        type=str)

    parser.add_argument(
        "-R",
        metavar="DTO",
        required=True,
        help='recording dto',
        type=str)

    parser.add_argument(
        "-o", "--output_file",
        metavar="DTO",
        required=True,
        type=str)

    parsed = parser.parse_args()

    access = RecordingAccess(parsed.recording_dto)
    rec1_pos = access['positions']

    geoloc = HelmertHelper.similarity_transform_positions2(
        rec1_pos[['x', 'y']].values,
        parsed.translation_x,
        parsed.translation_y,
        parsed.scale,
        parsed.rotation)

    df_geoloc = pd.DataFrame(geoloc, columns=['x', 'y'])
    df_geoloc['epsg'] = parsed.epsg

    access.update_pb({'positions': df_geoloc}, parsed.output_file)


if __name__ == "__main__":
    main()
