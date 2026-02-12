from logging import getLogger

import pandas as pd
from indoorsdatapy.access.factory.df2pb import dfs2pb
from indoorsdatapy.access.factory.pb2df import pb2dfs
from indoorsdatapy.access.factory.utils import load_pb
from indoorsdatapy.access.factory.utils import save
from indoorsdatapy.access.utilities import (estimates_with_positions_maker,
                                            get_metadata, transmitters_ids)
from indoorsprotocol.slams_pb2 import SlamTrajectory

logger = getLogger(__name__)


def load_slam_trajectory(f):
    """
    Direct conversion from pb (should be fast)
    :param f:
    :return:
    """
    pb = f
    estimates = pd.DataFrame.from_dict(
        dict(
            t=location.position.t,
            x=location.position.x,
            y=location.position.y,
            position=i,
            floor=location.position.floor,
            mean=estimate.mean,
            var=estimate.var,
            sxy=location.position.sxy,
            weight=estimate.weight,
            transmitter=estimate.transmitter,
        )
        for i, location in enumerate(pb.locations)
        for estimate in location.estimates
    )
    tr = pb2dfs(pb, ['transmitters'])
    return dict(transmitters=tr.get('transmitters', pd.DataFrame()),
                building=pb.building,
                recordings=pb.recording,
                steps=pb2dfs(pb, ['steps']),
                estimates=pd.merge(transmitters_ids(tr.get('transmitters', pd.DataFrame())),
                                   estimates, left_index=True,
                                   right_on='transmitter'))


def load_slam_trajectory_positions(f):
    """
    Direct conversion from pb (should be fast)
    :param f: io
        open file of pb slam trajectory
    :return: dict(df)
        data frames of consists of data of pb slam trajectory
    """
    pb = load_pb(SlamTrajectory, f)
    pos = pd.DataFrame.from_dict(
        dict(
            t=location.position.t,
            x=location.position.x,
            y=location.position.y,
            floor=location.position.floor,
            accuracy=location.position.accuracy,
            type=location.position.type,
        )
        for i, location in enumerate(pb.locations)
    )
    return dict(building=pb.building,
                recordings=pb.recording,
                positions=pos)


def iterate_slam_trajectories_positions(dtos, yield_id=False):
    """
    Generator of slam trajectories frames
    :param dtos: list
        list of path to pb
    :param yield_id: bool
        if true than yield also path
    :yield tuple
    """
    for dto in dtos:
        logger.info("Loading slam_trajectory positions: %s" % dto)
        if yield_id:
            yield dto, load_slam_trajectory_positions(open(dto, 'rb'))
        else:
            yield load_slam_trajectory_positions(open(dto, 'rb'))


def iterate_slam_trajectories(dtos, yield_id=False):
    """
    
    :param dtos: 
    :param yield_id: 
    :return: 
    """
    for dto in dtos:
        logger.info("Loading slam_trajectory %s" % dto)
        if yield_id:
            yield dto, load_slam_trajectory(open(dto, 'rb'))
        else:
            yield load_slam_trajectory(open(dto, 'rb'))


def save_slam_trajectory(frames):
    """
    Convert collection of frames to pb object
    to save call SerializeToString()
    to validate use IsInitialized()
    Parameters
    ----------
    frames - dict of frames: dict{property:panda data frame}
             naming of keys accordingly to building pb definition

    Returns
    -------
    initialized proto object

    """
    return dfs2pb(frames, SlamTrajectory())


def save_slam_trajectory_file(frames, out):
    save(save_slam_trajectory(frames), out)


def serialize_slam_trajectory(building, recording,
                              transmitters, locations, estimates, steps,
                              metadata):
    """
    Serialization of dataframes to pb object.
    This has to be done because there is no KEY between locations and estimates,
     so we cannot use automated conversion

    Parameters
    ----------
    slam_map_type: int
        type of slam map
    building: int
        building id
    recording: int
        identifier of unique rec
    transmitters: pd.DataFrame
    locations: pd.DataFrame
    estimates: pd.DataFrame
    metadata: dict
        kay val based metadata

    Returns
    -------
    initialized pb object Slam
    """

    pb = SlamTrajectory()

    pb.building = int(building)
    pb.recording = recording

    for i, row in locations.iterrows():
        location = pb.locations.add()
        location.position.t = row['time']
        location.position.x = row['x']
        location.position.y = row['y']
        location.position.floor = int(row['floor'])
        if 'sxy' in row:
            location.position.sxy = row['sxy']
        if 'sx2' in row:
            location.position.sx2 = row['sx2']
        if 'sy2' in row:
            location.position.sy2 = row['sy2']
        if 'accuracy' in row:
            location.position.accuracy = row['accuracy']
        if 'delay' in row:
            location.position.delay = row['delay']

        location.position.type = int(row['type'])

    for position, df in estimates.sort_values('position').groupby("position"):
        location = pb.locations[int(position)]
        for i, row in df.iterrows():
            estimate = location.estimates.add()
            estimate.transmitter = int(row['transmitter'])
            estimate.var = row['var']
            estimate.mean = row['mean']
            if 'weight' in row:
                estimate.weight = row['weight']

    for i, row in transmitters.iterrows():
        transmitter = pb.transmitters.add()
        transmitter.bssid = int(row.bssid)
        transmitter.ssid = row.ssid
        transmitter.type = row.type

    for i, row in steps.iterrows():
        steps = pb.steps.add()
        steps.t = row['t']
        steps.length = row['length']
        steps.var_length = row['var_length']
        steps.heading = row['heading']
        steps.var_heading = row['var_heading']
        steps.max_acc = row['var_heading']

    for name, value in metadata.items():
        meta = pb.meta.add()
        meta.name, meta.value = str(name), str(value)

    return pb


def locations_with_estimates(slam_trajectory_access):
    return estimates_with_positions_maker(slam_trajectory_access)


def get_metadata_value(recording_access, key):
    return get_metadata(recording_access['meta'], key)


def load_trajectory(trajectory):
    """load estimates from file

    Parameters
    ----------
    trajectory: SlamTrajectory
        trajectory object

    Returns
    -------
    pd.DataFrame or None
        estimates
    """
    # logger.debug("Opening trajectory {}".format(trajectory))
    return load_slam_trajectory(f=trajectory)


def loop_trajectories(trajectories, use_files=True):
    """Summary

    Parameters
    ----------
    trajectories : str, access
        filenames or access objects
    use_files : bool, optional
        If true load files, else assume access objects in input

    Yields
    ------
    pd.DataFrame
        estimates
    """
    for trajectory in trajectories:
        yield load_trajectory(trajectory) if use_files else trajectory
