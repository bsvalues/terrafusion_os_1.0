import functools
import itertools
import logging
from multiprocessing import cpu_count, Pool
from typing import List, Tuple, Iterable

import indoorsdatapy.access.recording as indoor_rec
import indoorsdatapy.access.utilities as indoor_u
import indoorsdatapy.algorithms.hexgrid as indoor_h
import indoorsdatapy.algorithms.interpolation as indoor_algo
import indoorsdatapy.common.const.network_type as type
import indoorsprotocol.positions_pb2 as pb
import numpy as np
import pandas as pd

FUSE_DEFAULT = {
    "do_expansion": False,
    "expand": {
        "hex_side": 1.0,
        "extent": 2.,  # Number of location variance to expand
        "var_max": {
            type.WLAN: 30 ** 2,
            type.IBEACON: 50 ** 2
        },
        # Maximal acceptable RSSI variance
        "mean_min": -150,  # Minimal acceptable RSSI
        "weight_max": 4. ** 2  # Maximal allowed location variance
    },
    "interpolation": {
        "hex_side": 1.5,
        "effective_radius": 3.,  # effective radius of interpolation
        # remove strong and week signals
        "min_quantile": 0.10,
        "max_quantile": 0.95,
        "var_max_wifi": 30 ** 2,
        "var_max_ble": 50 ** 2,
        # Maximal acceptable RSSI variance
        "var_min": 0.0,
        "min_rssi": -150,
        "gauss": {
            "tau": 3 ** 2.,
            "alpha": 25. ** 2,
            "error": 64,
            "offset": -100.,
        },
    },
    "postprocessing": {
        'head': 10
    }
}

logger = logging.getLogger(__name__)
FORMAT = "[%(filename)s:%(lineno)s - %(funcName)20s() ] %(message)s"
logging.basicConfig(format=FORMAT)


# noinspection SpellCheckingInspection
def slam_fuse(slam_trajectory_df: pd.DataFrame,
              settings: dict = None,
              parallel_proc: bool = True):
    """Fuse new trajectories into grid and make interpolated slam map

    Args:
        slam_trajectory_df:
            ['t' 'x' 'y' 'floor' 'recording_id' 'sxy'
             'transmitter_type' 'bssid', 'ssid' 'transmitter_id'
             'mean' 'var' 'weight' 'position_id']
        input previous SLAM grid slam trajectory (from previous SLAM)
        settings: setting dictionary for slam algo, if None use FUSE_DEFAULT
        parallel_proc: if true, perform parallel processing

    Returns:
        pd.DataFrame: fingerprints,
            columns=['x', 'y', 'q', 'r', 'rssi_mean', 'rssi_var', 'vertical_order',
                     'transmitter_id', 'transmitter_type', 'ssid', 'bssid']

    """
    settings = settings or FUSE_DEFAULT

    pool = Pool(max(1, cpu_count() - 1)) if parallel_proc else None

    grid, recording_ids = perform_fuse(
        slam_trajectories=slam_trajectory_df,
        settings=settings,
        pool=pool)
    if pool:
        pool.close()

    grid.rename(columns={'mean': 'rssi_mean',
                         'var': 'rssi_var',
                         'floor': 'vertical_order'},
                inplace=True)

    return grid


def perform_fuse(slam_trajectories: pd.DataFrame,
                 settings,
                 pool=None):
    """

    Args:
        slam_trajectories: input trajectories (from SLAM)
        input previous SLAM grid dto file path (from previous SLAM)
        settings: like FUSE_DEFAULT
        pool: number of maximum available cpu cores available for parallel
        execution. None, for serialized processing

    Returns:
        interpolated: pd.DataFrame
        recordings_ids: list with the recordings ids

    """
    # logger.info("FUSE: Loading trajectories")
    initial_data = slam_trajectories[[
        't',
        'position_id', 'x', 'y', 'floor', 'sxy',
        'transmitter_id', 'transmitter_type', 'bssid', 'ssid', 'mean', 'var', 'weight']]
    recordings_ids = slam_trajectories['recording_id'].unique().tolist()
    trx_df = initial_data[['transmitter_id', 'ssid']].drop_duplicates()
    # logger.info("FUSE: Interpolating posterior grid")

    interpolated = interpolate_grid(
        source=initial_data,
        hex_side=settings["interpolation"]["hex_side"] / indoor_h.HexCell.SQRT3,
        margin=settings["interpolation"]["effective_radius"],
        gauss_settings=settings["interpolation"]["gauss"],
        max_var={
            type.WLAN: settings["interpolation"]["var_max_wifi"],
            type.IBEACON: settings["interpolation"]["var_max_ble"]
        },
        min_rssi=settings["interpolation"]["min_rssi"],
        max_quantile=settings["interpolation"]["max_quantile"],
        min_quantile=settings["interpolation"]["min_quantile"],
        pool=pool)
    # logger.info("FUSE: Interpolated posterior grid has {} estimates".format(len(interpolated.index)))

    interpolated['ssid'] = interpolated['transmitter_id'].map(
        dict((row.transmitter_id, row.ssid) for _, row in trx_df.iterrows()))

    return interpolated, recordings_ids


def flatten_estimates(estimates, new_estimates):
    """Flatten expanded estimates

    Parameters
    ----------
    estimates: dict
        key: (floor, q, r, transmitter_id):
        values: (x, y, sxy, mean, var, time, ssid)
    new_estimates : list(tuple, tuple)
        key: (floor, q, r, transmitter_id):
        values: (x, y, sxy, mean, var, time, ssid)
    hex_side : float
        side of hex cell

    Returns
    ------
    dict
        key : (floor, q, r, transmitter_id)
        value : (x, y, sxy, mean, var, time)
    """

    def flatten(a, b):
        key, value = b
        if key not in a:
            a[key] = value
        else:
            x0, y0, sxy0, m0, v0, t0, ssid, transmitter_type = a[key]
            x1, y1, sxy1, m1, v1, t1, ssid, transmitter_type = value
            mean, var = gaussian_combine(m0, v0, m1, v1)
            sxy = max(sxy0, sxy1)
            t = min(t0, t1)
            a[key] = (x0, y0, sxy, mean, var, t, ssid, transmitter_type)
        return a

    return functools.reduce(flatten, new_estimates, estimates)


def build_grid(source_xy, hex_side, margin):
    """Create grid

    Parameters
    ----------
    source_xy : iterable (float,float)
        pairs of x, y coordinates
    hex_side : float
        side of hex in grid
    margin:
        radius search around cells in source_xy with

    Returns
    -------
    list(float, float)
        x, y coordinates
    """
    cells = itertools.chain.from_iterable(
        map(
            lambda xy: indoor_h.HexCell.within_radius(xy, radius=margin, side=hex_side)
            [:, :2].tolist(), source_xy))
    return np.array(list(set(map(tuple, cells))))


def interpolate_grid(source,
                     hex_side,
                     margin,
                     gauss_settings,
                     min_rssi,
                     max_var,
                     max_quantile,
                     min_quantile,
                     pool=None):
    """Summary

    Parameters
    ----------
    source : pd.DataFrame
        Required columns (floor, transmitter_id, t, x, y, mean, var)
    gauss_settings : dict
        Settings for gauss_interp
    hex_side : float
        side of hex to build destination grid with
    margin: float
        radius to use to build destination grid with
    min_rssi: float
        minimal allowed RSSI to propagate to map
    max_var: dict
        maximal allowed RSSI variance to propagate to map

    Returns
    ------
    pd.DataFrame
        Required columns (floor, transmitter_id, t, x, y, q, r, mean, var)
    """

    mean_filter = {
        floor:
            (df['mean'].quantile(min_quantile),
             df['mean'].quantile(max_quantile))
        for floor, df in source.groupby('floor')
    }

    # logger.info('source before filter %s' % len(source))
    src = filter_rssi(source, max_var, min_rssi)
    # logger.info('source after filter %s' % len(src))

    # Group source by tx id and floor
    groups = [(pos, floor, tx_id, ssid, bssid, tx_type) for
              (tx_id, ssid, bssid, tx_type, floor), pos in
              src.groupby(["transmitter_id", 'ssid', 'bssid', "transmitter_type", "floor"])]

    # Define partial for processing
    interp_partial = functools.partial(interpolate_grid_floor,
                                       mean_filter=mean_filter,
                                       hex_side=hex_side,
                                       margin=margin,
                                       gauss_settings=gauss_settings)

    # Map partial to each group
    if pool is not None:
        # logger.debug("interpolate_grid: Processing with multiprocessing pool")
        result = pool.map(interp_partial, groups)
    else:
        # logger.debug(
        #     "interpolate_grid: Processing without multiprocessing pool")
        result = map(interp_partial, groups)

    # Concatenate resulting data
    res = pd.concat(result, ignore_index=True)
    # Filter low or uncertain signals
    # logger.info('result before filter %s' % len(res))
    res = filter_rssi(res, max_var, min_rssi)
    # logger.info('result after filter %s' % len(res))

    return res


def interpolate_grid_floor(transmitter, mean_filter, hex_side, margin,
                           gauss_settings):
    """
    see interpolate_grid below. This function allows multiprocessing
    :return:
    """
    (pos, floor, tx_id, ssid, bssid, tx_type) = transmitter
    # TODO change name
    pos = pos[(pos['mean'] > mean_filter[floor][0]) &
              (pos['mean'] < mean_filter[floor][1])]
    if len(pos) <= 1:
        return pd.DataFrame()
    xy = build_grid(source_xy=pos[["x", "y"]].values,
                    hex_side=hex_side,
                    margin=margin)

    mean, var = indoor_algo.gauss_interp(xy, pos[["x", "y", "mean", "var"]].values,
                                         gauss_settings["tau"], gauss_settings["alpha"],
                                         gauss_settings["error"], gauss_settings["offset"])

    q, r = indoor_h.HexCell.qr_from_xy(x=xy[:, 0], y=xy[:, 1], side=hex_side)
    qr = np.array([indoor_h.HexCell.qr_round(_qr[0], _qr[1]) for _qr in zip(q, r)])
    interp = pd.DataFrame({
        "x": xy[:, 0],
        "y": xy[:, 1],
        "q": qr[:, 0],
        "r": qr[:, 1],
        "mean": mean,
        "var": var
    })
    interp["floor"] = floor
    interp["transmitter_id"] = tx_id
    interp['transmitter_type'] = tx_type
    interp['ssid'] = ssid
    interp['bssid'] = bssid
    return interp


def filter_rssi(source, max_var, min_rssi):
    wlan_src = source[(source["mean"] > min_rssi) &
                      (source["var"] < max_var[type.WLAN]) &
                      (source["transmitter_type"] == type.WLAN)]
    ble_src = source[(source["mean"] > min_rssi) &
                     (source["var"] < max_var[type.IBEACON]) &
                     (source["transmitter_type"] == type.IBEACON)]

    return pd.concat([wlan_src, ble_src])


def gaussian_combine(m1, v1, m2, v2):
    """Combine gaussian estimates

    Parameters
    ----------
    m1 : float
        mean of first gaussian
    v1 : float
        variance of first gaussian
    m2 : float
        mean of second gaussian
    v2 : float
        variance of second gaussian

    Returns
    -------
    float, float
        mean and variance of resulting gaussian
    """
    iv = 1. / v1 + 1. / v2
    vc = 1. / iv
    u = (m1 / v1 + m2 / v2) * vc
    v = 0.5 * (((m1 * m1 + v1) / v1 + (m2 * m2 + v2) / v2) * vc - u * u)
    return u, v


# ------------------------------------------------------------------------------

SLAM_DEFAULT = {
    "position_type": pb.PositionType.Value("GROUND_TRUTH"),
    'rssi_error': 4.,  # before wifi error
    'GT_error': 0.6,  # ground truths err
    "transmitter_filter": [type.IBEACON, type.WLAN]
}


def slam_algo(recording_accesses: Iterable[indoor_rec.RecordingAccess],
              settings: dict = None):
    """For each rectilinear segment of a recording
    1. uniformly interpolates #steps positions between the two
        ground-truth positions defining the segment and
    2. associates to each step position the radio signals
        recorded between that step and successive one

    Args:
        recording_accesses: recordings to be processed
        settings: dictionary containing some default values
            - position_type
            - transmitter_filter
            - rssi_error
            - settings

    Returns:
        - radio_fingerprint_df:
            ['t' 'x' 'y' 'floor' 'recording_id' 'sxy'
             'transmitter_type' 'bssid', 'ssid' 'transmitter_id'
             'mean' 'var' 'weight' 'position_id']
    """
    settings = settings or SLAM_DEFAULT

    results = []
    paths = []
    offset = 0
    for idx, access in enumerate(recording_accesses):
        positions = access.positions_with_type(settings['position_type'])
        max_t = access['steps']['t'].max()
        min_t = access['steps']['t'].min()
        radios = trim_dataframe(access.radio(), max_t, min_t)
        radios = radios[radios.type.isin(settings['transmitter_filter'])]

        if detect_static_fg(positions):
            result, path = _fill_radio_static_fg(positions, radios,
                                                 settings['rssi_error'])
        else:
            result, path = _fill_radio(
                radios, _build_up_route(access['steps'], positions),
                settings['rssi_error'])

        result['position'] += offset
        offset += len(path)
        floor = int(positions.iloc[0].floor)
        result["floor"] = floor
        results.append(result)
        # path
        path["floor"] = floor
        path["recording_id"] = access.pb.id
        paths.append(path)

    radio_estimates = pd.concat(results, ignore_index=True)
    locations = pd.concat(paths, ignore_index=True)
    locations['sxy'] = settings['GT_error']

    # TODO: this can be further optimized, but not today.
    #  There should be no need to create the transmitter_df at all,
    #  we can just expand the radio_df with the extra cols bssid, ssid, type
    # produce transmitters frame
    transmitters = indoor_u.transmitters_frame(radio_estimates)

    radio_estimates = pd.merge(
        radio_estimates, transmitters.drop(['ssid'], axis=1),
        left_on='transmitter_id', right_on='identifier').rename(
        columns={'type': 'transmitter_type', 'position': 'position_id'})

    radio_estimates = radio_estimates[[
        'transmitter_type', 'bssid', 'ssid', 'transmitter_id',
        'mean', 'var', 'weight', 'position_id']]

    radio_fingerprints = pd.merge(
        locations, radio_estimates,
        left_index=True, right_on='position_id'
    ).rename(columns={'time': 't'})

    return radio_fingerprints


def trim_dataframe(dataframe, end_time, start_time):
    return dataframe[(dataframe.t <= end_time) & (dataframe.t >= start_time)]


def detect_static_fg(positions):
    if len(positions.index) == 2:
        if len(positions.drop_duplicates(['x', 'y'])) == 1:
            return True
    return False


def _fill_radio_static_fg(positions, radios, default_error):
    results = pd.DataFrame(
        [],
        columns=["position", "transmitter_id", 'ssid', "mean", "var", "weight"])

    stats = radios.groupby(['transmitter_id', 'ssid']).agg('count',
                                                           mean=pd.NamedAgg(column='rssi', aggfunc=db_mean))
    stats.reset_index(inplace=True)

    results['transmitter_id'] = stats['transmitter_id']
    results['ssid'] = stats['ssid']
    results['mean'] = stats['rssi']['mean']
    results['var'] = default_error * default_error / stats['rssi']['count']
    results['weight'] = stats['rssi']['count']
    results['position'] = 0

    path = positions[['x', 'y']].head(n=1)
    path.reset_index(inplace=True, drop=True)
    path['time'] = 0
    path['time'].iloc[0] = radios['t'].tail(n=1).values[0]

    return results, path


def _fill_radio(radios: pd.DataFrame,
                route, default_error) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Computes the radio dataframe along the given route

    Args:
        radios: all radio dataframe
        route: list of quadruplets [t_start, t_end, x, y], representing the waypoints of a route
        default_error: std to be applied to the RSSIs

    Returns:
        - route_radio_df - columns=["position", "transmitter_id", 'ssid', "mean", "var", "weight"]
        - route_df - columns=["time", "x", "y"] time = t_start

    """
    route_radios = []
    route_pts = []

    for waypoint_i, waypoint in enumerate(route):
        t_start, t_end, x, y = waypoint

        # get all radios recorded along this route leg
        leg_radio_df = radios[(radios['t'] >= t_start) & (radios['t'] <= t_end)]

        route_pts.append((t_start, x, y))
        for tx_id, tx_df in leg_radio_df.groupby("transmitter_id"):
            ssid = tx_df.ssid.unique().tolist()
            ssid = [
                ssid_entry for ssid_entry in ssid
                if ssid_entry not in [None, u"0"]
            ]
            route_radios.append((waypoint_i, tx_id, "" if not ssid else ssid[0], db_mean(tx_df.rssi.values),
                                 (default_error / len(tx_df)) ** 2, len(tx_df)))

    return (
        pd.DataFrame(route_radios,
                     columns=["position", "transmitter_id", 'ssid', "mean", "var", "weight"]),
        pd.DataFrame(route_pts,
                     columns=["time", "x", "y"])
    )


def _build_up_route(steps: pd.DataFrame,
                    positions: pd.DataFrame,
                    step_time_spread: float = 0.0) -> List[Tuple[float, float, float, float]]:
    """Build up routes for recordings by splitting the whole trajectory into steps

    Args:
        steps: step dataframe of the recording
        positions: position dataframe of the recording
        step_time_spread: ???

    Returns: list of [time_start, time_end, x, y]

    """

    interLocs = []
    for i in range(len(positions) - 1):
        # get the start position
        p_start = positions.iloc[i]
        x_start, y_start, t_start = p_start.x, p_start.y, p_start.t

        # get the last position
        pos_end = positions.iloc[i + 1]
        x_end, y_end, t_end = pos_end.x, pos_end.y, pos_end.t

        # get all steps between 2 consecutive positions (a segment)
        segment_steps = steps[(steps.t > t_start) & (steps.t < t_end)]
        steps_number = len(segment_steps)

        if steps_number < 1:
            continue

        step_dx = (x_end - x_start) * 1.0 / steps_number
        step_dy = (y_end - y_start) * 1.0 / steps_number

        interLocs.append((t_start - step_time_spread,
                          segment_steps.iloc[0]['t'], x_start, y_start))

        for j in range(1, steps_number):
            x = x_start + j * step_dx
            y = y_start + j * step_dy
            interLocs.append((segment_steps.iloc[j - 1]['t'],
                              segment_steps.iloc[j]['t'],
                              x, y))

        interLocs.append((segment_steps.iloc[-1]['t'],
                          t_end + step_time_spread, x_end, y_end))

    return interLocs


def db_mean(db_vals):
    """
    Calculates the mean power of dB (decibel) values (e.g. RSSI).

    Args:
        db_vals (list(float)): list of dB values.

    Returns:
        float: mean power in dB.

    """
    return np.log10(np.mean(np.power(10, db_vals * 1. / 10))) * 10
