from collections import defaultdict

import indoorsdatapy.access.recording as indoor_rec
import indoorsprotocol.positions_pb2 as pb
import ips.const as c
import ips.const_legacy as c_l
import ips.utils as u
import ips.validation as v
import pandas as pd

VERTEX_MISMATCH = 'vertex mismatch'
LESS_THAN_2_GT = 'less than 2 GT positions'
LESS_THAN_2_FINAL = 'less than 2 final positions'
TIME_INTERVAL_MISMATCH = 'time interval mismatch'
NO_GT_COORDS = 'GT positions no lat/lon coords'
NO_FINAL_COORDS = 'final positions no lat/lon coords'


def validate_qr_metadata(
        recording_access: indoor_rec.RecordingAccess) -> bool:
    """check if a quality recording has all necessary metadata

    Args:
        recording_access: the quality recording access to be checked

    Returns: True if all metadata are present, else False

    """
    for metadata_key in (c_l.IPS_POSITIONING_GUID_KEY,):
        try:
            recording_access.get_metadata_value(key=metadata_key)[0]
        except IndexError:
            return False

    return True


def validate_qr_positions(position_df: pd.DataFrame,
                          recording: pd.Series):
    """runs necessary validations on the positions stored in a quality recording

    Args:
        position_df: the recording positions (GT and final)
        recording: the recording row from including its geometry (SHAPE)

    Returns: if any validation fails a string reporting the
    issue is returned (for internal debug reasons), else True

    """
    # use short aliases
    gt_df = position_df[position_df['type'] == pb.GROUND_TRUTH]
    final_df = position_df[position_df['type'] == pb.FINAL]

    # verify that the number of GT positions in the recording file is
    # the same as the number of vertices in the feature geometry
    recording_geom = recording[c.SHAPE_FIELD_NAME]
    if recording_geom.point_count != len(gt_df):
        return VERTEX_MISMATCH

    # verify that there are at least 2 GT positions
    if len(gt_df) < 2:
        return LESS_THAN_2_GT

    # verify that there are at least 2 FINAL positions
    if len(final_df) < 2:
        return LESS_THAN_2_FINAL

    # verify that the time intervals of GT and FINAL positions overlap
    if not (
            gt_df.t.min() <= final_df.t.min() <= gt_df.t.max() or
            final_df.t.min() <= gt_df.t.min() <= final_df.t.max()):
        return TIME_INTERVAL_MISMATCH

    # verify that the positions are stored as lat/lon
    if not v.check_coords_wgs84(gt_df.latitude.values,
                                gt_df.longitude.values):
        return NO_GT_COORDS
    if not v.check_coords_wgs84(final_df.latitude.values,
                                final_df.longitude.values):
        return NO_FINAL_COORDS

    return True


def filter_recordings_attributes(
        ips_recordings_df: pd.DataFrame) -> pd.DataFrame:
    """

    Process the Recording DataFrame to filter out rows based on invalid
    attributes, print warnings for the recordings row that are dropped and
    return the filtered out
    Recordings DataFrame

    Args:
        ips_recordings_df: DataFrame representation of Recordings Feature class

    Returns:
        DataFrame containing only valid recordings

    """
    warnings = defaultdict(list)
    ips_recordings_df, dropped_df = u.filter_df(ips_recordings_df,
                                                c.LEVEL_ID_FIELD_NAME)
    # invalid Level ID -> skip recording
    warnings[250043] = sorted(dropped_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    ips_recordings_df, dropped_df = u.filter_df(ips_recordings_df,
                                                c.SHAPE_FIELD_NAME)
    # empty geometry-> skip recording
    warnings[250057] = sorted(dropped_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    ips_recordings_df, dropped_df = u.filter_df(ips_recordings_df,
                                                c.SURVEY_DATE_FIELD_NAME)
    # planned recording -> skip recording
    warnings[250052] = sorted(dropped_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    ips_recordings_df, dropped_df = u.filter_df(ips_recordings_df,
                                                c.RECORDING_TYPE_FIELD_NAME,
                                                [c.QUALITY_REC_NAME], 'isin')
    # quality recordings cannot be used for radio map generation
    warnings[250044] = sorted(dropped_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    u.print_warnings(warnings)

    # check if all the rows are filtered out
    if ips_recordings_df.empty:
        raise v.NoValidRecordings

    # Return cleaned up dataframe
    return ips_recordings_df


def filter_single_attachment(recordings_df: pd.DataFrame,
                             recordings_fc: str) -> pd.DataFrame:
    """
    Process the recordings Dataframe to filter out rows with no or multiple
    attachments and return Dataframe that contain only one attachment per row.
    Args:
        recordings_df: DataFrame representation of Recordings Feature class
        recordings_fc:path to table or feature service

    Returns:
        DataFrame containing recordings with only one attachment
    """
    # Function to return filtered Dataframe based on attachments on each row
    single_attachment_df, no_attachment_df, multiple_attachment_df = \
        u.filter_single_attachment_recordings(
            recordings_df, recordings_fc)

    # warning dict
    warnings = defaultdict(list)
    # warning for oids with no attachment
    warnings[250045] = sorted(no_attachment_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())
    # warning for oids with multiple attachments
    warnings[250050] = sorted(multiple_attachment_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    # Print warnings for oids omitted because of no or more than one attachment
    u.print_warnings(warnings)

    # check if all the rows are filtered out
    if single_attachment_df.empty:
        raise v.NoValidRecordings

    # Return dataframe with single attachment per row
    return single_attachment_df


def validate_recording_files(ips_recordings_df: pd.DataFrame):
    """Validates all the recording access in the dataframe and print warnings
    for the invalid ones.

    Args:
        ips_recordings_df: recording dataframe containing at least
        OID and recording access columns

    Returns: yields OID, recording_access.
    The recording_access is null if it is invalid for some reason

    """

    # warning dict
    warnings = defaultdict(list)

    for _, row in ips_recordings_df.iterrows():
        file_path, rec_oid = row[c.DF_FILE_PATH_COLUMN], row[
            c.OBJECT_ID_FIELD_NAME]
        recording_access = u.get_recording_access(file_path)
        if recording_access is None:
            # warning for oids with invalid recording pb file.
            warnings[250046].append(rec_oid)
            yield rec_oid, None
            continue

        pos_df = recording_access['positions'][[
            't', 'type', 'longitude', 'latitude', 'ancestor']]

        if not validate_qr_metadata(
                recording_access=recording_access) or validate_qr_positions(
            position_df=pos_df, recording=row) is not True:
            # warn and skip
            warnings[250047].append(rec_oid)
            yield rec_oid, None
            continue

        yield rec_oid, recording_access

    # finally, prints the warnings
    u.print_warnings(warnings=warnings)
