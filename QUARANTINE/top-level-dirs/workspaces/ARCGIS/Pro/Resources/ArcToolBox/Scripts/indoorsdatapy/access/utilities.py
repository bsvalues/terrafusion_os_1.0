from collections import defaultdict
from collections.abc import Iterable

import numpy as np
import pandas as pd
from pandas import DataFrame, merge, concat

from indoorsdatapy.access.factory.pb2df import _pb2df
from indoorsdatapy.common.const.network_type import (get_unique_id_by_tuple,
                                                     get_identification)

CONVERSION_MULTIPLICATION = 1e-3
CONVERSION = lambda x: float(x) * CONVERSION_MULTIPLICATION


# building
def fingerprint_points_statistics(_fingerprint_points, _statistics):
    """
    Get fingerprint points with statistics
    Parameters
    ----------
    _fingerprint_points (pd.DataFrame)
        output of fingerprint_points()
    _statistics (pd.DataFrame)
        output of statistics()

    Returns (pd.DataFrame)
    -------

    """
    return _fingerprint_points.merge(_statistics, on='point_id')


# building
def statistics(fingerprints, networks):
    """
    Get fingerprint statistics
    Parameters
    ----------
    fingerprints building Access df
    networks  building Access df

    Returns (pd.DataFrame)
    -------

    """
    _fingerprints = concat([
        fingerprints,
        _pb2df([f['statistic'] for idx, f in fingerprints.iterrows()],
               cols=['amount', 'mean', 'variance'],
               )], axis=1)[
        ['id', 'network_id', 'point_id', 'amount', 'mean', 'variance']]

    results = networks.merge(_fingerprints, suffixes=("", "f"),
                             left_on="id", right_on="network_id")
    one = dict(
        point_id=lambda v: v.point_id,
        mean_rssi=lambda v: v.at['mean'],
        std_rssi=lambda v: v.at['variance'] ** 0.5,
        transmitter_occ=lambda v: v.at['amount'],
        bssid=lambda v: v.at['bssid'],
        ssid=lambda v: v.at['name'],
        transmitter_type=lambda v: v.at['type'],
        transmitter_id=lambda v: get_unique_id_by_tuple(
            v.at['bssid'], v.at['name'], v.at['type']
        ),
    )

    return DataFrame.from_records([dict((k, v(x)) for k, v in one.items())
                                   for _, x in results.iterrows()
                                   ], columns=one.keys())


# building
def fingerprint_points(fingerprint_points, floors):
    """
    Construct fingerprint_points with floors
    Parameters
    ----------
    fingerprint_points: building Access df
    floors: building Access df
    conversion

    Returns
    -------

    """
    df = fingerprint_points \
        .merge(floors, suffixes=("", "f"),
               left_on="floor_id", right_on="id")

    df['x'] = df['x'] * CONVERSION_MULTIPLICATION
    df['y'] = df['y'] * CONVERSION_MULTIPLICATION

    return df.rename(columns=dict(id='point_id', level='floor_level')
                     )[['y', 'x', 'floor_level', 'point_id']]


# building
def floor_level_by_id(floors):
    """Dict with floor level by floor id"""
    return {floor.id: floor.level for i, floor in floors.iterrows()}


# building
def floor_id_by_level(floors):
    """Dict with floor identifiers by level"""
    return {floor.level: floor.id for i, floor in floors.iterrows()}


def floors(floorsdf, building_id, conversion=lambda x: int(x * 1e+3)):
    df = floorsdf
    df['building_id'] = building_id
    df['width'] = df['width'].apply(conversion)
    df['height'] = df['height'].apply(conversion)
    df['left_origin'] = df['left_origin'].apply(conversion)
    df['top_origin'] = df['top_origin'].apply(conversion)

    return df.rename(columns=dict(
        width='mmwidth',
        height='mmheight',
        left_origin='mmleftorigin',
        top_origin='mmtoporigin',
    ))[[
        'id', 'building_id', 'description', 'level',
        'mmheight', 'mmleftorigin', 'mmtoporigin', 'mmwidth', 'name'
    ]]


def walls_by_floors(walls, edge_points, floors, conversion=CONVERSION):
    """From walls edge points and floors reconstruct dict where key is floor
     level and value is coordinates of walls
    """
    result = dict()
    for i, floor in floors.iterrows():
        edgepoints = walls[walls.floor_id == floor.id] \
            .merge(edge_points, left_on="id", right_on="edge_id")

        grouped = edgepoints.groupby("edge_id")
        edgepoints["xedge"] = grouped["x"].apply(list)
        x = DataFrame(grouped["x"].apply(list))
        y = DataFrame(grouped["y"].apply(list))

        edges = merge(x, y, left_index=True, right_index=True)
        one = dict(
            id=lambda v: v.name,
            x0=lambda v: conversion(v.x[0]),
            y0=lambda v: conversion(v.y[0]),
            x1=lambda v: conversion(v.x[1]),
            y1=lambda v: conversion(v.y[1]),
        )

        result[floor.level] = DataFrame.from_records(
            [dict((k, v(x)) for k, v in one.items())
             for _, x in edges.iterrows()
             ], columns=one.keys())
    return result


# building
def transmitter_locations(networks, network_locations, floors):
    """For given networks and locations return transmitter with locations"""
    transmitters = networks.merge(
        network_locations, left_on="id", right_on="network_id",
        suffixes=("", "_")
    )

    flr = floor_level_by_id(floors)
    one = dict(
        x=lambda v: v.x,
        y=lambda v: v.y,
        floor_level=lambda v: flr[v.floor_id],
        transmitter_id=lambda v: get_unique_id_by_tuple(
            v.bssid, v['name'], v.type
        ),
    )

    return DataFrame.from_records([dict((k, v(x)) for k, v in one.items())
                                   for _, x in transmitters.iterrows()
                                   ], columns=one.keys())


# building
def zones_with_points(zones, zone_points, floor_id=None, zone_type=None,
                      conversion=CONVERSION):
    points = zone_points.copy()
    if floor_id:
        zones = zones[zones.floor_id == floor_id]
    if zone_type:
        zones = zones[zones.type == zone_type]
    if conversion:
        points['x'] = points['x'].apply(conversion)
        points['y'] = points['y'].apply(conversion)

    return merge(
        zones,
        points,
        suffixes=("", "z"),
        left_on="id", right_on="zone_id"
    )


# building
def tiles_description(floors):
    """
    Construct information dict for reconstruction tiles
    :param floors: df
        floor table 
    :return: dict
        tile info per floor
    """
    return {
        floor.level: dict(
            id=floor.default_map.id,
            per_pixel_base=floor.default_map.per_pixel_base,
            max_tile_size=floor.default_map.max_tile_size,
            tiles=
            [dict(
                key=tile.key,
                value=dict(
                    id=tile.value.id,
                    tile_size=tile.value.tile_size,
                    count_horizontal_tiles=tile.value.count_horizontal_tiles,
                    count_vertical_tiles=tile.value.count_vertical_tiles,
                    sum_pix_width=tile.value.sum_pix_width,
                    sum_pix_height=tile.value.sum_pix_height
                ))
                for tile in floor.default_map.tiles]

        )
        for i, floor in floors.iterrows()
    }


# building
def zones_points_by_level(zones, zone_points, floors, zone_type=None,
                          conversion=CONVERSION):
    """Get dict where keys are leves and values are zones_with_points"""
    return {
        floor.level:
            zones_with_points(zones, zone_points, zone_type=zone_type,
                              floor_id=floor.id, conversion=conversion)
        for i, floor in floors.iterrows()
    }


# recording
def positions_by_level(positions, level=None, position_type=None):
    """Get positions for given level"""
    if position_type:
        positions = positions[positions['type'] == position_type]

    if level:
        return {level: positions[positions['floor'] == level]}

    return {
        level: positions[positions['floor'] == level]
        for level in positions['floor'].unique()
    }


# slam_grid
def positions_with_estimates(positions, estimates):
    """ For position and estimates get merged table """
    return merge(positions, estimates, left_index=True, right_on='key')


# slam_grid
def estimates_with_transmitters(estimates, transmitters):
    """ For locations and transmitters get merget table"""
    return merge(transmitters, estimates, left_index=True,
                 right_on='transmitter')


# slam_grid
def estimates_with_positions_maker(slam_grid_access):
    """returns locations_with_transmitters and estimates"""
    slam_grid_access['position']['position'] = slam_grid_access[
        'position'].index

    return positions_with_estimates(
        slam_grid_access['position'].rename(columns=dict(type='pos_type')),
        estimates_with_transmitters(
            slam_grid_access['estimates'],
            transmitters_ids(
                slam_grid_access['transmitters']))).drop('type', 1)


# recording
def transmitters(radios):
    """Get transmitters data for given radio frame"""
    return radios[['type', 'bssid', 'ssid']].drop_duplicates()


# recording
def radio(radios, time='recording_date'):
    """Add to radios """
    df = transmitters_ids(radios)

    return df[[
        time, 'transmitter_id', 'rssi',
        'type', 'bssid', 'ssid', 'transmitter_type',
    ]]


def transmitters_ids(transmitters):
    """Build up transmitter_id frame from the transmitters"""
    df = transmitters.copy()
    df["transmitter_id"] = ""
    df["transmitter_type"] = ""

    for index, serie in df.iterrows():
        tid = get_unique_id_by_tuple(serie.bssid, serie.ssid, serie.type)
        df.at[index, "transmitter_id"] = tid
        df.at[index, "transmitter_type"] = int(serie.type)
    return df


def map_transmitters(df, map_list=None):
    """Convert transmitter id to integer index"""
    map_list = map_list or []
    for idx, row in df.iterrows():

        if row.transmitter_id in map_list:
            df.set_value(idx, map_list.index(row.transmitter_id))
        else:
            map_list.appned(row.transmitter_id)
            df.set_value(idx, map_list.index(row.transmitter_id))

    return df, map_list


def map_transmitters_back(df, map_list):
    return df['transmitter_id'].apply(lambda x: map_list[x])


def transmitters_frame(transmitters):
    """
    Reconstruct transmitter frame from transmitter_id
    Parameters
    ----------
    transmitters: pd.DataFrame
            consists of transmitter_id col

    Returns
    -------
    pd.DataFrame
        cols "identifier", "bssid", "ssid", "type"

    """
    return pd.DataFrame([[tid, ] + list(get_identification(tid))
                         for tid in transmitters['transmitter_id'].unique()
                         ], columns=("identifier", "bssid", "ssid", "type"))


def positions_with_type(positions, kind, time='t'):
    """For given type return positions"""
    if positions.empty:
        return positions
    if not isinstance(kind, Iterable):
        kind = [kind]
    return positions[positions['type'].isin(kind)].sort_values(by=time)


def get_metadata(metadata_df, key):
    """For given key get value"""
    return metadata_df[metadata_df['name'] == key]['value'].values


def map_metadata(metadata_df):
    return {row['name']: row['value']
            for i, row in metadata_df.iterrows()}


# slam
def radio_by_floor(radios):
    radiodata_by_floor = {}
    for f, g in radios.groupby(["floor"]):
        radiodata_by_floor[f] = g

    return radiodata_by_floor


def residuals_per_floor(residual):
    residual_by_floor = {}
    for f, g in residual.groupby(["ref_floor"]):
        residual_by_floor[int(f)] = retype(g)
    return residual_by_floor


def retype(df, dtype=np.float64):
    for col in df.columns.values:
        df[col] = df[col].astype(dtype)
    return df


def transmitters_with_index(df):
    return transmitters_frame(transmitters_ids(transmitters(df)))


def residual_per_recording(residual, recording):
    df = merge(recording,
               replace_nan(residual), left_index=True, right_on='key')
    residual_by_recording = {}
    for f, g in df.groupby(["recording"]):
        residual_by_recording[int(f)] = retype(g.reset_index(drop=True))
        residual_by_recording[int(f)]['recording'] = int(f)
    return residual_by_recording


def replace_nan(df):
    df = df.applymap(lambda x: pd.np.nan if x == u'NaN' else x)
    return df


def residuals(residual, recording):
    return retype(merge(recording, replace_nan(residual),
                        left_index=True, right_on='key'))


def residual_per_floor_recording(residual, recordings):
    df = merge(recordings, replace_nan(residual),
               left_index=True, right_on='key')
    res = defaultdict(dict)
    for (rec, floor), df in df.groupby(["recording", "ref_floor"]):
        rec = int(rec)
        floor = int(floor)
        res[floor][rec] = retype(df.reset_index(drop=True))
        res[floor][rec]['recording'] = rec
        res[floor][rec]['floor'] = floor
    return res
