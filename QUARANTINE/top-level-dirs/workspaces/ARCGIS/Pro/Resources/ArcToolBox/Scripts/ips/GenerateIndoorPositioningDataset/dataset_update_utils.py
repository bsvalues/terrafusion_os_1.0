import indoorsdatapy.common.const.network_type as type
import ips.GenerateIndoorPositioningDataset.const as gipd_c
import ips.GenerateIndoorPositioningDataset.validation as gipd_v
import ips.GenerateIndoorPositioningFile.utils as gipf_u
import ips.const as c
import ips.utils as u
import ips.utils_db as u_db
import ips.validation as v
import pandas as pd
from arcpy._mp import Layer
from scipy.spatial.distance import cdist

# handy alias for the model to use
M = c.MODEL_LATEST


def filter_within_distance(sdf: pd.DataFrame, reference_sdf: pd.DataFrame, dist: float = 1.501):
    """Filters out of the spatial dataframe (sdf) all the rows whose geometry is further
    away than the given distance from the geometries in the reference dataframe

    Args:
        sdf: dataframe to be filtered
        reference_sdf: dataframe containing the reference geometries
        dist: the distance for the filter

    Returns:
        new sdf containing only the rows within the given distance from the reference geometries
    """

    filtered_sdfs = []
    for vo, recording_vo_sdf_legacy in reference_sdf.groupby(by=c.VERTICAL_ORDER):
        buffered_recording_series = recording_vo_sdf_legacy.SHAPE.geom.buffer(dist)

        survey_fingerprint_vo_sdf = sdf[sdf[c.VERTICAL_ORDER] == vo]
        # NOTE that there is a bug in the spatial.join method, the index must have incremental numbers!
        survey_fingerprint_vo_sdf = survey_fingerprint_vo_sdf.reset_index(drop=True)
        filtered_survey_fingerprint_vo_sdf = survey_fingerprint_vo_sdf.spatial.join(
            pd.DataFrame(buffered_recording_series.values, columns=['SHAPE']), op='within')
        # NOTE: the spatial.join performs proper "join", so the one fingerprint may appear more
        # than once if it is within multiple recording buffers. Need to remove duplicates!
        filtered_survey_fingerprint_vo_sdf = filtered_survey_fingerprint_vo_sdf.drop_duplicates(
            ['x', 'y', M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_ID.name])
        filtered_sdfs.append(filtered_survey_fingerprint_vo_sdf)

    return pd.concat(filtered_sdfs, ignore_index=True)


def blend_survey_data(base_point_sdf_legacy: pd.DataFrame,
                      base_signal_df: pd.DataFrame,
                      level_sdf: pd.DataFrame,
                      recording_sdf_legacy: pd.DataFrame) -> pd.DataFrame:
    """Function to blend in the survey based recordings to the existing dataset.

    Args:
        base_point_sdf_legacy: the point dataframe of the dataset to be updated
        base_signal_df: the signal dataframe of the dataset to be updated
        level_sdf: the input Level features dataframe
        recording_sdf_legacy: the input Recording features dataframes

    Raises:
        NotUpdatableDatasetError: when there are no fingerprints in the existing dataset that can be replaced by new
        ones based on the input Level and Recording features

    Returns:
        The output fingerprint dataframe.

    """
    field_dict = {
        'vertical_order': c.VERTICAL_ORDER,
        'rssi_mean': M.IPS_POSITIONING_SIGNALS.FIELDS.RSSI_MEAN.name,
        'transmitter_id': M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_ID.name,
        'transmitter_type': M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_TYPE.name
    }

    # signals come from a DB, so we need to revert the transmitter_type to the legacy values
    base_signal_df[M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_TYPE.name] = base_signal_df[
        M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_TYPE.name].apply(lambda tt: type.IBEACON if tt == 0 else type.WLAN)

    # create x and y columns if they don't exist
    if 'x' not in base_point_sdf_legacy.columns or 'y' not in base_point_sdf_legacy.columns:
        base_point_sdf_legacy[['x', 'y']] = base_point_sdf_legacy.SHAPE.apply(
            lambda s: pd.Series([s['x'], s['y']]))

    # add a point_id field that can be the same as the OBJECTID
    base_point_sdf_legacy = base_point_sdf_legacy.rename(columns={c.OBJECT_ID_FIELD_NAME: 'point_id'})

    # create a merged fingerprint dataframe (points and signals)
    base_fingerprint_sdf_legacy = base_point_sdf_legacy.merge(
        base_signal_df, left_on=c.GLOBAL_ID_FIELD_NAME,
        right_on=M.IPS_POSITIONING_SIGNALS.FIELDS.POINT_GUID.name,
        suffixes=('_x', ''))
    base_fingerprint_sdf_legacy.drop(list(base_fingerprint_sdf_legacy.filter(regex='_x$')), axis=1, inplace=True)

    # choose any of the existing fingerprint points as the hex grid origin
    grid_origin = base_point_sdf_legacy.iloc[0][['x', 'y']].values

    # generate fingerprints from the given recordings (in legacy coords)
    survey_fingerprint_df_legacy = gipf_u.create_fingerprints_from_recordings(
        recording_df=recording_sdf_legacy,
        grid_origin=grid_origin)

    survey_fingerprint_df_legacy[M.IPS_POSITIONING_SIGNALS.FIELDS.GENERATION_METHOD.name] = \
        M.DOM_IPS_GENERATION_METHOD.VALUES.SURVEY_BASED.value

    # rename the columns for convenience
    survey_fingerprint_df_legacy = survey_fingerprint_df_legacy.rename(columns=field_dict)

    # convert to spatial df
    survey_fingerprint_sdf_legacy = pd.DataFrame.spatial.from_xy(
        df=survey_fingerprint_df_legacy,
        x_column='x', y_column='y', sr=3857)

    # GIPF produces fingerprints up to 3m from the recording trajectories.
    # however, reinii found out that it is best to updated only fingerprints within 1.5 m from the recordings
    # so, filter the fingerprints outside a 1.5 m buffer
    survey_fingerprint_sdf_legacy = filter_within_distance(
        sdf=survey_fingerprint_sdf_legacy,
        reference_sdf=recording_sdf_legacy,
        dist=1.501)

    # split fingerprints into points and radios. related via point_id
    # we need to make sure that the point_ids of the survey fingerprints do not clash with the base ones
    start_point_id = 1 + max(base_point_sdf_legacy['point_id'])
    survey_fingerprint_sdf_legacy.insert(
        loc=0,
        column='point_id',
        value=survey_fingerprint_sdf_legacy.set_index(
            ['x', 'y', c.VERTICAL_ORDER]).index.factorize()[0] + start_point_id)

    # extract the point dataframe
    survey_point_sdf_legacy = survey_fingerprint_sdf_legacy[
        ['point_id', 'x', 'y', c.VERTICAL_ORDER]].drop_duplicates('point_id')

    # only keep fields that we care about
    base_fingerprint_sdf_legacy = base_fingerprint_sdf_legacy[
        ['point_id',
         'x', 'y', c.VERTICAL_ORDER,
         M.IPS_POSITIONING_SIGNALS.FIELDS.RSSI_MEAN.name,
         M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_ID.name,
         M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_TYPE.name,
         M.IPS_POSITIONING_SIGNALS.FIELDS.GENERATION_METHOD.name]]

    survey_fingerprint_sdf_legacy = survey_fingerprint_sdf_legacy[
        ['point_id',
         'x', 'y',
         c.VERTICAL_ORDER,
         M.IPS_POSITIONING_SIGNALS.FIELDS.RSSI_MEAN.name,
         M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_ID.name,
         M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_TYPE.name,
         M.IPS_POSITIONING_SIGNALS.FIELDS.GENERATION_METHOD.name
         ]]

    # one fingerprint point can be associated to BLE-only or WiFi-only transmitter type signals (not a mix)
    # So, let's extract this info and put it in the point dataframes
    transmitter_type = M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_TYPE.name

    base_grouper = base_fingerprint_sdf_legacy.groupby('point_id')
    # NOTE: for whatever reason I have to convert the series returned by the .apply() into a list,
    # otherwise the first value is returned as a NaN! Transforming it to a list fixes the problem
    # NOTE 2: while a fingerprint point should be associated with radios of a unique type, we decided to
    # also cover the case where it is associated with mix (possibly happening if the user messes up
    # with the data manually or in extreme cases where two adjacent facilities were surveyed for BLE
    # and WiFi and some mixed fingerprints have been generated with a Survey-based GIPD run right in
    # between them). If we find mixed radios for one point, we denote it by the special value -1,
    # and we treat those differently later on. Basically, we always want to allow an update for mixed
    # points. Because this should not happen, so if we have new data that we can use to replace the mix, let's do it!
    base_point_sdf_legacy[transmitter_type] = base_grouper.apply(
        lambda g: g[transmitter_type].iloc[0] if g[transmitter_type].nunique() == 1 else -1).tolist()

    survey_grouper = survey_fingerprint_sdf_legacy.groupby('point_id')
    survey_point_sdf_legacy[transmitter_type] = survey_grouper.apply(
        lambda g: g[transmitter_type].iloc[0] if g[transmitter_type].nunique() == 1 else -1).tolist()

    # a boolean value set to True if at least one fingerprint has been updated
    update_flag = False

    for vo in level_sdf[c.VERTICAL_ORDER].unique():
        # TODO: add a yield for the generator
        base_point_sdf_legacy_floor = base_point_sdf_legacy[base_point_sdf_legacy[c.VERTICAL_ORDER] == vo]
        survey_point_sdf_legacy_floor = survey_point_sdf_legacy[survey_point_sdf_legacy[c.VERTICAL_ORDER] == vo]
        survey_fingerprint_sdf_legacy_floor = survey_fingerprint_sdf_legacy[
            survey_fingerprint_sdf_legacy[c.VERTICAL_ORDER] == vo]

        # find the indices of the base fingerprints matching the recording fingerprints
        distances_floor = cdist(base_point_sdf_legacy_floor[['x', 'y']], survey_point_sdf_legacy_floor[['x', 'y']])

        # Find indices where the distance is smaller than 0.001
        base_iloc_matches_floor, survey_iloc_matches_floor = (distances_floor < 0.001).nonzero()

        # filter out non-matching points and sort the new dfs such that the matching points have the same index
        base_point_matched_floor = base_point_sdf_legacy_floor.iloc[
            base_iloc_matches_floor].reset_index(drop=True)
        survey_point_matched_floor = survey_point_sdf_legacy_floor.iloc[
            survey_iloc_matches_floor].reset_index(drop=True)

        # create a boolean mask denoting if the matching points have the same transmitter_type value
        # we do not allow updates with data of a different transmitter type (this is to prevent the user
        # from creating a mixed BLE/WiFi positioning dataset for the same facility)
        same_tx_type = base_point_matched_floor[transmitter_type] == survey_point_matched_floor[transmitter_type]

        # create a mask denoting if the base matching base point have a mixed set of signals (denote -1)
        # this should never happen, but if it is the case, it is better to replace (update)
        # this point than leave it as is
        mixed_tx_type = base_point_matched_floor[transmitter_type] == -1

        # we only want to update base points whose transmitter type is the same as that of
        # the matching survey point OR the base point has a mixed transmitter type
        updatable = same_tx_type | mixed_tx_type

        if not updatable.empty:
            # at least one update is going to take place
            update_flag = True

        # select only the updatable points (base and survey)
        base_point_matched_floor = base_point_matched_floor[updatable].reset_index(drop=True)
        survey_point_matched_floor = survey_point_matched_floor[updatable].reset_index(drop=True)

        # create matching masks for the fingerprint dataframes
        base_fingerprint_match_mask_floor = base_fingerprint_sdf_legacy['point_id'].isin(
            base_point_matched_floor['point_id'])
        survey_fingerprint_match_mask_floor = survey_fingerprint_sdf_legacy_floor['point_id'].isin(
            survey_point_matched_floor['point_id'])

        # REPLACE ONLY THE MATCHING FPPS (DO NOT ADD THE OTHER FPPS FROM SURVEY)
        base_fingerprint_sdf_legacy = pd.concat(
            [base_fingerprint_sdf_legacy[~base_fingerprint_match_mask_floor],
             survey_fingerprint_sdf_legacy_floor[survey_fingerprint_match_mask_floor]],
            ignore_index=True)

    if not update_flag:
        raise gipd_v.NotUpdatableDatasetError

    base_fingerprint_sdf_legacy = base_fingerprint_sdf_legacy.rename(columns={v: k for k, v in field_dict.items()})
    return base_fingerprint_sdf_legacy
