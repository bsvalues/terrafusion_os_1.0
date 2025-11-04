#!/usr/bin/env python
# # -*- coding: utf-8 -*-
"""Resample json recording


resample resamples a single dataframe to constant sample distance delta_t,
starting at time t0. Run as script to resample json files directly.

Example:

    Resample tables accelerations, gyros and magnetics in all gzipped json files in json/ directory to 1./0.05 Hz

    python resample_json.py -d -m -p resampled_ --delta_t 0.05 --tables accelerations gyros magnetics \
        -i json/*.json.gz




usage: resample_json.py [-h] [-p PREFIX] --tables TABLES [TABLES ...] [-z]
                        [-s] [-n] [-m] [-t DELTA_T] [-d] [-v]
                        json [json ...]

Recording json resampler

positional arguments:
  json                  json files to convert

optional arguments:
  -h, --help            show this help message and exit
  -p PREFIX, --prefix PREFIX
                        prepend this string to each output filename
  --tables TABLES [TABLES ...]
                        List tables to resample
  -z, --gzip            if set gzip output
  -s, --std             if set store standard deviations
  -n, --num             if set store number of inputs per output sample
  -m, --multiprocessing
                        if set process files in parallell
  -t DELTA_T, --delta-t DELTA_T
                        time between samples
  -d, --debug           Print lots of debugging statements
  -v, --verbose         Be verbose
"""
import argparse
import functools
import logging
import multiprocessing
import os

import numpy as np
import pandas as pd
from indoorsdatapy.common.json_utils import load_json, save_json

logger = logging.getLogger(__name__)


def resample(df, t0, delta_t, do_std, do_n):
    """
    Resample sensor data frame to samples every delta_t starting at t0

    NOTE: even empty samples will be created (with None data)

    :param df: (pd.DataFrame) input data
    :param t0: (float) starting time
    :param delta_t: (float) time between samples
    :param do_std: (bool) if true add standard deviation columns
    :param do_n: (bool) if true add number of samples column
    :return (pd.DataFrame): resampled data with t, x, y, z, sx, sy, sz
    """
    n0 = len(df.index)
    assert "t" in df, "No time column!"
    assert "x" in df, "No x column!"
    assert "y" in df, "No y column!"
    assert "z" in df, "No z column!"
    tcurr = t0
    curr = []
    resampled = []
    for i, r in df.iterrows():
        while tcurr < r.t:
            n = len(curr)
            avg = (None, None, None) if n == 0 else np.average(curr, axis=0)
            sample = {
                "t": tcurr,
                "x": avg[0],
                "y": avg[1],
                "z": avg[2]}
            if do_std:
                std = (None, None, None) if n <= 1 else np.std(curr, axis=0)
                sample.update({
                    "sx": std[0],
                    "sy": std[1],
                    "sz": std[2]})
            if do_n:
                sample.update({"n": n})
            resampled.append(sample)
            tcurr += delta_t
            curr = []
        curr.append((r.x, r.y, r.z))
    logger.debug("Resampled from {} to {} rows.".format(n0, len(resampled)))
    return pd.DataFrame(resampled)


def proc_file(infile, args):
    data = load_json(infile)
    for table in args.tables:
        if table not in data:
            raise ValueError(
                "No such table {} in {}. Try one of {}".
                    format(table, infile, data.keys()))

    t0 = min(data[t]["t"].min() for t in args.tables)
    for table in args.tables:
        logger.debug("Resampling {} table {}".format(infile, table))
        data[table] = resample(
            df=data[table],
            t0=t0,
            delta_t=args.delta_t,
            do_std=args.std,
            do_n=args.num)

    save_json(
        pd_dict=data,
        json_file=os.path.join(
            os.path.dirname(infile),
            "{}{}".format(args.prefix, os.path.basename(infile))),
        gz=args.gzip)


def main(args):
    logger.info("Resampling {} inputs to delta_t {}".format(
        len(args.inputs), args.delta_t))

    if args.multiprocessing:
        ncpu = max(multiprocessing.cpu_count() - 1, 1)
        logger.info("Processing in parallel with {} cores.".format(ncpu))
        pool = multiprocessing.Pool(ncpu)
        proc = functools.partial(proc_file, args=args)
        pool.map(proc, args.inputs)
    else:
        for i, infile in enumerate(args.inputs):
            logger.info(
                "Resampling {} ({}/{})".format(infile, i + 1, len(args.inputs)))
            proc_file(infile, args)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Recording json resampler')
    parser.add_argument(
        '-i',
        '--inputs',
        metavar='json',
        type=str,
        nargs='+',
        help='json files to convert')
    parser.add_argument(
        '-p',
        '--prefix',
        type=str,
        help="prepend this string to each output filename",
        default="resamp_")
    parser.add_argument(
        '--tables',
        nargs='+',
        type=str,
        help='List tables to resample',
        required=True)
    parser.add_argument(
        '-z',
        '--gzip',
        action="store_true",
        help="if set gzip output")
    parser.add_argument(
        '-s',
        '--std',
        action="store_true",
        help="if set store standard deviations")
    parser.add_argument(
        '-n',
        '--num',
        action="store_true",
        help="if set store number of inputs per output sample")
    parser.add_argument(
        '-m',
        '--multiprocessing',
        action="store_true",
        help="if set process files in parallell")
    parser.add_argument(
        '-t',
        '--delta-t',
        type=float,
        help="time between samples",
        default=0.05)
    parser.add_argument(
        '-d', '--debug',
        help="Print lots of debugging statements",
        action="store_const",
        dest="loglevel",
        const=logging.DEBUG,
        default=logging.WARNING)
    parser.add_argument(
        '-v', '--verbose',
        help="Be verbose",
        action="store_const",
        dest="loglevel",
        const=logging.INFO)
    parsed = parser.parse_args()
    logging.basicConfig(
        level=parsed.loglevel,
        format='%(asctime)s %(filename)s:%(funcName)s:%(lineno)d '
               '%(levelname)s:%(message)s')
    main(parsed)
