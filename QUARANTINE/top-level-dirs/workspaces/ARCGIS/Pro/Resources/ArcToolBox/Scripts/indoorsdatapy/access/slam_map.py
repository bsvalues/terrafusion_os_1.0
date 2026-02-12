from logging import getLogger

import pandas as pd
from indoorsdatapy.access.factory.pb2df import _pb2df
from indoorsdatapy.access.factory.utils import load_pb
from indoorsdatapy.access.utilities import (estimates_with_positions_maker,
                                            transmitters_ids)
from indoorsdatapy.access.utilities import radio_by_floor as utilities_radio_by_floor
from indoorsdatapy.access.utilities import transmitters_frame
from indoorsdatapy.algorithms.hexgrid import HexCell
from indoorsdatapy.algorithms.hexgrid import build_hex_index
from indoorsprotocol.positions_pb2 import PositionType
from indoorsprotocol.slams_pb2 import SlamMap

logger = getLogger(__name__)


def load_slam_map(f):
    """
    Direct conversion from pb (should be fast)
    :param f:
    :return:
    """
    pb = load_pb(SlamMap, f)
    estimates = pd.DataFrame.from_dict(
        dict(
            t=location.position.t,
            x=location.position.x,
            y=location.position.y,
            sxy=location.position.sxy,
            position=i,
            floor=location.position.floor,
            mean=estimate.mean,
            var=estimate.var,
            weight=estimate.weight,
            transmitter=estimate.transmitter,
        )
        for i, location in enumerate(pb.locations)
        for estimate in location.estimates
    )
    metadata = {md.name: md.value for md in pb.meta}

    out = dict(
        estimates=pd.merge(
            transmitters_ids(_pb2df(pb.transmitters)),
            estimates,
            left_index=True,
            right_on='transmitter'),
        map_type=pb.type,
        building=pb.building,
        recordings=pb.recordings)

    if 'hex_side' in metadata and metadata['hex_side'] != u"None":
        out['hex_side'] = float(metadata['hex_side'])

    return out


def load_map_estimates_qr(map_file, hex_side=None):
    est = load_map_estimates(map_file)
    hex_side = hex_side or est.get('hex_side', hex_side)
    est['hex_side'] = hex_side
    est['estimates'] = build_hex_index(est['estimates'], hex_side / HexCell.SQRT3)
    return est


def load_map_estimates(map_file):
    """load estimates from pb file

    Parameters
    ----------
    map_file : str
        filename of trajectory

    Returns
    -------
    pd.DataFrame
        access_id, locations with estimates
    """
    with open(map_file, 'rb') as f:
        logger.info("Opening map {}".format(map_file))
        return load_slam_map(f)
    logger.error("Failed opening map {}".format(map_file))
    return None


def locations_with_estimates(slam_grid_access):
    return estimates_with_positions_maker(
        slam_grid_access)[['t', 'transmitter_id', 'x', 'y', 'mean',
                           'sxy', 'var', 'weight', 'floor']]


def radio_by_floor(slam_access):
    return utilities_radio_by_floor(slam_access['radios'])


def serialize_slam_map(slam_map_type, building, recordings,
                       transmitters, locations, estimates,
                       metadata):
    """
    Serialization of dataframes to pb object.
    This has to be done because there is no KEY between locations and estimates, so we cannot use automated conversion

    Parameters
    ----------
    slam_map_type: int
        type of slam map
    building: int
        building id
    recordings: iterable(int)
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

    pb = SlamMap()

    pb.type = slam_map_type
    pb.building = int(building)
    pb.recordings.extend(map(int, recordings))

    for i, row in locations.iterrows():
        location = pb.locations.add()
        if 'time' in row:
            location.position.t = row['time']
        location.position.x = row['x']
        location.position.y = row['y']
        location.position.floor = int(row['floor'])
        location.position.type = int(row['type'])
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

    for name, value in metadata.items():
        meta = pb.meta.add()
        meta.name, meta.value = str(name), str(value)

    return pb


def serialize_slam_map_helper(grid, building_id, map_type, hex_side,
                              attrs=None, recording_ids=None):
    """
    Grid df to pb
    :param grid: df[q', 'r', 'transmitter_id','x', 'y', 'floor', 'type']
    :param building_id: int
    :param map_type: str
        RADIO_MAP or GRID
    :param hex_side: number
    :param attrs: list
    :param recording_ids: list
    :return: pb
        serialized SlamMap pb object
    """

    grid.sort_values(by=attrs or ['q', 'r', 'transmitter_id'], inplace=True)
    grid.reset_index(drop=True, inplace=True)

    if map_type == 'RADIO_MAP':
        logger.info("Serializing %s" % map_type)
        grid['type'] = PositionType.Value("SLAM_MAP")
        locations = grid[['x', 'y', 'q', 'r', 'floor', 'type']].copy()
    elif map_type == 'GRID':
        logger.info("Serializing %s" % map_type)
        grid['type'] = PositionType.Value("SLAM_GRID")
        locations = grid[
            ['t', 'x', 'y', 'q', 'r', 'sxy', 'floor', 'type']].copy()
    else:
        raise NotImplementedError(
            "Map type {} not supported, try one of RADIO_MAP and GRID".format(
                map_type))

    estimates = grid[['transmitter_id', 'mean', 'var', 'ssid']].copy()
    transmitters = transmitters_frame(grid)

    estimates.loc[:, 'transmitter'] = estimates['transmitter_id'].map(
        dict((row.identifier, i) for i, row in transmitters.iterrows()))

    # This line makes me sweat blood.
    locations.sort_values(by=['q', 'r', 'floor'], inplace=True)
    estimates['position'] = (~locations[
        ['q', 'r', 'floor']].duplicated()).cumsum() - 1

    locations.drop_duplicates(['q', 'r', 'floor'], inplace=True)
    locations.reset_index(drop=True, inplace=True)
    recording_ids = recording_ids or []
    return serialize_slam_map(
        slam_map_type=SlamMap.MapType.Value(map_type),
        building=building_id,
        recordings=recording_ids,
        transmitters=transmitters,
        locations=locations,
        estimates=estimates,
        metadata=dict(hex_side=hex_side,
                      recordings=" ".join(map(str, recording_ids))
                      )
    )
