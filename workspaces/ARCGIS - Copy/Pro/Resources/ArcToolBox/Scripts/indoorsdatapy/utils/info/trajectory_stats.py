import json
import logging
import operator
import os
from multiprocessing import Pool, cpu_count

import pandas as pd
from indoorsdatapy.access.slam_trajectory import load_slam_trajectory
from indoorsdatapy.access.slam_trajectory import loop_trajectories
from indoorsdatapy.common.cli import output_dir, custom_parser, slam_trajectory_dtos, input_dir
from indoorsdatapy.common.logging_setup import cli_logger

logger = logging.getLogger(__name__)


def load_traj(filenames):
    traj = list(loop_trajectories(filenames))
    tot = 0
    for f, t in zip(filenames, traj):
        tot += len(t)
        logger.info("File {}: {} positions".format(f, len(t)))
    logger.info("Total pos: {}".format(tot))
    return traj


def get_filenames(directory, job):
    pbfiles = {}
    subs = []
    for dir_path, dirnames, filenames in os.walk(directory):
        subs += [dirname for dirname in dirnames if job in dirname]
    for sub in subs:
        for dir_path, dirnames, filenames in os.walk("{}/{}".format(
                directory, sub)):
            pbfiles[sub] = [
                "{}/{}".format(
                    dir_path, filename) for filename in filenames]
    return pbfiles


def proc_info(tfile):
    """GET file info

    The trajectory has several tables
    transmitter: ssid
    estimates: transmitter mean var weight key
    position: t x y floor sx2 sy2 sxy type accuracy delay

    Parameters
    ----------
    tfile : str
        input trajectory filename
    """
    with open(tfile, "rb") as tf:
        traj = load_slam_trajectory(tf)
        estimates = traj["estimates"]
        position = traj["position"]
        tx = traj["transmitters"]
        t = position["t"]
        tmin = t.min()
        tmax = t.max()
        return {
            "file": tfile,
            "building": traj["building"],
            "recording": traj["recording"],
            "ntx": len(tx.index),
            "nest": len(estimates.index),
            "npos": len(position.index),
            "m_sxy": position["sxy"].mean(),
            "s_sxy": position["sxy"].std(),
            "tmin": tmin,
            "tmax": tmax
        }
    raise IOError("Failed open file {}".format(tfile))


def proc_transmitters(tfile):
    with open(tfile, "rb") as tf:
        traj = load_slam_trajectory(tf)
        tx = traj["transmitters"]["ssid"].values.tolist()
        return {
            "file": str(tfile),
            "ntx": len(tx),
            "transmitters": tx}
    raise IOError("Failed open file {}".format(tfile))


def proc_meta(tfile):
    with open(tfile, "rb") as tf:
        traj = load_slam_trajectory(tf)
        res = traj["meta"].to_dict()
        res["file"] = tfile
        return res

    raise IOError("Failed open file {}".format(tfile))


def cached_pool_proc(files, proc, cache=None, pool=None):
    """Multiprocess proc on each of files unless result already cached


    Parameters
    files : list(ste)
        Name of input files
    proc : function
        Function to run on each file
    cache : str, optional
        Cache file, if None it will be ignored
    pool : multiprocessing.Pool, optional
        Process pool for faster execution
        If None built in map will be used

    Returns
    -------
    TYPE
        Description
    """
    if cache is not None and os.path.isfile(cache):
        logger.info("Using cached txinfo {}".format(cache))
        with open(cache, "r") as cfile:
            return json.load(cfile)
    logger.info("Processing {} files".format(len(files)))
    if pool is not None:
        logger.info("Processing with multiprocessing pool")
        data = pool.imap_unordered(proc, files)
    else:
        logger.info("Processing without multiprocessing pool")
        data = map(proc, files)
    data = list(data)
    if cache is not None:
        logger.info("Caching cache {}".format(cache))
        with open(cache, 'w') as outfile:
            json.dump(data, outfile)
    logger.info("Done processing")
    return data


def time_gap(df_info):
    sdf = df_info.sort_values(by="tmin", ascending=True)
    tmin = sdf["tmin"].min()
    sdf["tmin"] -= tmin
    sdf["tmax"] -= tmin
    sdf['delta'] = sdf['tmin'][1:] - sdf['tmax'].values[:-1]
    sdf["dur"] = sdf["tmax"] - sdf["tmin"]
    return sdf[["file", "tmin", "tmax", "delta", "dur"]]


def main():
    pd.set_option("display.max_rows", 300)
    pd.set_option("display.max_columns", 50)
    pd.set_option("display.max_colwidth", 500)
    pd.set_option('precision', 2)

    args = [output_dir, slam_trajectory_dtos, input_dir]
    parser = custom_parser(args, description="data stats ")
    parser.add_argument(
        "-j", "--job", metavar="SUBSTRING",
        type=str)

    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    if parsed.job:
        files = get_filenames(parsed.input_dir, parsed.job)[parsed.job]
    else:
        files = parsed.slam_trajectory_dtos

    pool = Pool(processes=max(1, cpu_count() - 1))
    txtx = cached_pool_proc(files, proc_transmitters, pool=pool)
    info = cached_pool_proc(files, proc_info, pool=pool)
    meta = cached_pool_proc(files, proc_meta, pool=pool)
    pool.close()

    logger.info("Files ordered by number of positions")
    for tx in sorted(txtx, key=operator.itemgetter("ntx")):
        logger.info("{}:\t{}".format(tx["file"], tx["ntx"]))
    info_df = pd.DataFrame(list(info))
    logger.info("Time gap between recordings\n{}".format(time_gap(info_df)))

    meta_df = pd.DataFrame(meta)
    logger.info("Stats\n{}".format(meta_df[[
        "file", "nest", "npos", "ntx", "m_sxy", "s_sxy"]]))


if __name__ == '__main__':
    main()
