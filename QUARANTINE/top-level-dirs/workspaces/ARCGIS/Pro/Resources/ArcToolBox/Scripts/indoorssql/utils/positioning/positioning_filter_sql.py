import logging
import os
from argparse import ArgumentParser
import pandas as pd
from indoorssql.core.df_sql_util import sql2df, dto2sql

logger = logging.getLogger(__name__)


def filter_transmitters(positioning_dfs, transmitter_ids):
    """filters radio data by transmitter

    Filtering happens in place, data associated with transmitter ids
    not on the list are dropped

    :param positioning_dfs: dict of dataframes
    :param transmitter_ids: iterable
        transmitter ids of data to be kept (allowlist)
        ids must be in form of <type>_<name>
        5_F7826DA6-4FA2-4E98-8024-BC5B71E0893E.37549.65327
    :return: (network_to_delete, network_metadata_to_delete, fingerprint_to_delete, statistic_to_delete)
        ids of data to delete grouped in sets
    """
    network_to_delete = set()
    network_metadata_to_delete = set()
    fingerprint_to_delete = set()
    statistic_to_delete = set()
    # the following code was copied and modified from
    # https://bitbucket.org/indoors/indoors-sql/src/f0fd758bb2cc055522d5e937f20ac1f8c7306d3b/indoorssql/core/idm/slam_idm_update.py
    # https://bitbucket.org/indoors/indoors-sql/src/f0fd758bb2cc055522d5e937f20ac1f8c7306d3b/indoorssql/core/idm/idm_update_core.py
    for network_id, building_id, bssid, channel, name, network_type, refresh_rate in positioning_dfs[
            'network'].values:
        if f"{network_type}_{name}" not in transmitter_ids:
            network_to_delete.add(network_id)
            index = positioning_dfs['network'][positioning_dfs['network']['id']
                                               == network_id].index
            positioning_dfs['network'].drop(index, inplace=True)
    for meta_id, network_id, name, value in positioning_dfs[
            'networkmetadata'].values:
        if network_id in network_to_delete:
            network_metadata_to_delete.add(meta_id)
            index = positioning_dfs['networkmetadata'][
                positioning_dfs['networkmetadata']['id'] == meta_id].index
            positioning_dfs['networkmetadata'].drop(index, inplace=True)
    for fingerprint_id, network_id, point_id in positioning_dfs[
            'fingerprint'].values:
        if network_id in network_to_delete:
            fingerprint_to_delete.add(fingerprint_id)
            index = positioning_dfs['fingerprint'][
                positioning_dfs['fingerprint']['id'] == fingerprint_id].index
            positioning_dfs['fingerprint'].drop(index, inplace=True)
    for statistic_id, device_id, fingerprint_id, amount, mean, variance in positioning_dfs[
            'statistic'].values:
        if fingerprint_id in fingerprint_to_delete:
            statistic_to_delete.add(statistic_id)
            index = positioning_dfs['statistic'][positioning_dfs['statistic']
                                                 ['id'] == statistic_id].index
            positioning_dfs['statistic'].drop(index, inplace=True)
    return network_to_delete, network_metadata_to_delete, fingerprint_to_delete, statistic_to_delete


def filter_positioning_from_database(positioning_db_in, beacon_list,
                                     positioning_db_out):
    """filters positioning based on whitelist of beacons

    :param positioning_db_in: str
        file path of input positioning database
    :param beacon_list: str
        file path of input beacon list
    :param positioning_db_out: strA
        file path of output file
    :return: positioning_db_out:str
        file path of output file
    """

    in_dir_name, in_file_name = os.path.split(positioning_db_in)
    out_dir_name, out_file_name = os.path.split(positioning_db_out)
    logger.info('staring filter process')
    logger.info(f'input db: {in_file_name}')
    logger.info(f'output db: {out_file_name}')

    positioning_dfs = sql2df(f'sqlite:///{positioning_db_in}')

    beacon_list = pd.read_csv(beacon_list)
    transmiter_ids = beacon_list['transmitter_id']
    network_deleted, network_metadata_deleted, fingerprint_deleted, statistic_deleted = filter_transmitters(
        positioning_dfs=positioning_dfs, transmitter_ids=transmiter_ids)

    logger.info(f'deleted network: {network_deleted}')
    logger.info(f'deleted network metadata: {network_metadata_deleted}')
    logger.info(f'deleted fingerprint: {fingerprint_deleted}')
    logger.info(f'deleted statistic: {statistic_deleted}')
    logger.info('\n\n')
    dto2sql(positioning_dfs, f'sqlite:///{positioning_db_out}')
    return positioning_db_out


def main():
    """main function"""
    parser = ArgumentParser()
    parser.add_argument('input_folder', help='input db path')
    parser.add_argument('beacons_list', help='input beacon list path')
    parser.add_argument('output_folder', help='output file')
    args = parser.parse_args()
    input_folder = args.input_folder
    beacon_file = args.beacons
    output_folder = args.output_folder
    filenames = next(os.walk(args.input_folder), (None, None, []))[2]
    if not os.path.isdir(output_folder):
        os.mkdir(output_folder)
    for filename in filenames:
        input_file = os.path.join(input_folder, filename)
        output_file = os.path.join(output_folder, filename)
        filter_positioning_from_database(input_file, beacon_file, output_file)
    return


if __name__ == "__main__":
    main()
