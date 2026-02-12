"""
Script removes duplicated network of same wifi access point.
usage: network_similarity.py [-h] [-R DTOS [DTOS ...]] [-s SETTINGS_JSON] -d
                             OUTPUT_DIR [--verbose] [--quiet] [--overwrite]

__main__ - Description

optional arguments:
  -h, --help            show this help message and exit
  -R DTOS [DTOS ...], --recording_dtos DTOS [DTOS ...]
                        Path of recordings dto(s)
  -s SETTINGS_JSON, --settings SETTINGS_JSON
                        Settings (json string)
  -d OUTPUT_DIR, --output_dir OUTPUT_DIR
                        Output dir destination
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH

"""
# !/usr/bin/env python


import os
import shutil
import warnings
from collections import defaultdict
from logging import getLogger

import numpy as np
import pandas as pd
from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.common.cli import (custom_parser, settings,
                                      recording_dtos, output_dir)
from indoorsdatapy.common.const.network_type import WLAN
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.common.utils import get_settings
from scipy.stats.stats import pearsonr

DEFAULT_SETTINGS = dict(invisible_rssi=-100,
                        scan_time=0.05,  # rssi if the network was not visible
                        min_rssi_mean=-95,  # min rssi mean to get compared
                        min_intersections=5,  # min overlapped observations
                        significance=0.8,  # min correlation
                        max_mac_diff=4,
                        # max difference between to mac addresses to upgrade significance
                        significance_addon_mac=0.2,
                        # this number is added to the significance if the mac address is similar'
                        radio_type=WLAN
                        )

logger = getLogger(__name__)


def mac(i):
    return hex(i).replace('0x', '').replace('L', '').zfill(12)


def get_networks(radios):
    return radios['bssid'].unique()


def union(iterable):
    result = set([])
    for i in iterable:
        result.update(i)
    return result


def scan(radios, scan_time):
    last_t = None
    last_i = None
    for i, row in radios.iterrows():
        if last_t is None or row['t'] - last_t > scan_time:
            if not last_t is None:
                yield radios.iloc[last_i:i]
            last_t = row['t']
            last_i = i


def intersect(a, b, nan_value, min_intersections):
    index_a = ~np.isnan(a)
    index_b = ~np.isnan(b)

    intersections = np.sum(index_a & index_b)
    if intersections < min_intersections:
        return 0, None, None
    index = index_a | index_b
    a = a[index]
    b = b[index]
    a[np.isnan(a)] = nan_value
    b[np.isnan(b)] = nan_value
    return intersections, a, b


def corr2(a, b, nan_value, min_intersections, method='andi'):
    intersections, a, b = intersect(a, b, nan_value, min_intersections)
    if intersections == 0:
        return 0.0

    if method == 'pearson':
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', category=RuntimeWarning)
            c = pearsonr(a, b)[0]
        if np.isnan(c): c = 0
    elif method == 'andi':
        mean = abs((a - b).mean())
        std = (a - b).std()
        c = np.sqrt(np.exp(-mean / 10) * np.exp(-std / 10))

    return c


def corr(df, nan_value, min_intersections, method='andi'):
    result = np.zeros((len(df.columns), len(df.columns)))
    columns = len(df.columns)
    matrx = df.values
    for col in range(columns):
        for row in range(col, columns):
            if col == row:
                result[col, row] = 1.0
                continue
            c = corr2(matrx[:, col], matrx[:, row],
                      nan_value, min_intersections, method=method)
            result[col, row] = c
            result[row, col] = c

    return pd.DataFrame(result, index=df.columns, columns=df.columns)


def main():
    args = [recording_dtos, settings, output_dir]
    parser = custom_parser(
        args, description="{} - Description ".format(__name__))
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)
    setting = get_settings(parsed.settings, DEFAULT_SETTINGS)

    radios = [RecordingAccess(rec, ['radios']).radio_with_type(setting['radio_type'])
              for rec in parsed.recording_dtos]

    logger.info('Loaded %s of recordings' % len(radios))
    networks = union((get_networks(r) for r in radios))
    logger.info('Unique networks %s' % len(networks))
    network_scans = defaultdict(list)
    for r in radios:
        for s in scan(r, setting['scan_time']):
            times = []
            networks_copy = networks.copy()
            for i, row in s.iterrows():
                # append just once from scan even if occurs more times
                if row['bssid'] not in times:
                    network_scans[row['bssid']].append(row['rssi'])
                    networks_copy.remove(row['bssid'])
                    times.append(row['bssid'])

            for n in networks_copy:
                network_scans[n].append(float('nan'))

    network_scans_df = pd.DataFrame(network_scans)
    logger.info("Network scans matrix %s" % str(network_scans_df.shape))
    if network_scans_df.empty:
        logger.info(
            "No networks of radio type < %s > found" % setting['radio_type'])
        logger.info(
            "copy unchanged files to the destination %s" % parsed.output_dir)
        for rec in parsed.recording_dtos:
            shutil.copy(rec, parsed.output_dir)
        return

    network_filter = network_scans_df.mean() >= setting['min_rssi_mean']
    logger.info("dead networks%s" % str(
        network_scans_df.columns[~network_filter].tolist()))
    network_scans_df = network_scans_df.loc[:, network_filter]

    logger.info('Running correlation...')
    networks_corr = corr(network_scans_df, setting['invisible_rssi'],
                         setting['min_intersections'], method='andi')
    logger.info('Correlation finished...')

    similar_networks = []
    for i, (n, row) in enumerate(networks_corr.iterrows()):
        row = row[i + 1:]
        for nn, s in row.iteritems():
            similar_mac = False
            if abs(n - nn) <= setting['max_mac_diff']:
                s += setting['significance_addon_mac']
                similar_mac = True
            if s > 1:
                s = 1.0
            if s >= setting['significance']:
                similar_networks.append(((n, nn), s, similar_mac))
    similar_networks.sort(key=lambda x: x[1], reverse=True)

    to_remove = []
    for s in similar_networks:
        to_remove.append(s[0][0])
        logger.info(s)

    if not os.path.isdir(parsed.output_dir):
        os.makedirs(parsed.output_dir)

    if parsed.output_dir:
        logger.info('Saving filtered recordings...')
        for rec in parsed.recording_dtos:
            access = RecordingAccess(rec, ['radios'])
            len_before = len(access['radios'].index)
            # remove all type=wifi and "similar networks"
            access['radios'] = access['radios'][(~access['radios']['bssid'].isin(
                to_remove) & (access['radios']['type'] == setting['radio_type']))]
            logger.info("Filtered networks %s" % len(
                access['radios'].index - len_before))
            path = os.path.join(parsed.output_dir, os.path.basename(rec))
            with open(path, 'wb') as pb_out:
                logger.info('Saving recording to %s' % path)
                access.update_pb(access, pb_out)


if __name__ == '__main__':
    main()
