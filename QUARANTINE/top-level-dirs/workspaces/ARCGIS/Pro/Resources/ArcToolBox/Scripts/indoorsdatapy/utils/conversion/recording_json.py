#!/usr/bin/env python
# # -*- coding: utf-8 -*-

"""
Recording protobuffer to json converter
usage: recording_json.py [-h] -R DTOS [DTOS ...] [--verbose] [--quiet]
                         [--overwrite]

__main__- Description

optional arguments:
  -h, --help            show this help message and exit
  -R DTOS [DTOS ...], --recording_dtos DTOS [DTOS ...]
                        Path of recordings dto(s)
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH

"""

import json
from logging import getLogger

from google.protobuf.json_format import MessageToJson
from indoorsdatapy.common.cli import custom_parser, recording_dtos
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsprotocol.recordings_pb2 import Recording

logger = getLogger(__name__)


def recording_to_json(input_pb, output_json):
    """Convert input_pb protobuffer to output_json json

    Parameters
    ----------
    input_pb : str
        input protobuffer filename
    output_json : str
        putput json filename
    """
    logger.info("Converting protp {} to json {}".format(input_pb, output_json))
    pb = Recording()
    with open(input_pb) as infile:
        pb.ParseFromString(infile.read())
    data = json.loads(MessageToJson(pb, preserving_proto_field_name=True))
    with open(output_json, 'w') as outfile:
        json.dump(data, outfile)
        logger.info("Recording saved to < %s > " % output_json)


def main():
    args = [(recording_dtos, {'required': True})]
    parser = custom_parser(
        args, description="{} - Recording protocolbuffer "
                          "to json conversion ".format(__name__))
    parsed = parser.parse_args()

    cli_logger(parsed.verbose, parsed.quiet)

    logger.info("Converting %s protocolbuffers" % (len(parsed.recording_dtos)))

    for input_pb in parsed.recording_dtos:
        recording_to_json(input_pb, input_pb.replace(".pb", ".json"))


if __name__ == "__main__":
    main()
