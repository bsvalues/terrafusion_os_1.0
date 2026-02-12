#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Join recordings of the same PHONE id. This is useful for CROWD Recordings.
usage: recording_joiner.py [-h] [-R DTOS [DTOS ...]] -d OUTPUT_DIR [--verbose]
                           [--quiet] [--overwrite]

__main__ - Recording joiner

optional arguments:
  -h, --help            show this help message and exit
  -R DTOS [DTOS ...], --recording_dtos DTOS [DTOS ...]
                        Path of recordings dto(s)
  -d OUTPUT_DIR, --output_dir OUTPUT_DIR
                        Output dir destination
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH
"""
import os
import re
import tempfile
from collections import defaultdict
from logging import getLogger
from multiprocessing import Process
from shutil import copyfile

import pandas as pd
from indoorsdatapy.access.manipulation.joiner import JoinAccess
from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.common.cli import recording_dtos, custom_parser, output_dir
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.common.time_util import timed

logger = getLogger(__name__)
from indoorsdatapy.algorithms.rayleigh import rayleigh_fit

UNIQUE_ID = 'phone_id'


@timed
def join_recording_mapper(recordings_paths, time_gap_threshold=20):
    """
    Maps recordings accordingly to phone_id. Each phone_id has Groups 0-x consisting of recordings(path) which are within time_gap_trashold of each other.
    Basically recordings of each Group are without time gaps higher than time_gap_threshold

    Parameters
    ----------
    recordings_paths: (list)
        to be mapped
    time_gap_threshold: (numeric)
        maximum allowed time interval for grouping two recordings

    Returns tuple((dict), set))
    -------
     where fist in tuple us map(to_join_map)
     where second in tuple are listed all recordings which are in map
    -----
        where to_join_map is:
        keys- phone_id (string)
        values- group (dict)
                keys: group number (int)
                values: set of recordings (set)
    """
    devices = defaultdict(list)

    # mapping phase
    for _recording in recordings_paths:
        with open(_recording, 'rb') as rb_rec:
            access = RecordingAccess(rb_rec, ['meta', 'start', 'end'])
            access['path'] = _recording
            phone_id = access['meta'][access['meta']['name'] == UNIQUE_ID][
                'value'].values
            if len(phone_id) == 1:
                phone_id = phone_id[0]
            elif len(phone_id) == 0:
                raise AttributeError(
                    'Key: < %s > is missing in metadata dataframe' % UNIQUE_ID)
            elif len(phone_id) > 1:
                logger.warning(
                    'Multiple key: < %s > are exist in metadata dataframe( %s ).'
                    ' First is used!' % (
                        UNIQUE_ID, str(phone_id)))
                phone_id = phone_id[0]
            devices[phone_id].append(access)

    to_join_map = defaultdict(lambda: defaultdict(set))
    to_join_all = set()
    for device_type, accesses in devices.items():
        sorted_recordings = sorted(accesses, key=lambda x: x['start'])
        group = 0

        end = sorted_recordings[0]['end']

        for idx in range(1, len(devices[device_type])):
            if abs(end - sorted_recordings[idx]['start']) < time_gap_threshold:
                if idx == 1:
                    to_join_map[device_type][group].add(
                        sorted_recordings[0]['path'])
                    to_join_all.add(sorted_recordings[0]['path'])

                to_join_map[device_type][group].add(
                    sorted_recordings[idx]['path'])
                to_join_all.add(sorted_recordings[idx]['path'])
                end = sorted_recordings[idx]['end']
            else:
                group += 1 if group in to_join_map[device_type] else group
                end = sorted_recordings[idx]['end']

    return to_join_map, to_join_all


def join_recording(recordings_paths, dir_path, file_name=None,
                   save_into_structure=False, device_type=None, group_id=None):
    """
    Join list of recordings and save them into dir_path.
    Parameters
    ----------
    recordings_paths: (list)
        list of paths to protobuffer files
    dir_path: (string)
        path to out dir
    file_name: (string)
        function where access is param.
    save_into_structure: (bool)
            save_into_structure: if true: than joined recordings are saved into folder by phone_id/chunk
                        Not joined recordings are copy to folder join_ne.
                        if true: than all, joined and not joined recordings will be in par: dir_path
    device_type: (string)
        is used if save_into_structure==true; It is folder where  are stored.
        e.g. /outpur_dir/samsung/
    group_id: (string)
        is used if save_into_structure==true; It is folder where chunks(group_id) are stored
        e.g. /outpur_dir/samsung/1/
    Returns
    -------
    save joined recordings into protocolbuffer

    """
    accesses = [RecordingAccess(r) for r in recordings_paths]
    access_joined = JoinAccess(accesses)
    loc, scale = rayleigh_fit(access_joined['radios']['rssi'].values)
    access_joined['meta'] = pd.concat(
        [access_joined['meta'],
         pd.DataFrame([dict(name='obs_stat_loc', value=str(loc)),
                       dict(name='obs_stat_scale', value=str(scale))])])

    if None not in [device_type, group_id] and save_into_structure:
        out_dir_ = os.path.join(dir_path, re.sub(r'\s+', '', device_type),
                                str(group_id))
    else:
        out_dir_ = dir_path

    if not os.path.isdir(out_dir_):
        try:
            os.makedirs(out_dir_)
        except IOError as e:
            logger.warning(
                'Creating folder for output: %s,'
                ' it might not be problem (concurrency)' % e)

    if not file_name:
        out_file_str = tempfile.mkstemp('.pb', 'joined_rec', dir_path)[1]
    else:
        out_file_str = os.path.join(out_dir_, file_name)

    with open(out_file_str, 'wb') as out_access:
        ra = RecordingAccess()
        ra.access2file(access_joined, out_access)
        logger.info('Joined recording saved to < %s >' % out_file_str)


@timed
def join_recording_parallel(join_recording_map, dir_path,
                            save_into_structure=False):
    """
    Mapped recordings join in parallel
    Parameters
    ----------
    join_recording_map: see what return join_recording_mapper()
    dir_path: path to directory output
    save_into_structure: if true: than joined recordings are saved into folder by phone_id/chunk
                        Not joined recordings are copy to folder join_ne.
                        if true: than all, joined and not joined recordings will be in par: dir_path

    Returns
    -------
    save joined recordings into protocolbuffer

    """

    futures = {}
    for device_type, groups in join_recording_map.items():
        for group_id, group in groups.items():
            if len(group) > 0:
                future = Process(target=join_recording,
                                 args=(group,
                                       dir_path,
                                       None,
                                       save_into_structure,
                                       device_type,
                                       group_id))
                future.start()
                futures['%s.%s' % (device_type, group_id)] = future
            else:
                logger.info('for device < %s > is no recording to be join' % (
                    device_type))

    for future in futures.values():
        future.join()


def join_recordings(recordings_paths, dir_path, allowed_time_gap=20,
                    save_into_structure=False):
    """
    It join recordings into groups by phone_id and by allowed_time_gap
    Parameters
    ----------
    recordings_paths: (list)
        list of recordings pb paths
    dir_path: (string)
        path to output dir
    allowed_time_gap: (numeric)
        maximum allowed time interval for grouping two recordings [in seconds]
    save_into_structure: (bool)
            if true: than joined recordings are saved into folder by phone_id/chunk
                        Not joined recordings are copy to folder join_ne.
                        if true: than all, joined and not joined recordings will be in par: dir_path
    Returns
    -------
    save joined recordings into protocolbuffer
    """
    join_map, join_list = join_recording_mapper(
        recordings_paths, allowed_time_gap)
    logger.info('Count of devices: < %s >' % len(join_map.keys()))
    logger.info('phone_id of devices: < %s >' % str(join_map.keys()))
    logger.debug('Join map: < %s >' % str(join_map))
    logger.info("Starting joining process in parallel")
    join_recording_parallel(join_map, dir_path,
                            save_into_structure=save_into_structure)

    # copy not joined recordings
    out_dir_ne = os.path.join(dir_path,
                              'join_ne') if save_into_structure else dir_path
    if not os.path.isdir(out_dir_ne):
        os.makedirs(out_dir_ne)
    for dto_path in (set(recordings_paths) - join_list):
        out = os.path.join(out_dir_ne, os.path.basename(dto_path))
        logger.info(
            "Copy not joined recording < %s > to < %s >" % (dto_path, out))
        copyfile(dto_path, out)


def main():
    args = [recording_dtos, output_dir]
    parser = custom_parser(args,
                           description="{} - Recording joiner".format(__name__))
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)
    join_recordings(parsed.recording_dtos, parsed.output_dir)


if __name__ == "__main__":
    main()
