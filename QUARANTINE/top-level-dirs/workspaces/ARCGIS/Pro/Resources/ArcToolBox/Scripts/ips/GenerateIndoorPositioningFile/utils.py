import os
import shutil
import tempfile
import uuid
from typing import Tuple, Iterable, Generator, Union

import arcgis
import arcpy
import indoorsdatapy.access.recording as indoor_rec
import indoorsdatapy.common.const.network_type as type
import ips.GenerateIndoorPositioningFile.slamsce as gipf_s
import ips.GenerateIndoorPositioningFile.utils_db as gipf_udb
import ips.GenerateIndoorPositioningFile.validation as gipf_v
import ips.const as c
import ips.utils_db as u_db
import ips.utils_geom as u_geom
import ips.utils_io as u_io
import ips.validation as v
import numpy as np
import pandas as pd

# global progressor
progressor = u_io.Progressor(step_num=6)


def convert_transitions_to_portals(transition_df: pd.DataFrame,
                                   origin_lat,
                                   origin_lon):
    """converts aiim transition into portal data
    :param transition_df: DataFrame as defined for transitions in the AIIM
    :param origin_lat: numeric latitude of origin of legacy
      coordinate system in degrees on wgs84
    :param origin_lon: numeric longitude of origin of legacy
      coordinate system in degrees on wgs84
    :return: dataframe of portals with coordinates of transitions in legacy
      coordinate system
    """
    # treat special case with no transitions
    if transition_df is None or transition_df.empty:
        return None

    origin_point = arcpy.PointGeometry(arcpy.Point(origin_lon, origin_lat), c.WGS84_SR)

    # get a latlon vertex array and the geometry indices
    lonlat_array = np.array(
        [list(polyline.project_as(c.WGS84_SR).centroid) for polyline in transition_df.SHAPE])

    xy_array = u_geom.lonlat2legacy_xy(lonlat_array=lonlat_array,
                                       origin_wgs84=origin_point)

    geom_sr = pd.Series([arcgis.geometry.Point({
        'hasZ': False,
        'x': xy[0],
        'y': xy[1],
        'spatialReference': {'wkid': 3857,
                             'latestWkid': 3857}
    }) for xy in xy_array])

    # work on a copy of the df to fix #674
    transition_df_copy = transition_df.copy(deep=True)
    if transition_df_copy.spatial.name:
        transition_df_copy.drop(columns=[transition_df_copy.spatial.name], inplace=True)
    # set the SHAPE column of the spatial dataframe
    transition_df_copy.spatial.set_geometry(geom_sr)

    return transition_df_copy


def generate_positioning_file(recordings_fc,
                              positioning_table,
                              transitions,
                              comment,
                              data_dir):
    """generates a positioning file

    * create trajectories from recordings (interpolate in time)
    * fuse them into a radiomap (interpolate in space)
    * make a new building database, including the new radiomap
    * add new row with the positioning file to positioning table
    :param recordings_fc: feature class containing the recordings to be used
      for the radio map
    :param positioning_table: table
      where to insert the created building database file
    :param transitions: Feature Class
      as defined for transitions in the AIIM
    :param comment: str
      comment to be added to positioning table
    :param data_dir: path  where the data created in the process is stored.
    """
    global progressor

    progressor = u_io.Progressor(step_num=6)

    # Step 0 - Read input
    # ---------------------------------------------------------------
    recording_df = u_io.read_recordings(recordings_fc=recordings_fc)
    ips_transition_df = u_io.read_transitions(transitions_fc=transitions)

    # Step 1 - Validating recording attributes (and transition attributes & geometries)
    # ---------------------------------------------------------------
    progressor.update_label(message_id=250053)
    recording_df, ips_transition_df = gipf_v.validate_attributes(
        recording_df=recording_df, recordings_fc=recordings_fc,
        ips_transition_df=ips_transition_df)
    progressor.increment()

    # Step 2 - Extracting recordings
    # ---------------------------------------------------------------
    progressor.update_label(message_id=250008)
    progressor.set_small_increment(sub_steps=len(recording_df))
    recording_df = progressor.generator_increments(
        gen=extract_recordings(recording_df, recordings_fc, target_dir=data_dir))

    # Step 3 - Validating recordings files
    # ---------------------------------------------------------------
    progressor.update_label(message_id=250054)
    progressor.set_small_increment(sub_steps=len(recording_df))
    recording_df = progressor.generator_increments(
        gen=gipf_v.validate_recording_files(recording_df))

    # TODO: track cross validation in the progressor?
    # Validate transitions against valid recordings
    ips_transition_df = gipf_v.validate_transition_x_recordings(
        transition_df=ips_transition_df, recording_df=recording_df)

    # Step 4 - processing attachments
    # ---------------------------------------------------------------
    progressor.update_label(message_id=250010)
    progressor.set_small_increment(len(recording_df))

    # handle coordinate conversion (slam expects local coordinates)
    origin_lat, origin_lon, floors = calc_legacy_origin(
        recording_accesses=recording_df[c.DF_RECORDING_ACCESS_COLUMN])

    origin = arcpy.PointGeometry(arcpy.Point(origin_lon, origin_lat), c.WGS84_SR)

    recording_df = progressor.generator_increments(
        gen=enrich_recording_accesses(
            recording_df=recording_df,
            legacy_origin=origin))

    # Step 5 - Generating indoor positioning file...
    # ---------------------------------------------------------------
    progressor.update_label(message_id=250011)

    fingerprint_df = create_fingerprints_from_recordings(recording_df=recording_df)

    portal_df = convert_transitions_to_portals(
        origin_lon=origin_lon,
        origin_lat=origin_lat,
        transition_df=ips_transition_df
    )

    progressor.increment()

    # Step 6 - Saving indoor positioning file...
    # ---------------------------------------------------------------
    progressor.update_label(message_id=250012)

    legacy_db = create_legacy_db(fingerprint_df=fingerprint_df,
                                 portal_df=portal_df,
                                 origin_lat=origin_lat,
                                 origin_lon=origin_lon,
                                 target_dir=data_dir)

    radio_types = fingerprint_df.transmitter_type.unique()
    ble = type.IBEACON in radio_types
    wifi = type.WLAN in radio_types
    site_id = get_output_site_id(recording_df=recording_df)

    gipf_udb.insert_building_db_in_table(building_db_path=legacy_db,
                                         site_id=site_id,
                                         positioning_table=positioning_table,
                                         comment=comment,
                                         ble=int(ble),
                                         wifi=int(wifi)
                                         )

    progressor.increment()


def extract_recordings(recording_df, recordings_fc, target_dir) -> Generator[Tuple, None, pd.DataFrame]:
    """extract recordings files from the given recordings FC
    to the target directory and expands the recording df with
    attachment id and file path columns

    Args:
        recording_df: recording dataframe
        recordings_fc: recordings layer
        target_dir: target directory to store the files

    Yields: attachment tuples [attachment_path, oid, attachment_oid]

    Returns: recording dataframe expanded by
        [DF_FILE_PATH_COLUMN, DF_ATT_OID_COLUMN]

    """

    valid_rec_oids = sorted(recording_df[c.OBJECT_ID_FIELD_NAME].values.tolist())

    attachment_tuple_gen = u_db.extract_attachments(
        table=recordings_fc,
        target_dir=target_dir,
        object_ids=valid_rec_oids
    )

    attachment_tuples = []
    for attachment_tuple in attachment_tuple_gen:
        attachment_tuples.append(attachment_tuple)
        yield attachment_tuple

    attachment_df = pd.DataFrame(
        attachment_tuples,
        columns=[c.DF_FILE_PATH_COLUMN,
                 c.OBJECT_ID_FIELD_NAME,
                 c.DF_ATT_OID_COLUMN])

    # expand the recording dataframe with attachment info
    recording_df = pd.merge(
        left=recording_df, right=attachment_df,
        on=c.OBJECT_ID_FIELD_NAME)

    return recording_df


def enrich_recording_accesses(recording_df: pd.DataFrame,
                              legacy_origin: arcpy.PointGeometry) -> Generator[
    indoor_rec.RecordingAccess, None, pd.DataFrame]:
    """Returns recording access objects enriched with legacy coordinates

    Args:
        recording_df: recording dataframe. Min cols [OBJECT_ID_FIELD_NAME, DF_RECORDING_ACCESS_COLUMN]
        legacy_origin: the origin of the legacy coordinate system

    Yields: recording access objects

    Returns: recording access objects containing ['positions']['x', 'y'] values

    """

    for recording_id, recording_access in recording_df[[
        c.OBJECT_ID_FIELD_NAME, c.DF_RECORDING_ACCESS_COLUMN]].values:
        # transform lat/lon to legacy and assign it to the recording access
        recording_access["positions"][['x', 'y']] = u_geom.lonlat2legacy_xy(
            lonlat_array=recording_access['positions'][['longitude', 'latitude']].values,
            origin_wgs84=legacy_origin)

        # assign the recording id
        recording_access.pb.id = recording_id

        yield recording_access

    return recording_df


def cleanup_patch(self):
    """
    patch tempdir cleanup, so even if a file is still open
    all other files will be deleted and no error will be raised
    """
    if self._finalizer.detach() or os.path.exists(self.name):
        try:
            shutil.rmtree(path=self.name, ignore_errors=False)
        except PermissionError:
            shutil.rmtree(path=self.name, ignore_errors=True)


def read_recording_coordinates(recording_access: indoor_rec.RecordingAccess) -> Tuple:
    """Extracts the global coordinates from the recording file

    Args:
        recording_access: indoor_rec.RecordingAccess object for the recording

    Returns:
        lats: numpy array with the latitude values
        lons: numpy array with the longitude values
        floors: set of integers with all floors levels in the recording

    """
    if len(recording_access['positions']) == 0:
        lats, lons, floors = None, None, None
    else:
        lats = recording_access['positions']['latitude'].values
        lons = recording_access['positions']['longitude'].values
        floors = set(recording_access['positions']['floor'].unique())
    return lats, lons, floors


def find_most_western_point(lons):
    """find most western point from a set of longitudes
    :param lons (numeric): longitudes on wgs84 in degrees
    :return: most_western (numeric)

    """
    # west is  -
    # east is  +
    most_eastern = max(lons)
    most_western = min(lons)
    # this is not super safe! There could be issues for
    # very large exotic datasets, or close to poles
    if any(lons < -178) and any(lons > 178):
        return most_eastern
    return most_western


def calc_legacy_origin(recording_accesses: Iterable[indoor_rec.RecordingAccess],
                       boundary_buffer_scale=5e-3):
    """Calculate lat lon of origin of legacy coordinate system

    Extracts the most northern latitude and most eastern longitude
    from all coordinates of all recordings.
    Some buffer is added so no recording is located at the origin
    of the legacy coordinate system.
    The calculated coordinates are valid candidates for the origin
    of a legacy coordinate system

    Notes: boundary_buffer_scale is used for buffer calculation, which is
    indirect proportional to max latitude:
    latitude: 1. / max_lat * boundary_buffer_scale, results in about 555m on
    the equator

    Args:
        recording_accesses: list of indoor_rec.RecordingAccess objects
        boundary_buffer_scale: default value is 5e-3

    Returns:
        origin_lat: the latitude value of the origin
        origin_lon: the longitude value of the origin
        all_floors: set of integers with all floor levels in all recordings

    """
    most_northern_lat = -90
    most_western_lon = 178
    all_floors = set()
    for recording_access in recording_accesses:
        lats, lons, floors = read_recording_coordinates(
            recording_access=recording_access)
        if floors is None:
            break
        all_floors.update(floors)
        # find most northern point
        most_northern_lat = max(np.append(lats, most_northern_lat))
        most_western_lon = find_most_western_point(
            np.append(lons, most_western_lon))
    # scale boundary buffer with lat, because this determines
    # ratio meter to degree
    buffer = 1. / abs(most_northern_lat) * boundary_buffer_scale if abs(
        most_northern_lat) > 1 else boundary_buffer_scale
    origin_lat = most_northern_lat + buffer
    origin_lon = most_western_lon - buffer
    return origin_lat, origin_lon, all_floors


def create_legacy_db(fingerprint_df: pd.DataFrame,
                     portal_df: pd.DataFrame,
                     origin_lat: float, origin_lon: float,
                     azimuth_x_axis: float = 90.,
                     target_dir: str = ''):
    """Creates a legacy sqlite db and fills it with data

    Args:
        fingerprint_df: radio fingerprint dataframe
        portal_df: portal dataframe
        origin_lat: latitude of the legacy origin
        origin_lon: longitude of the legacy origin
        azimuth_x_axis: CW rotation (in degrees) between the north and the legacy x-axis
        target_dir: directory where the legacy file will be created

    Returns:

    """
    target_dir = target_dir if os.path.isdir(target_dir) else tempfile.mkdtemp()
    # positioning file name should be a UUID
    legacy_db = os.path.join(target_dir, f'{uuid.uuid4()}.zip')

    # create a copy of an empty legacy db
    shutil.copy(c.EMPTY_LEGACY_DB, legacy_db)

    # initialize a legacy DB mapper that will be used to write data in the db
    legacy_db_mapper = gipf_udb.LegacyDbMapper(db_path=legacy_db)

    # add Building
    building_id = 1  # fake building id

    legacy_db_mapper.add_building(
        building_id=building_id,
        lat_origin=origin_lat,
        lon_origin=origin_lon,
        azimuth_x_axis=azimuth_x_axis
    )

    # create a floor_df
    floor_df = fingerprint_df[['vertical_order']].drop_duplicates(ignore_index=True)
    # make sure the index of the df starts from 1,
    # because the index values will become ids in the database
    floor_df.index += 1

    legacy_db_mapper.add_floors(building_id=building_id, floor_df=floor_df)

    # add Networks
    # create a network df
    network_df = fingerprint_df[[
        'transmitter_id', 'transmitter_type',
        'bssid', 'ssid']].drop_duplicates(ignore_index=True)
    # make sure the index of the df starts from 1,
    # because the index values will become ids in the database
    network_df.index += 1

    legacy_db_mapper.add_networks(building_id=building_id, network_df=network_df)

    # enrich the fingerprints with network_ids, floor_ids
    transmitter_id2network_id = dict(zip(network_df.transmitter_id, network_df.index))
    fingerprint_df['network_id'] = fingerprint_df.transmitter_id.map(transmitter_id2network_id)
    vertical_order2floor_id = dict(zip(floor_df.vertical_order, floor_df.index))
    fingerprint_df['floor_id'] = fingerprint_df.vertical_order.map(vertical_order2floor_id)

    # add Fingerprints
    legacy_db_mapper.add_fingerprints(fingerprint_df=fingerprint_df)

    # add Portals
    if portal_df is not None and not portal_df.empty:
        legacy_db_mapper.add_portals(portal_df=portal_df)

        # Transitions with the following object ids were added to positioning file: %s
        transition_oids = ','.join(
            [str(oid) for oid in sorted(portal_df[c.OBJECT_ID_FIELD_NAME].values.tolist())])
        arcpy.AddIDMessage('INFORMATIVE', 250013, transition_oids)

    # close the session
    legacy_db_mapper.session.close()

    return legacy_db


def create_fingerprints_from_recordings(recording_df: pd.DataFrame,
                                        grid_origin: Tuple[float, float] or np.ndarray = (0., 0.)) -> pd.DataFrame:
    """Computes a fingerprint dataframe from a recording dataframe

    Args:
        recording_df: min cols: [DF_RECORDING_ACCESS_COLUMN]

    Raises: EmptyRadiomapError in case of empty fingerprint dataframe

    Returns: fingerprint_df: ['x', 'y', 'q', 'r', 'rssi_mean', 'rssi_var', 'vertical_order',
                            'transmitter_id', 'transmitter_type', 'ssid', 'bssid']

    """
    recording_accesses = recording_df[c.DF_RECORDING_ACCESS_COLUMN]
    # create trajectory data frame from the recording accesses.
    # this is a radio fingerprint dataframe with columns
    # ['t' 'x' 'y' 'floor' 'recording_id' 'sxy'
    #  'transmitter_type' 'bssid', 'ssid' 'transmitter_id'
    #  'mean' 'var' 'weight' 'position_id']
    slam_trajectory_df = gipf_s.slam_algo(recording_accesses)

    # shift the trajectories to use the proper hex grid
    slam_trajectory_df.x -= grid_origin[0]
    slam_trajectory_df.y -= grid_origin[1]

    if slam_trajectory_df.empty:
        raise v.NoValidRecordings

    # fuse all trajectories in one fingerprint_df:
    # ['x', 'y', 'q', 'r', 'rssi_mean', 'rssi_var', 'vertical_order',
    #  'transmitter_id', 'transmitter_type', 'ssid', 'bssid']
    fingerprint_df = gipf_s.slam_fuse(slam_trajectory_df=slam_trajectory_df,
                                      parallel_proc=False)

    # shift back in case the trajectory df is used again outside of this function
    slam_trajectory_df.x += grid_origin[0]
    slam_trajectory_df.y += grid_origin[1]

    # also shift the fingerprints back to where they belong
    fingerprint_df.x += grid_origin[0]
    fingerprint_df.y += grid_origin[1]

    # check for empty radio map -> Error
    if fingerprint_df.empty:
        raise v.EmptyRadiomapError

    return fingerprint_df


def get_output_site_id(recording_df: pd.DataFrame) -> Union[None, str]:
    """Calculate the output Site ID based on the values contained in the Recording dataframe.

    The possible scenarios are:
    One Site ID & null value(s): output Site ID is equal to the unique Site ID found
    Only null value(s): output Site ID is null

    Args:
        recording_df: the recording dataframe representing the IPS Recordings

    Returns:
        Site ID or Null

    """
    # Site ID is either Null (if all the valid Recordings have null values) or
    # the value of the unique Site ID contained in at least one of the valie Recordings
    for site_id in recording_df[c.SITE_ID_FIELD_NAME].unique():
        if site_id:
            # the unique & non-null is found, return its value
            return site_id

    return None
