#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Validate recording suitability for slam. It uses building for validation
usage: slam_recording_combo_checker.py [-h] -R DTO -B DTO [-o OUTPUT_FILE]
                                       [--verbose] [--quiet] [--overwrite]
                                       [--type {initial,update}] [-b]

Validate recording on the top of building

optional arguments:
  -h, --help            show this help message and exit
  -R DTO, --recording_dto DTO
                        Path of recordings dto
  -B DTO, --building_dto DTO
                        path of building dto
  -o OUTPUT_FILE, --output_file OUTPUT_FILE
                        Output file destination
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists
  --type {initial,update}
                        Type of checker
  -b, --bail            Stop checker if some check failed

(c) indoo.rs GmbH

"""
import json
from sys import stdout, exit

from indoorsdatapy.access.building import BuildingAccess
from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.common.cli import (recording_dto, custom_parser, output_file,
                                      building_dto)
from indoorsdatapy.tools.validation.validators_interface import (
    SLAMInitialRecordingBuildingChecker,
    SLAMUpdateRecordingBuildingChecker)


def main():
    args = [(recording_dto, {'required': True}),
            (building_dto, {'required': True}),
            (output_file, {'required': False})]
    parser = custom_parser(
        args, description="Validate recording on the top of building")
    parser.add_argument('--type', default='initial',
                        help="Type of checker",
                        choices=('initial', 'update'))
    parser.add_argument("-b", "--bail",
                        help="Stop checker if some check failed",
                        action='store_true')
    parsed = parser.parse_args()

    if parsed.type == 'initial':
        recording = RecordingAccess(parsed.recording_dto, ['positions'])
        building = BuildingAccess(parsed.building_dto,
                                  ['zones', 'zone_points', 'floors', 'walls',
                                   'edge_points'])
        slam_validator = SLAMInitialRecordingBuildingChecker(
            recording, building, parsed.bail)

    if parsed.type == 'update':
        building = BuildingAccess(parsed.building_dto,
                                  ['zones', 'zone_points',
                                   'floors', 'walls', 'edge_points',
                                   'networks'])
        recording = RecordingAccess(parsed.recording_dto, ['positions', 'radios'])
        slam_validator = SLAMUpdateRecordingBuildingChecker(
            recording, building, parsed.bail)
    valid = slam_validator()

    result = {'check.%s.valid' % parsed.type: valid}
    for key, val in slam_validator.result.items():
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
