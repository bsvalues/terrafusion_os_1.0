from typing import Tuple, Generator

import arcpy
import ips.GenerateIndoorPositioningDataset.const as gipd_c
import ips.GenerateIndoorPositioningFile.validation as gipf_v
import ips.GenerateIndoorPositioningFileWithoutSurvey.const as gipfws_c
import ips.GenerateIndoorPositioningFileWithoutSurvey.validation as gipfws_v
import ips.const as c
import ips.utils as u
import ips.validation as v
import pandas as pd

# handy alias for the model to use
M = c.MODEL_LATEST


# Exception that will be raised when Indoor Positioning Points or Indoor Positioning Signals
# cannot be found in the target workspace
class MissingData(Exception):
    def __init__(self, param_name):
        self.param_name = param_name


# Exception that will be raised during GIPD-Update when Indoor Positioning Points / Signals are empty
class EmptyPositioningDataset(Exception):
    def __init__(self, param_name):
        self.param_name = param_name


class DatasetExtentExceedsMaxSize(Exception):
    pass


class NotUpdatableDatasetError(Exception):
    pass


def validate_attributes(recording_df: pd.DataFrame, recordings_fc,
                        level_df: pd.DataFrame, parameter_names_dict: dict) -> Generator[None, None, Tuple]:
    """Validate attributes of all input for Survey based input tool

    Args:
        recording_df: recording data frame
        recordings_fc: feature class containing the recordings'
        level_df: levels data frame
        parameter_names_dict: dictionary of parameter display name (used for messaging)

    Yields: None after every validation step

    Returns:
        (recordings dataframe, level dataframe)
         # Tuple of recording df, level df

    """
    # Pass the Dataframe to filter out the recordings with invalid attributes
    recording_df, _ = gipf_v.validate_attributes(recording_df=recording_df,
                                                 recordings_fc=recordings_fc,
                                                 ips_transition_df=None)
    yield

    # Pass levels dataframe to filter out the recordings with invalid attributes
    level_df = gipfws_v.validate_level_attributes(level_df=level_df,
                                                  level_param_name=parameter_names_dict[gipfws_c.LEVELS_PARAM])
    yield

    return recording_df, level_df


def cross_validate_attributes(recording_df: pd.DataFrame,
                              level_df: pd.DataFrame,
                              parameter_names_dict: dict) -> Generator[None, None, Tuple]:
    """
    cross validate dataframe attributes for generates an indoor positioning file with survey
    prepare input for process data

    Args:
        recording_df: Recordings dataframe
        level_df: Levels dataframe
        parameter_names_dict: dictionary for the parameter display names used for gp messages

    Returns:
        (recordings dataframe, level dataframe)
         # Tuple of recording_df, level_df

    """
    # --------------------------------------------------
    #        attribute cross-validation
    # --------------------------------------------------
    # Checks features (Recordings) against valid levels. Prints message about skipped Recordings
    recording_df = gipfws_v.validate_features_vs_levels(
        features_df=recording_df,
        features_param=parameter_names_dict[gipd_c.RECORDINGS_PARAM],
        skipping_message_id=250090, levels_df=level_df)
    yield

    # Check for sufficiency of data per valid level. Prints message about skipped Levels
    level_df = validate_level_x_recording(
        level_df=level_df,
        recording_df=recording_df,
        level_param=parameter_names_dict[gipfws_c.LEVELS_PARAM])
    yield

    return recording_df, level_df


def validate_level_x_recording(level_df: pd.DataFrame,
                               recording_df: pd.DataFrame,
                               level_param: str) -> pd.DataFrame:
    """
    Validate that there is recording data for each valid level.
    Levels with no recordings data are skipped.

    Args:
        level_df: Valid Levels
        recording_df: Valid Recordings
        level_param: param label of Levels (used to error out)

    Returns:
        Levels with sufficient data

    Raise:
        NoValidFeaturesError if all levels are skipped

    """

    invalid_level_ids = []
    for _, level in level_df.iterrows():
        level_id = level[c.LEVEL_ID_FIELD_NAME]
        level_recording_df = recording_df[recording_df[c.LEVEL_ID_FIELD_NAME] == level_id]

        if level_recording_df.empty:
            invalid_level_ids.append(level_id)

    if invalid_level_ids:
        invalid_levels_df, level_df = u.filter_df(
            df=level_df, field_name=c.LEVEL_ID_FIELD_NAME,
            field_values=invalid_level_ids, filter_type='isin')

        # Warning about skipping level
        arcpy.AddIDMessage('WARNING', 250059, ', '.join(
            [str(oid) for oid in sorted(invalid_levels_df[c.OBJECT_ID_FIELD_NAME].values.tolist())]))

        if level_df.empty:
            # all levels are invalid, raise an error
            raise v.NoValidFeaturesError(level_param)

    return level_df


def validate_recording_within_level(recording_df: pd.DataFrame,
                                    level_df: pd.DataFrame,
                                    recording_param: str) -> pd.DataFrame:
    """Validate geometries of recordings being inside the valid Level Features.

    At this point of validation, Recordings with unmatched LEVEL_ID values have been already filtered out.

    Args:
        recording_df: Recordings dataframe
        level_df: Levels dataframe
        recording_param: name of the input parameter

    Returns:
        recording_df: filtered Levels dataframe

    Raise:
        NoValidFeaturesError if all recordings are skipped

    """
    intersecting_recordings_ids = []
    for _, level in level_df.iterrows():
        level_id = level[c.LEVEL_ID_FIELD_NAME]
        level_row = level_df[level_df[c.LEVEL_ID_FIELD_NAME] == level_id]
        level_row.reset_index(drop=True, inplace=True)
        level_recording_df = recording_df[recording_df[c.LEVEL_ID_FIELD_NAME] == level_id]

        # In case we don't have any recordings for a level, we skip the check
        if level_recording_df.empty:
            continue
        level_recording_df.reset_index(drop=True, inplace=True)

        # This step is needed for spatial join to work
        level_recording_df.spatial.project(level_row.spatial.sr)

        # Find the recordings that intersect with the level
        temp_df = level_recording_df.spatial.join(level_row[['SHAPE']], op='intersects')
        if not temp_df.empty:
            # Just collect the object ids of recordings that intersect with the corresponding level
            intersecting_recordings_ids.extend(temp_df[c.OBJECT_ID_FIELD_NAME].values.tolist())

    contained_mask = recording_df[c.OBJECT_ID_FIELD_NAME].isin(intersecting_recordings_ids)
    misplaced_recordings_df = recording_df[~contained_mask]
    recording_df = recording_df[contained_mask]

    if len(misplaced_recordings_df):
        # Warn about the skipped recordings
        arcpy.AddIDMessage('WARNING', 250092, recording_param,
                           ', '.join([str(oid) for oid in sorted(misplaced_recordings_df[
            c.OBJECT_ID_FIELD_NAME].values.tolist())]))

    if recording_df.empty:
        raise v.NoValidFeaturesError(input_param_name=recording_param)

    return recording_df


def validate_recording_x_fingerprints(recording_df: pd.DataFrame,
                                      point_df: pd.DataFrame,
                                      signal_df: pd.DataFrame):
    """Validate radio type of Recording Features against existing fingerprint radio signal of same LEVEL_ID.


    Args:
        recording_df: Recordings dataframe
        point_df: IPS Positioning Points spatial dataframe, containing fingerprints from a specific IPS dataset
        signal_df: IPS Positioning Signals spatial dataframe, containing fingerprints from a specific IPS dataset

    Returns:
        recording_df: Recordings dataframe with valid radio type

    Raises:
        NotUpdatableDatasetError: in case there is no valid Recording

    """
    invalid_recordings_oids = []
    level_id2transmitter_type = point_df[[c.LEVEL_ID_FIELD_NAME, c.GLOBAL_ID_FIELD_NAME]].merge(
        signal_df[[M.IPS_POSITIONING_SIGNALS.FIELDS.POINT_GUID.name,
                   M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_TYPE.name]],
        left_on=c.GLOBAL_ID_FIELD_NAME,
        right_on=M.IPS_POSITIONING_SIGNALS.FIELDS.POINT_GUID.name).groupby(
        [c.LEVEL_ID_FIELD_NAME, M.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_TYPE.name]).groups.keys()

    for object_id, level_id, wifi in recording_df[[c.OBJECT_ID_FIELD_NAME,
                                                   c.LEVEL_ID_FIELD_NAME,
                                                   c.WIFI_FIELD_NAME]].values:
        if (level_id, wifi) not in level_id2transmitter_type:
            invalid_recordings_oids.append(object_id)

    if invalid_recordings_oids:
        arcpy.AddIDMessage("WARNING", 250105, ', '.join(str(oid) for oid in sorted(invalid_recordings_oids)))
        recording_df = recording_df[~recording_df[c.OBJECT_ID_FIELD_NAME].isin(invalid_recordings_oids)]

    if recording_df.empty:
        raise NotUpdatableDatasetError

    return recording_df


def validate_related_tables(positioning_points: str, positioning_signals: str) -> None:
    """Validates the Related tables in the IPS Model

    Args:
        positioning_points: location of Positioning Points
        positioning_signals: location of Positioning Signals

    Raise:
        MissingData if Positioning Points or Signal feature class/table is not found

    """
    if positioning_points is None:
        raise MissingData(param_name=M.IPS_POSITIONING_POINTS.NAME)
    if positioning_signals is None:
        raise MissingData(param_name=M.IPS_POSITIONING_SIGNALS.NAME)


def validate_dataset_extent(level_sdf: pd.DataFrame, max_extent_area_m2=400000000):
    """
    Verifies that the dataset extent does not exceed a certain limit
    Args:
        level_sdf: the levels covered by the positioning dataset
        max_extent_area_m2: max area extent, default is 40 square kilometers

    Raises:
        DatasetExtentExceedsMaxSize

    """
    # make sure to work in a projected frame of reference
    level_sdf.spatial.project(3857)
    if level_sdf.spatial.bbox.area > max_extent_area_m2:
        raise DatasetExtentExceedsMaxSize
