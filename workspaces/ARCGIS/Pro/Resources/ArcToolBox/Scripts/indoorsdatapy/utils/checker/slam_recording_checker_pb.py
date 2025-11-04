"""
Validate recording suitability for SLAM,
Fast version without DataFrame conversion!

usage: slam_recording_checker.py [-h] -R DTOs [-o OUTPUT_FILE] [--type {initial,update}] [-b]

Recording validator

optional arguments:
-R DTOs, --recording_dto DTOs
        Path of recordings dto(s)
-o OUTPUT_FILE, --output_file OUTPUT_FILE
        Output file destination
--type {initial,update}
        Type of checker
-b, --bail
        Stop checker if some check failed
(c) indoo.rs GmbH
"""
import json
from sys import stdout, exit

from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.common.cli import recording_dto, custom_parser, output_file
from indoorsdatapy.tools.validation.validators_interface import (
    SLAM_COMMONCheckerPB, SLAM_RECORDING_INITIAL_CHECKSCheckerPB)


def main():
    args = [(recording_dto, {'required': True}),
            (output_file, {'required': False})]
    parser = custom_parser(args, description="Recording validator")
    parser.add_argument(
        '--type', default='initial', help="Type of checker",
        choices=('initial', 'update', 'simple_update'))
    parser.add_argument(
        "-b", "--bail", help="Stop checker if some check failed",
        action='store_true')

    parsed = parser.parse_args()

    access = RecordingAccess(parsed.recording_dto, ['positions'])

    slam_validator1 = SLAM_COMMONCheckerPB(access.pb, parsed.bail)
    valid = False
    if slam_validator1():
        slam_validator = SLAM_RECORDING_INITIAL_CHECKSCheckerPB(
            access, parsed.bail)
        valid = slam_validator()
        slam_validator1.result.update(slam_validator.result)
    result = {'check.%s.valid' % parsed.type: valid}
    for key, val in slam_validator1.result.items():
        result['check.%s.%s' % (parsed.type, key)] = val

    if parsed.output_file:
        with open(parsed.output_file, 'w') as f:
            json.dump(result, f)
    else:
        stdout.write(json.dumps(result))
        stdout.flush()

    exit(0 if valid else -1)


if __name__ == '__main__':
    main()
