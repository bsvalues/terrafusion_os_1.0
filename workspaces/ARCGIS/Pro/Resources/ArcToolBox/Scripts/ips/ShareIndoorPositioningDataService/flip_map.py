import sys
from copy import deepcopy
from typing import List, Tuple, Union, Dict

import ips.const as c
import numpy as np
import pandas as pd

# vlfip_map.py
TLR_HIGH_PERC = 92  # empirically found optimal triple-linear-regression parameter
MIN_FPP_TX_THSD_N = 6  # required minimum to run the triple_linear_regression

FLIP_MAP_SETTINGS = {
    "locator_type": "FLIP",
    "norm_type": "RAYLEIGH",
    "spread_dim": 2.3,
    "fpp_tx_thsd_n": 15,
    "fpp_tx_thsd_perc": 0.0,
    "rss_ds_thsd": 10.0,
    "n_ref_tx": 15,  # 100 for Wi-Fi, 15 for Bluetooth (default)
    "n_obs_tx": 10,  # 80 for Wi-Fi, 10 for Bluetooth (default)
    "extrapolate_n_rp": True
}


def generate_vflip_map(fpp_stats: pd.DataFrame,
                       settings: Dict = None) -> Dict:
    """
    Generates the (V)FLIP map based on fingerprint points statistics.

    Args:
        fpp_stats: fingerprint points statistics.
            DataFrame(point_id, x, y, floor_level, transmitter_id, mean_rssi, std_rssi)
        settings: vflip map settings.
            locator_type: "FLIP" (ignoring RSSI variance) or "VLIP" (considering RSSI variance)
            norm_type: "RAYLEIGH" (RSSI histogram approximated to rayleigh distribution) or
                "GLF" (RSSI histogram approximated to general logistic function)
            spread_dim: reference point spread dimensions
            fpp_tx_thsd_perc: filter out transmitters with less than fpp_tx_thsd_perc percentile points
            fpp_tx_thsd_n: filter out transmitters with less than fpp_tx_thsd_n points
            rss_ds_thsd: filter out transmitters with a rss distribution score of higher than rss_ds_thsd sigma
            n_ref_tx: number of strongest transmitters per reference point.
            n_obs_tx: number of strongest transmitters of observations.

    Returns:
        dict(radiomap_essentials: dict(transmitter_id: dict(
             f_n_ps_param: dict(low: dict(min, max, k, d),
                                med: dict(min, max, k, d),
                                hig: dict(min, max, k, d)),
             point_weight_list: PD(point_id, weight [, weight_l, weight_h]))),
        xyfb_points: PD:(point_id, x, y, floor_level, building_id),
        rp_max_score: dict(point_id: weight)
        meta: dict(creation_time, locator_type, norm_type, spread_dim,
                   fpp_tx_thsd_perc, fpp_tx_thsd_n, rss_ds_thsd): vflip_map.
    """

    def to_tx_pwl_df(radiomap_essentials):
        pwl_dfs = []
        for transmitter_id in radiomap_essentials.keys():
            pwl_df = radiomap_essentials[transmitter_id]["point_weight_list"]
            pwl_df["transmitter_id"] = transmitter_id
            pwl_dfs.append(pwl_df)
        return pd.concat(pwl_dfs)

    def hist_features(fpp_stats: pd.DataFrame):
        # default histogram functions are Rayleigh
        hist_fit, hist_cdf = rayleigh_fit, rayleigh_cdf

        # get RSSI histogram fit parameters by all references
        hist_params = hist_fit(fpp_stats["mean_rssi"])

        return hist_params, hist_cdf

    def rp_max_score(vflip_radiomap, settings: dict):
        """
        Calculates the maximum score for each reference point.

        Args:
            vflip_radiomap (dict): vflip_radiomap essentials.
                Refer to radiomap_essentials for details.

        Returns:
            out (dict(point_id: weight)): maximum score for each reference point.
        """
        tx_pwl_df = to_tx_pwl_df(vflip_radiomap)
        return {
            point_id: point_df.sort_values("weight", ascending=False).head(
                settings["n_obs_tx"])["weight"].sum()
            for point_id, point_df in tx_pwl_df.groupby("point_id")
        }

    def radiomap_essentials(fpp_stats: pd.DataFrame, settings: dict) -> dict:
        """
        Creates point weights for each transmitter.

        Args:
        fpp_stats: fingerprint points statistics.
            PD(point_id, x, y, floor_level, transmitter_id, mean_rssi, std_rssi)
        settings (dict): vflip map settings (ref. generate_vflip_map).

        Returns:
            radiomap_essentials (dict): vflip_radiomap essentials.
                dict(transmitter_id: dict(
                 f_n_ps_param: dict(low: dict(min, max, k, d),
                                    med: dict(min, max, k, d),
                                    hig: dict(min, max, k, d)),
                 point_weight_list: PD(point_id, weight [, weight_l, weight_h])))
        """

        def filter_out_ubiquitary_transmitters(radiomap_essentials,
                                               rss_ds_thsd):
            # filter out outlier (practically ubiquitary visible) transmitters by RSS distribution score
            tx_ds = {
                tx_id: np.sum([(v["min"] - v["max"]) * v["k"]
                               for v in d["f_n_ps_param"].values()
                               ]) for tx_id, d in radiomap_essentials.items()
            }
            for tx_id in np.array(list(
                    tx_ds.keys()))[list(tx_ds.values()) -
                                   np.mean(list(tx_ds.values())) > rss_ds_thsd *
                                   np.std(list(tx_ds.values()), ddof=1)]:
                del radiomap_essentials[tx_id]
            return radiomap_essentials

        def filter_strongest_point_transmitters(radiomap_essentials, n_ref_tx):
            tx_pwl_df = to_tx_pwl_df(radiomap_essentials)

            filtered_tx_pwl_df = pd.concat([
                p_df.sort_values("weight", ascending=False).head(n_ref_tx)
                for point_id, p_df in tx_pwl_df.groupby("point_id")
            ])
            for tx, pwl_df in filtered_tx_pwl_df.groupby("transmitter_id"):
                pwl_df.drop('transmitter_id', axis=1, inplace=True)
                radiomap_essentials[tx]["point_weight_list"] = pwl_df

            return radiomap_essentials

        def calc_center_distance(norm_rssi_val):
            return transmitter_center_distance(f_n_ps_param, norm_rssi_val, settings["spread_dim"],
                                               settings["extrapolate_n_rp"])

        # calculate histogram parameters and histogram CDF function
        hist_params, hist_cdf = hist_features(fpp_stats)

        # filter transmitters with very low coverage
        fpp_tx_thsd = np.max((np.percentile([
            len(fpp_tx) for tx_id, fpp_tx in fpp_stats.groupby("transmitter_id")
        ], settings["fpp_tx_thsd_perc"]), settings["fpp_tx_thsd_n"],
                              MIN_FPP_TX_THSD_N))

        # Loop over all radio map data grouped by transmitter_id
        tx_points_norm_rss = {}
        for tx_id, fpp_tx in fpp_stats.groupby("transmitter_id"):
            point_ids = fpp_tx["point_id"]
            if len(point_ids) < fpp_tx_thsd:
                continue

            # Create weight for reference-points
            mrssi = fpp_tx["mean_rssi"].values
            ps_nrss = hist_cdf(mrssi, *hist_params)

            p_sort = np.argsort(ps_nrss)
            tx_points_norm_rss[tx_id] = list(
                zip(point_ids.values[p_sort], ps_nrss[p_sort]))

        radiomap_essentials = {}
        for tx_id, tx_ps_nrrs in tx_points_norm_rss.items():
            nrss, n_ps = np.array(
                list(
                    zip(*[(norm_rssi, len(tx_ps_nrrs) - i)
                          for i, (point_id, norm_rssi)
                          in enumerate(tx_ps_nrrs)])))
            f_n_ps_param = triple_linear_regression(nrss, n_ps, TLR_HIGH_PERC)
            tcd0 = calc_center_distance(0.)
            pw_list = pd.DataFrame([
                (point_id, tcd0 - calc_center_distance(norm_rssi))
                for point_id, norm_rssi in tx_ps_nrrs],
                columns=["point_id", "weight"])

            if settings["locator_type"] == "FLIP":
                pw_list = pw_list[["point_id", "weight"]]

            radiomap_essentials[tx_id] = {
                "f_n_ps_param": f_n_ps_param,
                "point_weight_list": pw_list
            }

        # filter out outlier transmitters
        radiomap_essentials = filter_out_ubiquitary_transmitters(
            radiomap_essentials, settings["rss_ds_thsd"])

        # filter out less relevant transmitters per reference point
        radiomap_essentials = filter_strongest_point_transmitters(
            radiomap_essentials, settings["n_ref_tx"])

        return radiomap_essentials

    if settings is None:
        settings = FLIP_MAP_SETTINGS

    # changes to convert fingerprint_sdf (our code) to fpp_stats (Reini's)
    # rename columns
    fpp_stats.rename(columns={"RSSI_MEAN": "mean_rssi",
                              "TRANSMITTER_ID": "transmitter_id",
                              "POINT_GUID": "point_id",
                              "LEVEL_ID": "floor_level"},
                     inplace=True)
    # transform to Projected Reference System (3857 - Web Mercator)
    fpp_stats.spatial.project(spatial_reference=3857)
    # create 'x' and 'y' columns
    fpp_stats[['x', 'y']] = fpp_stats.SHAPE.apply(lambda s: [s.x, s.y]).tolist()

    fpp_stats["building_id"] = -1
    out = {}

    # split the fingerprint points based on the transmitter type BLE Beacon: 0 / Wi-Fi router: 1
    fpp_stats_wifi = fpp_stats[fpp_stats[c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_TYPE.name] == 1]
    fpp_stats_ble = fpp_stats[fpp_stats[c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_TYPE.name] == 0]

    xyfb_points_list = []
    out["rp_max_score"] = {}
    out["radiomap_essentials"] = {}

    if not fpp_stats_ble.empty:
        # BLE settings (default)
        settings["n_ref_tx"] = 15
        settings["n_obs_tx"] = 10

        vflip_radiomap_ble = radiomap_essentials(fpp_stats_ble, settings)
        xyfb_points_list.append(xyfb_points(fpp_stats_ble))
        out["rp_max_score"] = rp_max_score(vflip_radiomap_ble, settings)
        out["radiomap_essentials"] = vflip_radiomap_ble

    if not fpp_stats_wifi.empty:
        # Wi-Fi settings
        settings["n_ref_tx"] = 100
        settings["n_obs_tx"] = 80

        vflip_radiomap_wifi = radiomap_essentials(fpp_stats_wifi, settings)
        xyfb_points_list.append(xyfb_points(fpp_stats_wifi))
        out["rp_max_score"] = out["rp_max_score"] | rp_max_score(vflip_radiomap_wifi, settings)
        out["radiomap_essentials"] = out["radiomap_essentials"] | vflip_radiomap_wifi

    out["xyfb_points"] = pd.concat(xyfb_points_list)

    return out


# vflip_common.py
def transmitter_center_distance(f_n_ps_param: dict, norm_rssi: float, spread_dim: float,
                                extrapolate: bool) -> float:
    """
    Calculates the radio distance to the virtual transmitter center.

    Args:
        f_n_ps_param (dict): linear functions parameters for estimating number
            of points with stronger than norm_rssi reception (ref. generate_flip_map).
        norm_rssi (float): normalized RSSI.
        spread_dim (float): dimensions of point spreadity (2..3).
        extrapolate (bool): if set, extraplate est_n_ps if required,
            otherwise keep n_ps estimates based on experienced data.

    Returns:
        float: radio distance to the virtual transmitter center.
    """

    def est_n_ps():
        """
        Calculates the estimated number of reference points which have
        normalized RSSI of at least norm_rssi.

        Returns:
            float: estimated number of reference points.
        """

        if not extrapolate:
            params = f_n_ps_param["low"]
            if norm_rssi < params["min"]:
                return (-1. / params["min"]) * norm_rssi + (
                        params["k"] * params["min"] + params["d"] + 1)

        eff_f = deepcopy(f_n_ps_param)  # preserve original intervals
        eff_f["low"]["min"] = 0  # extrapolation down to 0
        eff_f["hig"]["max"] = 1  # max limit at 1

        for params in eff_f.values():
            if params["min"] <= norm_rssi <= params["max"]:
                return np.max((params["k"] * norm_rssi + params["d"], 0))

    return np.power(est_n_ps(), 1. / spread_dim)


# vflip_utils.py
def least_square_regression(x_vals: List[float], y_vals: List[float]) -> Tuple[float, float, float]:
    """
    Calculates the parameters of a linear regression by numpys least-square.

    Args:
        x_vals (list(float)): (independent) x-values.
        y_vals (list(float)): (dependent) y-values.

    Returns:
        linfunc_k (float): k parameter of fitted linear function.
        linfunc_d (float): d parameter of fitted linear function..
        residual (float): residual of linear function fitting.
    """
    mat = np.empty((len(x_vals), 2))
    mat[:, 0], mat[:, 1] = x_vals, 1
    (linfunc_k, linfunc_d), residual, _, _ = np.linalg.lstsq(mat,
                                                             y_vals,
                                                             rcond=-1)
    residual = residual[0] if len(residual) > 0 else None
    return linfunc_k, linfunc_d, residual


def triple_linear_regression(x_vals: List[float], y_vals: List[float], high_perc: float, steps: int = 100) -> Dict:
    """
    Approximation by triple linear regression (regression to 3 linear functions).
    It's a compromise between model accuracy and simplicity.

    Args:
        x_vals (list(float)): (independent) x-values.
        y_vals (list(float)): (dependent) y-values.
        high_perc (float):
            percentile of the start of the high segment.
        steps (int, optional):
            number of optimization steps. Defaults to 100.

    Returns:
        dict(low, med, hig): linear function parameters for each segment.
            Each segment contains dict(min, max, k, d),
            the segement range and linear function parameters.
    """
    min_x = np.min(x_vals)
    max_x = np.max(x_vals)
    if np.std(x_vals) < 1e-10:
        params = {"min": min_x, "max": max_x, "k": 0., "d": np.max(y_vals)}
        return {"low": params, "hig": params}

    # highest segment
    high_x = x_vals[int(len(y_vals) * high_perc / 100.)]
    part_x_vals = x_vals[x_vals >= high_x]
    part_y_vals = y_vals[x_vals >= high_x]
    linfunc_k3, linfunc_d3, _ = least_square_regression(part_x_vals,
                                                        part_y_vals)

    # lower segments
    residual_sum = sys.float_info.max
    opt_low_medium = None  # optimized low and medium part
    for split_x in np.linspace(min_x, high_x, steps):
        if split_x == min_x:
            continue

        # first
        part_x_vals = x_vals[x_vals <= split_x]
        part_y_vals = y_vals[x_vals <= split_x]
        linfunc_k1, linfunc_d1, residual_1 = least_square_regression(
            part_x_vals, part_y_vals)

        # second
        part_x_vals = x_vals[x_vals >= split_x]
        part_y_vals = y_vals[x_vals >= split_x]
        linfunc_k2, linfunc_d2, residual_2 = least_square_regression(
            part_x_vals, part_y_vals)

        if residual_1 is None or residual_2 is None:
            continue

        # save better solution
        if residual_1 + residual_2 < residual_sum:
            residual_sum = residual_1 + residual_2
            opt_low_medium = {
                "s12": split_x,
                "k1": linfunc_k1,
                "d1": linfunc_d1,
                "k2": linfunc_k2,
                "d2": linfunc_d2
            }

    return {
        "low": {
            "min": min_x,
            "max": opt_low_medium["s12"],
            "k": opt_low_medium["k1"],
            "d": opt_low_medium["d1"]
        },
        "med": {
            "min": opt_low_medium["s12"],
            "max": high_x,
            "k": opt_low_medium["k2"],
            "d": opt_low_medium["d2"]
        },
        "hig": {
            "min": high_x,
            "max": max_x,
            "k": linfunc_k3,
            "d": linfunc_d3
        }
    }


def rayleigh_cdf(samples: Union[float, List[float]], loc: float, scale: float) -> Union[float, List[float]]:
    """
    Calculates the cumulative distribution function value(s)
    based of given sample value(s).

    Args:
        samples: sample value or list of values.
        loc: location of rayleigh distribution (minimum value).
        scale: scale of rayleigh distribution (mode value).

    Returns:
        Rayleigh cdf value(s) of given samples.
    """
    clipped_samples = np.clip(samples, loc, np.inf)
    return 1. - np.exp(-(clipped_samples - loc) ** 2 / (2. * scale ** 2))


def rayleigh_fit(samples: List[float]) -> Tuple[float, float]:
    """
    Estimates the parameters of a rayleigh distribution based on sample set.

    Args:
        samples: list of sample values.

    Returns:
        loc: location of rayleigh distribution (minimum value).
        scale: scale of rayleigh distribution (mode value).

    """
    loc = np.min(samples)
    scale = np.sqrt(1. / (2 * len(samples)) * np.sum((samples - loc) ** 2))
    return loc, scale


def xyfb_points(fpp_stats: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts the positions of fingerprint points statistics.

    Args:
        fpp_stats: fingerprint points statistics (radiomap).
         (PD(point_id, x, y, floor_level, building_id,
                      transmitter_id, mean_rssi, std_rssi)):

    Returns:
        PD(point_id, x, y, floor_level, building_id):
            xy-floor-building point positions.
    """

    return fpp_stats.groupby("point_id", as_index=False)[[
        "point_id", "x", "y", "floor_level", "building_id"
    ]].apply(min)
