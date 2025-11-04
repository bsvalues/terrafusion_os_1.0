"""
Script for splitting recording protocol buffer by ground truths
usage: gt_slicer.py [-h] -R DTO -d OUTPUT_DIR [--verbose] [--quiet]
                    [--overwrite]

__main__- Ground truth slicer

optional arguments:
  -h, --help            show this help message and exit
  -R DTO, --recording_dto DTO
                        Path of recordings dto
  -d OUTPUT_DIR, --output_dir OUTPUT_DIR
                        Output dir destination
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH
"""
import os
from logging import getLogger

from indoorsdatapy.access.manipulation.slicer import SliceAccess
from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.common.cli import custom_parser, output_dir, recording_dto
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.common.utils import build_path
from indoorsprotocol.positions_pb2 import PositionType

logger = getLogger(__name__)


def gt_slicer(access):
    gts = access.positions_with_type(PositionType.Value("GROUND_TRUTH"))
    logger.info("number of ground truths %s" % len(gts))
    for idx in range(1, len(gts)):
        yield SliceAccess(access, gts['t'].iloc[idx - 1], gts['t'].iloc[idx])


def main():
    args = [(recording_dto, {'required': True}),
            (output_dir, {'required': True})]

    parser = custom_parser(
        args, description="{}- Ground truth slicer ".format(__name__))
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)
    access = RecordingAccess(parsed.recording_dto)

    if not os.path.isdir(parsed.output_dir):
        os.mkdir(parsed.output_dir)

    for seg_n, segment in enumerate(gt_slicer(access)):
        seg_n += 1
        out_path = build_path(parsed.output_dir,
                              name="%s_seg_%s" % (os.path.basename(
                                  os.path.splitext(
                                      parsed.recording_dto)[0]), seg_n),
                              extension='.pb')

        with open(out_path, 'wb') as pb_out:
            logger.info('Saving segment n. < %s >  < %s > < %s >' % (
                seg_n, segment['start'], segment['end']))
            access.access2file(segment, pb_out)
            logger.info('Segment n. < %s > saved to < %s >' % (seg_n, out_path))


if __name__ == '__main__':
    main()
