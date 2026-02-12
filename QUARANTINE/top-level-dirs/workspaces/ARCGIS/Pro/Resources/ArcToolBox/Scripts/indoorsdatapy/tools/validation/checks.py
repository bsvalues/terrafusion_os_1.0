import logging

import pandas as pd
from indoorsdatapy.access.utilities import transmitters
from indoorsdatapy.common.const.network_type import WLAN, IBEACON
from numpy import arange

logger = logging.getLogger(__name__)


def radio_rate_policy(radios, moving_win_size=10., rate_threshold=3.,
                      apart=2., radio_filter=lambda x: x):
    """
    Check if the avg rate of rows per seconds if higher than rate threshold

    :param radios: df
    :param moving_win_size: float
        size of calculating avg rate in seconds
    :param rate_threshold: float
        min allowed rate threshold 
    :param apart: float
        step of moving win in seconds
    :param radio_filter: fnc
        process radios df
    :return:  bool
    """
    df = radios
    t_max = df['t'].max()
    t_min = df['t'].min()

    for time in arange(t_min, t_max - moving_win_size, apart):
        window = df[(df['t'] >= time) & (df['t'] < time + moving_win_size)]

        # if window has no rows we cant evaluate
        if len(window) <= 1:
            continue

        # to use only real size of time window
        win_size = abs(window['t'].min() - window['t'].max())

        # adjust threshold accordingly to real window time
        current_threshold = moving_win_size / win_size * rate_threshold

        # apply filter function. e.g. unique transmitters
        window = radio_filter(window)

        # if window is empty it is actually less than rate_threshold
        if window.empty:
            return False

        # lets calculate rate per second and compare with adjusted threshold
        if float(len(window)) / win_size < current_threshold:
            return False

    return True


def sensor_outage_checker(recording_access, threshold, attr_sensor='radios'):
    """
    Check if sensors run +- same time as recording length
    :param recording_access: dict
    :param threshold: number
        allowed time between real data and metadata of recording
    :param attr_sensor: str
    :return: bool
    """
    start = recording_access['start']
    end = recording_access['end']
    sensor_data = recording_access[attr_sensor]

    return abs(start - sensor_data['t'].min()) <= threshold or abs(
        end - sensor_data['t'].max()) <= threshold


def duration(recording):
    return recording['end'] - recording['start']


def rows_count(x, table, filter=None):
    if filter:
        return len(x[table].apply(filter, axis=1).index)
    return len(x[table].index)


def consecutive_positions_per_floor(positions, type=1):
    """
    Check if some consecutive positions on some floor exist.
    Parameters
    ----------
    positions pandas contains of type and floor
    type: type of the positions; default ground truths(1)

    Returns
    -------
    True if there are at least two consecutive position on some floor
    False if there are no consecutive position on some floor
    """
    gt = positions[positions['type'] == type].reset_index()
    n = len(gt.index)
    if n < 2:
        return False

    for idx in range(0, n - 1):
        if gt['floor'][idx] == gt['floor'][idx + 1]:
            return True
    return False


def consecutive_positions_per_floor_strict(positions, type=1):
    """
    Check if position is with consecutive on the same floor
    Legend:
        * position
        --- floor
        |_  changing floor
    Examples:
    True:
         *-----------*
                     |_
                       |_
                         |_
                           *------------*
    False:
          *----
              |_
                |_
                  |_
                    *

    Parameters
    ----------
    positions pandas contains of type and floor
    type: type of the positions; default ground truths(1)
    Returns
    -------
    true if all positions has consecutive position from same floor
    """
    gt = positions[positions['type'] == type].reset_index()
    n = len(gt.index)
    if n < 2:
        return False
    if gt['floor'][0] != gt['floor'][1]:
        return False
    if gt['floor'][n - 1] != gt['floor'][n - 2]:
        return False
    # other positions
    for idx in range(1, n - 1):
        if gt['floor'][idx] not in [gt['floor'][idx - 1],
                                    gt['floor'][idx + 1]]:
            return False
    return True


def speed_trap(positions, max_speed):
    """
    Check if  avg speed between two positions is over limit
    Parameters
    ----------
    locations pd frame x,y,t
    max_speed max speed

    Returns
    -------
    bool
    true if all segments has avg speed below limit
    false if one of segments has avg speed over limit
    """

    positions = positions[positions['type'] == 1].reset_index()
    n = len(positions.index)
    if n <= 1:
        return False
    m2 = max_speed ** 2
    for i in range(0, n - 1):
        time = (positions['t'][i + 1] - positions['t'][i]) ** 2
        if time > 0:
            dx = (positions['x'][i + 1] - positions['x'][i]) ** 2
            dy = (positions['y'][i + 1] - positions['y'][i]) ** 2
            ds = dx + dy
            if (ds / time) > m2:
                return False
    return True


def match_devices(recording_accesses):
    """
    Given set of recording accesses, count how many accesses each device has,
    return list of all accesses from all but most common access.


    Parameters recording_accesses
    ----------
    recording_accesses (dict):
        key: recording identifier
        value: recording Access (dict);
                must consists of:
                                key:'metadata'
                                value: pd.DataFrame
                                       cols: device_name,os_version

    Returns (list)
        list of minor ids
        e.g.
            If the set of recordings has:
            2x Samsung
            3x Huawey
            1x Boxian
            it return recording ids of [Boxian,Samsung,Samsung]
        id is related to keys() of recording_accesses
    -------

    """

    devices_frame = pd.DataFrame(
        [dict(id=id,
              phone_id=access['meta'][access['meta']['name'] == 'phone_id']
              ['value'].values[0])
         for id, access in recording_accesses.items()])

    device_count = devices_frame.groupby(by=['phone_id'])[
        'id'].count().reset_index(name="count")
    major_device = \
        device_count[device_count['count'] == device_count['count'].max()][
            'phone_id'].values[0]

    minor_devices = list(
        devices_frame[devices_frame['phone_id'] != major_device]['id'].values)
    return minor_devices


def recordings_time_epoch_filter(recording_accesses, epoch_size,
                                 moving_win_size):
    """
    Find the time epoch which consists of highest count of recordings.

    Parameters
    ----------
    :param recording_accesses:  recording Access (dict);
                        must consists of:
                                         key:'start'
                                         value: number in seconds
    :param epoch_size:  int
        size of epoch in seconds
    :param moving_win_size: int
        step time in seconds

    Returns (list)
    -------
    Return list of recordings which are not in the epoch with highest occurrence.
    """

    dates = pd.DataFrame(
        [dict(id=id,
              start=access['start'],
              ) for id, access in recording_accesses.items()]).sort_values(
        'start').reset_index(drop=True)

    max_time = int(dates['start'].max())
    min_time = int(dates['start'].min())
    selection = []

    if (max_time - min_time) < epoch_size:
        return set([])

    for time in range(min_time, max_time, moving_win_size):
        epoch_start = time
        epoch_end = time + moving_win_size
        epoch_set = \
            dates[
                (dates['start'] > epoch_start) & (dates['start'] < epoch_end)][
                'id'].values

        if len(selection) < len(epoch_set):
            selection = epoch_set

    return set(recording_accesses.keys()) - set(selection)


def attribute_policy(recording_accesses, table, column=None):
    """
    Select recordings with the most occurred value. And return negation
    Parameters
    ----------
    recording_accesses: recording Access (dict);

    table: (string)
        table to be processed
    column: (string) or None
        table to be processed
        if None than it will expect basic value instead of DataFrame

    Returns (list)
    -------
       Select recordings with the most occurred value. And return negation
    """
    if column:
        frame = pd.DataFrame(
            [{'id': id,
              column: access[table][column].iloc[0],
              } for id, access in recording_accesses.items()])
    else:
        column = str(table)
        frame = pd.DataFrame(
            [{'id': id,
              column: access[table],
              } for id, access in recording_accesses.items()])

    count = frame.groupby(by=[column])['id'].count().reset_index(name="count")
    major = count[count['count'] == count['count'].max()][column].iloc[0]
    minor = list(frame[frame[column] != major]['id'].values)
    return minor


def transmitter_set_overlaps_policy(accesses, table='radios', column='ssid',
                                    tolerance=1):
    """
    The set of transmitters one recording sees, should overlap with at least
    one(default) set from other recordings. At least is configurable by tolerance

    Parameters
    ----------
    accesses: (dict)
        Access or dict where key is strin <table> 
        and vals pandas frame constisitng of column <column>
    table: optional string
    column: optional string
    tolerance: min number of overlapping transmitters assumed as valid overlap :D

    Returns
    -------

    """
    transmitters_dict = dict(
        (key, transmitters(access[table])[[column]]) for key, access in
        accesses.items())
    valid = set()
    bin = []

    for id_a, tr_a in transmitters_dict.items():
        bin.append(id_a)
        for id_b, tr_b in transmitters_dict.items():
            if id_b not in bin:
                s1 = pd.merge(tr_a, tr_b, how='inner', on=[column])
                s1.dropna(inplace=True)
                if len(s1) >= tolerance:
                    valid.add(id_a)
                    valid.add(id_b)
                    break

    return set(transmitters_dict.keys()) - valid


def repeted_container_count(pb_object, limit):
    count = 0
    for i in pb_object:
        count += 1
        if count > limit:
            return True
    return False


def transmitters_count(radios, limit):
    tx = set()
    for i in radios:
        if i.type == IBEACON:
            tx.add(i.ssid)
        if i.type == WLAN:
            tx.add(i.bssid)
        if len(tx) > limit:
            return True
    return False


def pb_durarion(start, end):
    return end - start


RECORDING_CHECKS_PB = \
    dict(
        more_than_20_radios=lambda x: repeted_container_count(x.radios, 20),
        more_than_10_steps=lambda x: repeted_container_count(x.steps, 10),
        more_than_200_magnetics=lambda x: repeted_container_count(
            x.magnetics, 200),
        more_than_200_accelerations=lambda x: repeted_container_count(
            x.accelerations, 10),
        more_than_4_transmitters=lambda x: transmitters_count(x.radios, 4),
        duration_from_10s=lambda x: pb_durarion(x.start, x.end) >= 10,

    )

RECORDING_CHECKS = \
    dict(
        duration_from_10s=lambda x: duration(x) >= 10,
        more_than_20_radios=lambda x: rows_count(x, 'radios') > 20,
        more_than_5_radios=lambda x: rows_count(x, 'radios') > 5,
        more_than_10_steps=lambda x: rows_count(x, 'steps') > 10,
        more_than_3_steps=lambda x: rows_count(x, 'steps') > 3,
        same_radio_type=lambda x: len(x['radios']['type'].unique()) == 1,
        consecutive_ground_truths_per_floor=lambda
            x: consecutive_positions_per_floor(x['positions']),
        having_accelerations=lambda x: rows_count(x, 'accelerations') > 0,
        having_rotations=lambda x: rows_count(x, 'rotations') > 0,
        having_steps=lambda x: rows_count(x, 'steps') > 0,
        having_gyros=lambda x: rows_count(x, 'gyros') > 0,
        having_radios=lambda x: rows_count(x, 'radios') > 0,
        having_magnetics=lambda x: rows_count(x, 'magnetics') > 0,
        more_than_200_magnetics=lambda x: rows_count(x, 'magnetics') > 200,
        more_than_200_accelerations=lambda x: rows_count(
            x, 'accelerations') > 200,
        more_than_200_gyros=lambda x: rows_count(x, 'gyros') > 200,
        more_than_10_kalman_positions=lambda x: rows_count(
            x, 'positions', lambda r: r['type'] == 3) > 10,
        speed_limit_3ms=lambda x: speed_trap(x['positions'], 3),
        more_than_4_transmitters=lambda x: len(
            transmitters(x['radios']).index) >= 4,
        having_fingerprints=lambda x: len((x['fingerprints']).index) >= 0,
        more_than_30_signal_per_10sec=lambda x: radio_rate_policy(
            x['radios'], moving_win_size=10., rate_threshold=3, apart=1),
        more_than_3_unique_tx_per_3sec=lambda x: radio_rate_policy(
            x['radios'], moving_win_size=3.,
            rate_threshold=1, apart=1, radio_filter=transmitters),
        sensor_outage_checker=lambda x: sensor_outage_checker(x, 4),

    )

# checks below are for validation of recordings set.
# Functions return list of invalid recordings
RECORDING_SET_SELECTIONS = \
    dict(
        device_match=lambda x: match_devices(x),
        recordings_happened_within_1_months=lambda
            x: recordings_time_epoch_filter(x, 2592000, 86400),
        same_radio_type=lambda x: attribute_policy(x, 'radios', 'type'),
        building_id_match=lambda x: attribute_policy(x, 'building'),
        transmitter_overlap=lambda x: transmitter_set_overlaps_policy(x),
    )
