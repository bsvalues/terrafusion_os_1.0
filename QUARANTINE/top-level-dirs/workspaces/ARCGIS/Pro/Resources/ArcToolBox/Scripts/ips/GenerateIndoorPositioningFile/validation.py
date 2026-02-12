import re
from collections import defaultdict
from typing import Set, Generator, Optional, Tuple, Union

import arcgis.geometry
import arcpy
import indoorsdatapy.access.recording as indoor_rec
import indoorsdatapy.common.const.network_type as type
import indoorsdatapy.tools.validation.validators_interface as indoor_v
import indoorsprotocol.positions_pb2 as pb
import ips.GenerateIndoorPositioningFile.const as gipf_c
import ips.const as c
import ips.utils as u
import ips.validation as v
import pandas as pd


class MixedSignalDataError(Exception):
    pass


def validate_recording_access(recording_access: indoor_rec.RecordingAccess,
                              recording: pd.Series):
    """Run several quality checks on a recording.

    Checks duration, and data density of a recording

    Args:
        recording_access: recording access to validate
        recording: the recording row from including its geometry (SHAPE)

    Returns:
        (validity, check_results): bool, dict

    """

    # perform legacy checks
    slam_validator = indoor_v.SLAMInitialRecordingChecker(recording_access,
                                                          bail=True)

    validity = slam_validator()

    # perform new checks
    lats = recording_access['positions']['latitude'].values
    lons = recording_access['positions']['longitude'].values
    floors = set(recording_access['positions']['floor'].unique())

    # check for WGS84 coordinates
    slam_validator.result[
        'coordinates_in_wgs84'
    ] = v.check_coords_wgs84(lats, lons)
    validity = validity and slam_validator.result['coordinates_in_wgs84']

    # Get ground truth points from recording access
    position_df = recording_access['positions'][[
        't', 'type', 'longitude', 'latitude', 'ancestor']]
    gt_df = position_df[position_df['type'] == pb.GROUND_TRUTH]
    recording_geom = recording[c.SHAPE_FIELD_NAME]

    # verify that the number of GT positions in the recording file is
    # the same as the number of vertices in the feature geometry
    # and verify that there are at least 2 GT positions
    slam_validator.result[
        'ground_truth_check'
    ] = recording_geom.point_count == len(gt_df)
    validity = validity and slam_validator.result['ground_truth_check']

    # check for single floor
    slam_validator.result['single_floor'] = len(floors) == 1
    validity = validity and slam_validator.result['single_floor']
    check_results = slam_validator.result
    return validity, check_results


def is_ibeacon(ssid):
    """checks if ssid indicates an ibeacon

    check if the beacon uses a different protocol
    indicated by its ssid (uuid.major.minor for ibeacons)

    :param ssid: str
    :return: check_result: bool
    """
    # ibeacon ssids have the pattern : uuid.major.minor
    match_pattern = re.compile((
        '[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-'
        '[a-fA-F0-9]{4}-[a-fA-F0-9]{12}\.\d{1,5}\.\d{1,5}'
    ))

    match_result = match_pattern.match(ssid)
    return match_result is not None


def check_transition_line(polyline):
    """checks if a transition line consists of exactly 1 piece with 2 vertices
    (those are the only transition lines that we accept to be transformed
    into portals)
    """
    # working with arcgis geometries: we can do the following checks or convert always to arcpy geometry
    # polyline.part_count == 1 and polyline.point_count == 2
    polyline = polyline.as_arcpy if isinstance(polyline, arcgis.geometry.Polyline) else polyline
    return len(polyline) == 1 and len(polyline[0]) == 2


def filter_recordings_attributes(df: pd.DataFrame) -> pd.DataFrame:
    """
    Process the Recording DataFrame to filter out rows based on invalid
    attributes and raise appropriate errors. If no errors, then output
    warnings for the recordings and return the filtered out
    Recordings DataFrame

    Args:
        df: DataFrame representation of Recordings Feature class

    Returns:
        DataFrame containing only valid recordings

    raise:
        NoValidRecordings: if no valid recordings after filtering attributes
        ConflictingDataError: if more than 1 site
        MixedSignalDataError: if WiFi & BLE are both used

    """
    # Filter out data frame based on various attributes
    warnings = defaultdict(list)
    df, dropped_df = u.filter_df(df, c.FACILITY_ID_FIELD_NAME)
    # invalid Facility ID -> skip recording
    warnings[250040] = sorted(dropped_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    df, dropped_df = u.filter_df(df, c.SURVEY_DATE_FIELD_NAME)
    # planned recording -> skip recording
    warnings[250052] = sorted(dropped_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    df, dropped_df = u.filter_df(df, c.SHAPE_FIELD_NAME)
    # empty geometry-> skip recording
    warnings[250057] = sorted(dropped_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    df, dropped_df = u.filter_df(df, c.RECORDING_TYPE_FIELD_NAME, [c.SURVEY_REC_NAME], 'isin')
    # quality recordings cannot be used for radio map generation
    warnings[250016] = sorted(dropped_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    # Show all the warnings for the individual recordings
    u.print_warnings(warnings=warnings)

    # Raise a warning for more than one device
    devices = get_num_devices(df)
    if len(devices) > 1:
        arcpy.AddIDMessage('WARNING', 250015, str(len(devices)))

    # Raise an exception if there are no valid recordings
    if df.empty:
        raise v.NoValidRecordings

    # Raise an exception for Multiple site data
    # we can only process one site at the time! Raise an error
    v.validate_single_site(df=df)

    # Raise an exception for data with mixed signals for the same facility
    if not validate_single_type_signal(df):
        raise MixedSignalDataError

    # Return the cleaned up data frame
    return df


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
    single_attachment_df, no_attachment_df, multiple_attachment_df = \
        u.filter_single_attachment_recordings(
            recordings_df, recordings_fc)
    # warning dict
    warnings = defaultdict(list)

    warnings[250045] = sorted(no_attachment_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())
    warnings[250050] = sorted(multiple_attachment_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    # Print warnings for oids omitted because of no or more than one attachment
    u.print_warnings(warnings)

    if single_attachment_df.empty:
        raise v.NoValidRecordings

    return single_attachment_df


def validate_single_type_signal(df: pd.DataFrame) -> bool:
    """Checks if all the recordings for each facility are only Wi-Fi or only BLE.
    The check is based on attributes Bluetooth and Wi-Fi.

    Args:
        df: DataFrame representation of Recordings Feature class containing only valid recordings

    Returns:
        True : If the DataFrame contains either bluetooth or wifi data for a particular facility
        False : If the DataFrame contains both wifi and bluetooth data for a particular facility

    """
    for fid, f_df in df.groupby(c.FACILITY_ID_FIELD_NAME):
        if 1 in f_df[c.BLE_FIELD_NAME].values and \
                1 in f_df[c.WIFI_FIELD_NAME].values:
            return False

    return True


def validate_single_type_signal_recording_access(df: pd.DataFrame) -> bool:
    """Checks if all the recordings for each facility are only Wi-Fi or only BLE.

    Otherwise, the check is based on the actual type of signals contained in the recordings (recording accesses).

    Args:
        df: DataFrame representation of Recordings Feature class containing the "recording_access" column

    Returns:
        True : If the DataFrame contains either bluetooth or wifi data for a particular facility
        False : If the DataFrame contains both wifi and bluetooth data for a particular facility

    """
    for fid, f_df in df.groupby(c.FACILITY_ID_FIELD_NAME):
        # check the type (5 or 0) of the first signal of each recording. All must be the same
        if len(set(r["radios"]["type"][0] for r in f_df[c.DF_RECORDING_ACCESS_COLUMN])) > 1:
            return False

        return True


def get_num_devices(df: pd.DataFrame) -> Set[str]:
    """

    Args:
        df:DataFrame representation of Recordings Feature class containing only valid recordings

    Returns:
        Set of unique device names

    """
    devices = set([device for device in df[c.DEVICE_FIELD_NAME].values if device])
    return devices


def filter_ble_data(recording_access: indoor_rec.RecordingAccess) -> pd.DataFrame:
    """Filters recording ble data. Filters out ble beacons that are not ibeacons

    Args:
        recording_access: indoor_rec.RecordingAccess object

    Returns:
        valid_transmitters: a dataframe with all the valid transmitters
    """
    # check if bluetooth beacons are ibeacons
    # if a beacon is not an ibeacon remove it and all related data
    valid_transmitters = recording_access['radios'][
        (recording_access['radios'].type == type.WLAN) |
        (recording_access['radios'].ssid.apply(
            (lambda x: is_ibeacon(x))) &
         (recording_access['radios'].type == type.IBEACON))]
    return valid_transmitters


CHECK_TO_WARNING_ID = {
    'more_than_20_radios': 250021,
    'duration_from_10s': 250022,
    'speed_limit_3ms': 250023,
    'more_than_10_steps': 250024,
    'more_than_4_transmitters': 250025,
    'consecutive_ground_truths_per_floor': 250026,  # Checks for at least 2 GT
    'file_is_protobuf': 250018,
    'coordinates_in_wgs84': 250019,
    'single_floor': 250020,
    'ground_truth_check': 250047,
    'incorrect_level_id_vs_vertical_order': 250090,
}


def validate_recording_files(recordings_df: pd.DataFrame,
                             levels_df: Optional[pd.DataFrame] = None) -> Generator[None, None, pd.DataFrame]:
    """Validates all the recording access in the dataframe and print warnings for the invalid ones.

    Args:
        recordings_df: recording dataframe containing at least OID and recording access columns
        levels_df: level dataframe containing the LEVEL_ID: VERTICAL_ORDER dictionary which we consider as ground truth.
                   This is available only for GIPD Survey-Based.

    Raises: NoValidRecordings, MixedSignalRecordings

    Yields: None everytime a recording has been validated

    Returns: filtered recordings_df containing only recordings with a valid recording file.
            The dataframe is extended with the recording_access column
            containing recording_access objects

    """

    # warning dict
    warnings = defaultdict(list)

    # dictionary LEVEL_ID: VERTICAL_ORDER based on the Level Features (if available)
    level_id_2_vo_dict = None
    if levels_df is not None:
        level_id_2_vo_dict = dict(zip(levels_df[c.LEVEL_ID_FIELD_NAME], levels_df[c.VERTICAL_ORDER]))

    # check data of each recording
    valid_rec_tuples = []  # list of (oid, recording_access)
    for _, row in recordings_df.iterrows():
        file_path, rec_oid = row[c.DF_FILE_PATH_COLUMN], row[c.OBJECT_ID_FIELD_NAME]
        recording_access = u.get_recording_access(file_path)
        if recording_access is None:
            # warning for oids with invalid recording pb file.
            warnings[250046].append(rec_oid)
            yield  # notify the caller that one recording was processed
            continue

        # filter for ble data from ibeacons
        # this needs to be done before the checks, otherwise
        # the recording may pass the check on the number of radios,
        # but those might be all non-ibeacon and we will end up with an
        # empty radios dataframe later on
        recording_access['radios'] = filter_ble_data(recording_access)

        validity, check_results = validate_recording_access(
            recording_access=recording_access, recording=row)

        if not validity:
            # append the warnings to the warning list
            for check, result in check_results.items():
                if not result:
                    warnings[CHECK_TO_WARNING_ID[check]].append(rec_oid)
                    break

            yield  # notify the caller that one recording was processed
            continue

        # extra attribute check for Recordings, available only on GIPD-SB (has Levels input)
        # validate that the floor value of the recording_access is in sync with the LEVEL_ID attribute of the
        # recording based on the Levels' {LEVEL_ID: VERTICAL_ORDER} dictionary
        if level_id_2_vo_dict:
            # at this point, all the Recordings span exactly one floor (checked by SLAM Validator above)
            row_vertical_order = recording_access["positions"]["floor"][0]
            row_level_id = row[c.LEVEL_ID_FIELD_NAME]
            if level_id_2_vo_dict[row_level_id] != row_vertical_order:
                warnings[CHECK_TO_WARNING_ID["incorrect_level_id_vs_vertical_order"]].append(rec_oid)
                yield  # notify the caller that one recording was processed
                continue

        valid_rec_tuples.append((rec_oid, recording_access))
        yield  # notify the caller that one recording was processed

    # finally, prints the warnings
    u.print_warnings(warnings=warnings)

    valid_recording_access_df = pd.DataFrame(
        valid_rec_tuples,
        columns=[c.OBJECT_ID_FIELD_NAME,
                 c.DF_RECORDING_ACCESS_COLUMN])

    # expand the recording dataframe with recording_access and
    # filter out rows with invalid recording files
    recording_df = pd.merge(
        left=recordings_df, right=valid_recording_access_df,
        on=c.OBJECT_ID_FIELD_NAME)

    # check if all the rows are filtered out
    if recording_df.empty:
        raise v.NoValidRecordings

    # check for mixed Signals once again. The only way to trigger this is
    # if the user messes up the Bluetooth and Wi-Fi fields in the recordings manually
    if not validate_single_type_signal_recording_access(recording_df):
        raise MixedSignalDataError

    return recording_df


def validate_transition_attributes(transition_df: Union[pd.DataFrame, None]) -> Optional[pd.DataFrame]:
    """
    Validates the attributes of the transition dataframe and raises relevant warning
    messages for skipped transitions
    Args:
        transition_df: Dataframe of transitions or None if transitions are not passed

    Returns:
        Dataframe that contains validate attributes
    """

    if transition_df is None:
        return None

    if transition_df.empty:
        # transition input is provided but it is empty
        arcpy.AddIDMessage('WARNING', 250027)
        return transition_df

    skipped_transition_ids = {
        gipf_c.WRONG_TYPE: [],
        gipf_c.MISMATCH_VERTICAL_ORDER: []
    }
    # Check for correct transition type
    # TODO: make this future proof. Is always No. 7 Entrance/Exit?
    transition_df, dropped_df = u.filter_df(transition_df, c.TRANSITION_TYPE_FIELD_NAME, [7, 1000], 'isin')
    skipped_transition_ids[gipf_c.WRONG_TYPE] = sorted(dropped_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    # Check if vertical order from and vertical order to match
    mask = transition_df[c.VERTICAL_ORDER_FROM_FIELD_NAME] == transition_df[c.VERTICAL_ORDER_TO_FIELD_NAME]
    # in case of null values Vertical From/To values, consider those invalid as well
    mask.fillna(False, inplace=True)
    transition_df, dropped_df = transition_df[mask], transition_df[~mask]
    skipped_transition_ids[gipf_c.MISMATCH_VERTICAL_ORDER] = sorted(dropped_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    for fail_type, id_list in skipped_transition_ids.items():
        if len(id_list):
            arcpy.AddIDMessage('WARNING', gipf_c.TRANSITION_FAILS[fail_type],
                               ', '.join([str(oid) for oid in sorted(id_list)]))

    # Input transitions is empty
    if transition_df.empty:
        arcpy.AddIDMessage('WARNING', 250087)
    return transition_df


def validate_transition_geometries(transition_df: pd.DataFrame) -> Optional[pd.DataFrame]:
    """
    Validates the geometry of the transition dataframe and raises relevant warning
    messages for skipped transitions
    Args:
        transition_df: Dataframe of transitions

    Returns:
        Dataframe that contains validate attributes
    """
    if transition_df is None or transition_df.empty:
        return transition_df

    skipped_transition_ids = {
        gipf_c.EMPTY_GEO: [],
        gipf_c.BAD_LINE: [],
    }
    # Check for empty geometry
    transition_df, dropped_df = u.filter_df(transition_df, c.SHAPE_FIELD_NAME)
    skipped_transition_ids[gipf_c.EMPTY_GEO] = sorted(dropped_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    if not transition_df.empty:
        # Check for polyline with exactly two vertices and that is not multi-polyline
        mask = transition_df[c.SHAPE_FIELD_NAME].apply(check_transition_line)
        transition_df, dropped_df = transition_df[mask], transition_df[~mask]
        skipped_transition_ids[gipf_c.BAD_LINE] = sorted(dropped_df[
            c.OBJECT_ID_FIELD_NAME].values.tolist())

    for fail_type, id_list in skipped_transition_ids.items():
        if len(id_list):
            arcpy.AddIDMessage('WARNING', gipf_c.TRANSITION_FAILS[fail_type],
                               ', '.join([str(oid) for oid in sorted(id_list)]))

    # Input transitions is empty
    if transition_df.empty:
        arcpy.AddIDMessage('WARNING', 250087)
    return transition_df


def validate_transition_x_recordings(transition_df: pd.DataFrame,
                                     recording_df: pd.DataFrame) -> Optional[pd.DataFrame]:
    """Cross-validate transitions attributes against recordings
    Drops all the transitions for which we cannot find a matching facility.

    Args:
        transition_df: Dataframe of Transitions
        recording_df: Dataframe of Recordings

    Returns:
        Transitions that match a facility. Non - matching transitions are dropped

    """
    if transition_df is None or transition_df.empty:
        return transition_df

    skipped_transition_ids = {
        gipf_c.FACILITY_MISMATCH: []
    }
    # check for valid facilities
    transition_df, dropped_df = u.filter_df(transition_df, c.FACILITY_ID_FIELD_NAME,
                                            recording_df[c.FACILITY_ID_FIELD_NAME].values.tolist(),
                                            'isin')
    skipped_transition_ids[gipf_c.FACILITY_MISMATCH] = sorted(dropped_df[c.OBJECT_ID_FIELD_NAME].values.tolist())

    # print any messages
    for fail_type, id_list in skipped_transition_ids.items():
        if len(id_list):
            arcpy.AddIDMessage('WARNING', gipf_c.TRANSITION_FAILS[fail_type],
                               ', '.join([str(oid) for oid in sorted(id_list)]))

    if transition_df.empty:
        # there are no valid transitions left, print a warning
        arcpy.AddIDMessage('WARNING', 250087)

    return transition_df


def validate_attributes(
        recording_df: pd.DataFrame, recordings_fc,
        ips_transition_df: Optional[pd.DataFrame]) -> Tuple[pd.DataFrame, Optional[pd.DataFrame]]:
    """Validate attributes of all input for Generate Indoor Positioning File tool

    Args:
        recording_df: recording data frame
        recordings_fc: feature class containing the recordings'
        ips_transition_df: transitions data frame

    Returns: recordings and transitions with valid attributes
        - valid recording df
        - valid transition df (if given, else None)

    """
    # Pass the Dataframe to filter out the recordings with invalid attributes
    recording_df = filter_recordings_attributes(df=recording_df)

    # Pass the Dataframe to filter out the recordings with no or multiple
    # attachments
    recording_df = filter_single_attachment(
        recordings_df=recording_df,
        recordings_fc=recordings_fc)

    if ips_transition_df is not None:
        # Validate transition attributes and geometry
        ips_transition_df = validate_transition_attributes(transition_df=ips_transition_df)
        ips_transition_df = validate_transition_geometries(transition_df=ips_transition_df)

    return recording_df, ips_transition_df
