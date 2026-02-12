from datetime import datetime
from typing import Union

import arcpy
import indoorsdatapy.access.recording as indoor_rec
import indoorsprotocol.positions_pb2 as pb
import ips.ComputePositioningQuality.const as cpq_c
import ips.ComputePositioningQuality.utils_geom as cpq_u_geom
import ips.ComputePositioningQuality.validation as cpq_v
import ips.const as c
import ips.const_legacy as c_l
import ips.utils as u
import ips.utils_db as u_db
import ips.utils_geom as u_geom
import ips.utils_io as u_io
import ips.validation as v
import numpy as np
import pandas as pd


def get_positioning_type_meta(recording_access: indoor_rec.RecordingAccess,
                              positioning_type_key: str) -> Union[bool, None]:
    """Gets the positioning type supported by the positioning file used during the quality recording.
    If the info is not stored in the metadata, returns None
    Args:
        recording_access: the recording file under analysis
        positioning_type_key: either BLE or WIFI (for now)

    Returns: the value of the positioning type metadata

    """
    # this metadata might be missing
    try:
        radio_source_pos = recording_access.get_metadata_value(
            key=positioning_type_key)[0]
        if radio_source_pos.lower() == 'true':
            radio_source_pos = True
        elif radio_source_pos.lower() == 'false':
            radio_source_pos = False
        else:
            radio_source_pos = None
    except IndexError:
        radio_source_pos = None
    return radio_source_pos


def get_gt_and_final_positions(
        ips_recordings_df: pd.DataFrame
):
    """Extracts valid ground-truth positions and final positions
    dataframes from the given IPS recordings dataframe.

    Recordings with bad recording file data are skipped.
    Warning messages about the skipped recordings are printed.

    Args:
        ips_recordings_df: ['ObjectID', 'SITE_ID', 'FACILITY_ID', 'LEVEL_ID',
                'SURVEY_DATE', 'COMMENT', 'SURVEYOR', 'DEVICE', 'APP_VERSION',
                'RECORDING_TYPE', 'BLUETOOTH', 'WIFI', 'PLANNING_DATE',
                'GlobalID', 'Shape_Length', 'Shape', 'file_path']

    Returns:
        - gt_positions: ['t' 'type' 'longitude' 'latitude'
                'Positioning GUID', 'GlobalID', 'Level ID'
                'Bluetooth Positioning' 'WiFi Positioning']
        - final_positions: ['t' 'type' 'longitude' 'latitude'
            'Positioning GUID', 'GlobalID', 'Level ID'
            'Bluetooth Positioning' 'WiFi Positioning']
    """

    gt_position_dfs = []
    final_position_dfs = []
    for _, recording_row in ips_recordings_df.iterrows():
        # Read the recording (pb file) as dataframe
        rec_acc = recording_row[c.DF_RECORDING_ACCESS_COLUMN]

        pos_df = rec_acc['positions'][[
            't', 'type', 'longitude', 'latitude', 'ancestor']]

        # read from metadata
        pos_df[c.POSITIONING_GUID_FIELD_NAME] = rec_acc.get_metadata_value(
            key=c_l.IPS_POSITIONING_GUID_KEY)[0]

        pos_df[c.BLUETOOTH_POSITIONING_FIELD_NAME] = get_positioning_type_meta(
            recording_access=rec_acc, positioning_type_key=c_l.IPS_POSITIONING_BLUETOOTH_KEY)

        pos_df[c.WIFI_POSITIONING_FIELD_NAME] = get_positioning_type_meta(
            recording_access=rec_acc, positioning_type_key=c_l.IPS_POSITIONING_WIFI_KEY)

        pos_df[c.RECORDING_GUID_FIELD_NAME] = recording_row[c.GLOBAL_ID_FIELD_NAME]
        pos_df[c.LEVEL_ID_FIELD_NAME] = recording_row[c.LEVEL_ID_FIELD_NAME]

        gt_position_dfs.append(pos_df[pos_df['type'] == pb.GROUND_TRUTH])
        final_position_dfs.append(pos_df[pos_df['type'] == pb.FINAL])

    return pd.concat(gt_position_dfs), pd.concat(final_position_dfs)


def accuracy_level_conditions(df: pd.DataFrame):
    distance_high = df[c.DISTANCE_TO_COMPUTED_FIELD_NAME] < cpq_c.HI_DIST
    distance_mid = (df[c.DISTANCE_TO_COMPUTED_FIELD_NAME] >= cpq_c.HI_DIST) & (
            df[c.DISTANCE_TO_COMPUTED_FIELD_NAME] < cpq_c.LO_DIST)
    distance_low = df[c.DISTANCE_TO_COMPUTED_FIELD_NAME] >= cpq_c.LO_DIST
    return [
        df[c.LEVEL_MATCH_FIELD_NAME] == 0,
        distance_high,
        distance_mid,
        distance_low
    ]


ACCURACY_LEVEL_CHOICES = [
    cpq_c.ACCURACY_LEVEL_INVALID,
    cpq_c.ACCURACY_LEVEL_HIGH,
    cpq_c.ACCURACY_LEVEL_MEDIUM,
    cpq_c.ACCURACY_LEVEL_LOW
]


def interpolate_reference_positions(
        gt_position_df: pd.DataFrame,
        final_position_df: pd.DataFrame,
        output_spatial_reference: arcpy.SpatialReference,
        progressor: u_io.Progressor = None) -> pd.DataFrame:
    """interpolates the given gt_positions df at the timestamps
     in the final_positions df

    Args:
        gt_position_df (pd.DataFrame): ground-truth positions
            ['t', 'type', 'floor', 'longitude', 'latitude', 'Positioning GUID',
            'Recording GUID', 'Level ID', 'Bluetooth', 'WiFi']
        final_position_df (pd.DataFrame):
            ['t', 'type', 'floor', 'longitude', 'latitude', 'Positioning GUID',
            'Recording GUID', 'Level ID', 'Bluetooth', 'WiFi']
        output_spatial_reference: the spatial reference of the
            interpolated geometries
        progressor: optional Progressor object to update Progressor position when
            processing individual records

    Returns: pd.Dataframe
        ['IPS Time'
        'Positioning GUID', 'Recording GUID', 'Level ID',
        'Bluetooth Positioning', 'WiFi Positioning', 'SHAPE']

    """
    wgs84_crs = arcpy.SpatialReference(4326)
    reference_points = []

    unique_gt_position_df = gt_position_df.groupby(
        c.RECORDING_GUID_FIELD_NAME)
    if progressor:
        progressor.set_small_increment(len(unique_gt_position_df.count()))
    # process by recording
    for recording_GUID, rec_gt_position_df in unique_gt_position_df:
        # extract
        (level_id, positioning_GUID,
         rec_bluetooth, rec_wifi) = rec_gt_position_df.iloc[0][[
            c.LEVEL_ID_FIELD_NAME, c.POSITIONING_GUID_FIELD_NAME,
            c.BLUETOOTH_POSITIONING_FIELD_NAME, c.WIFI_POSITIONING_FIELD_NAME]]

        # select the corresponding final positions
        rec_final_position_df = final_position_df[
            final_position_df[c.RECORDING_GUID_FIELD_NAME] == recording_GUID]

        # transform lon/lat coordinates into geometries and project them
        # into the given output spatial reference
        gt_point_geoms = [u_geom.xy2point_geometry(
            x=lon, y=lat,
            spatial_reference=wgs84_crs).projectAs(
            spatial_reference=output_spatial_reference
        ) for lon, lat in rec_gt_position_df[['longitude', 'latitude']].values]

        # interpolate ground-truth points at the IPS times contained in the
        # final position dataframe
        interp_ts, interp_point_geoms = cpq_u_geom.interpolate_polyline(
            ts=rec_gt_position_df['t'].values, ps=gt_point_geoms,
            interp_times=rec_final_position_df['t'].values)

        # append the interpolated reference points to the list
        # together with all necessary attributes
        for interp_t, interp_point_geom in zip(interp_ts, interp_point_geoms):
            reference_points.append(
                (interp_t,
                 positioning_GUID, recording_GUID, level_id,
                 rec_bluetooth, rec_wifi, interp_point_geom))
        if progressor:
            progressor.increment(smaller_increment=True)

    # create and return a dataframe from the list of interpolated points
    return pd.DataFrame(reference_points, columns=[
        c.IPS_TIME_FIELD_NAME,
        c.POSITIONING_GUID_FIELD_NAME, c.RECORDING_GUID_FIELD_NAME, c.LEVEL_ID_FIELD_NAME,
        c.BLUETOOTH_POSITIONING_FIELD_NAME, c.WIFI_POSITIONING_FIELD_NAME,
        c.SHAPE_FIELD_NAME])


def compute_line_of_sight(
        merged_df: pd.DataFrame,
        quality_sr: arcpy.SpatialReference,
        in_indoors_details_features: Union[
            arcpy.Parameter, str] = None) -> pd.DataFrame:
    """Computes the line of sight between Reference and Computed Positions

    Args:
        merged_df: A 'merged' DataFrame containing both the Computed and
            Reference Positions
        quality_sr: The Coordinate System of the quality recordings fc
        in_indoors_details_features: The building details provided by the
        indoors data model. These contain the obstacles (e.g. walls)
        that determine the line of sight between two points.
        If not specified, the LOS is NULL

    Returns: The input DataFrame containing the new column 'LOS_TO_COMPUTED_FIELD_NAME'

    """

    # extract the parameter name, if available the string for warning
    if isinstance(in_indoors_details_features, arcpy.Parameter):
        param_name = in_indoors_details_features.displayName
        in_indoors_details_features = in_indoors_details_features.valueAsText
    else:
        param_name = 'Sight Blocking Details Features'

    # by default, set LOS to NULL for all positions
    merged_df[c.LOS_TO_COMPUTED_FIELD_NAME] = None

    # if the indoors details are not given, LOS is NULL
    if in_indoors_details_features is None:
        return merged_df

    details_fn_mapping = u.create_field_name_dict(
        data_element=in_indoors_details_features,
        xml_schema_path=c.INDOORS_MODEL_XML_SCHEMA_PATH,
        xml_element_name=c.DETAILS_NAME,
        is_in_dataset=True
    )
    details_df = u_db.fc2sdf(fc=in_indoors_details_features,
                        field_names_dict=details_fn_mapping)

    # input Indoor Details don't contain any (line) features, raise warning
    if details_df.empty:
        arcpy.AddIDMessage('WARNING', 250048, c.DISPLAY_NAME_CPQ_DETAILS)
        return merged_df

    details_desc = arcpy.Describe(in_indoors_details_features)
    details_sr = details_desc.spatialReference

    # compute line-of-sight lines in the spatial reference of the given details
    # in most of the cases details will be much more than quality references,
    # so this is more efficient than reprojecting the details
    merged_df['los_line'] = merged_df[
        [f'{c.SHAPE_FIELD_NAME}_reference', f'{c.SHAPE_FIELD_NAME}_computed']].apply(
        lambda r: arcpy.Polyline(
            arcpy.Array([r[f'{c.SHAPE_FIELD_NAME}_reference'].firstPoint,
                         r[f'{c.SHAPE_FIELD_NAME}_computed'].firstPoint]),
            spatial_reference=quality_sr,
            has_z=False).projectAs(details_sr),
        axis=1
    )

    # group the details per floor (one single polyline per floor),
    # the intersection check is done by floor
    level_id2obstacles = {}
    for level_id, level_details in details_df.groupby(c.LEVEL_ID_FIELD_NAME):
        obstacle_array = []
        for geo in level_details.SHAPE.geom.as_arcpy:
            if geo:
                for line in geo.getPart():
                    obstacle_array.append(line)
        obstacle_array = arcpy.Array(obstacle_array)
        level_id2obstacles[level_id] = arcpy.Polyline(
            obstacle_array,
            spatial_reference=details_sr,
            has_z=False)

    for level_id, level_df in merged_df.groupby(f'{c.LEVEL_ID_FIELD_NAME}_reference'):
        if level_id not in level_id2obstacles:
            arcpy.AddIDMessage("WARNING", 250049, param_name, level_id)
            continue

        # compute line of sight
        level_obstacles = level_id2obstacles[level_id]
        merged_df.loc[level_df.index, c.LOS_TO_COMPUTED_FIELD_NAME] = level_df.apply(
            lambda r: not r['los_line'].crosses(level_obstacles)
            if r[c.LEVEL_MATCH_FIELD_NAME] else None, axis=1)
    return merged_df


def get_computed_positions(
        final_position_df: pd.DataFrame,
        out_spatial_reference: arcpy.SpatialReference) -> pd.DataFrame:
    """converts final position into computed position dataframe

    Args:
        final_position_df: ['t', 'type', 'longitude', 'latitude', 'ancestor',
            'Positioning GUID', 'Recording GUID', 'Level ID',
            'Bluetooth', 'WiFi']
        out_spatial_reference: the desired spatial reference for the geometries

    Returns: ['IPS Time',
            'Positioning GUID', 'Recording GUID', 'Level ID',
            'Location Source', 'SHAPE@']
    """
    computed_position_df = final_position_df.rename(
        columns={'t': c.IPS_TIME_FIELD_NAME})[[
        c.IPS_TIME_FIELD_NAME, c.POSITIONING_GUID_FIELD_NAME,
        c.RECORDING_GUID_FIELD_NAME, c.LEVEL_ID_FIELD_NAME]]

    # convert the ancestor field to the location source field
    computed_position_df[c.LOCATION_SOURCE_FIELD_NAME] = final_position_df[
        'ancestor'].apply(
        lambda a: cpq_c.LEGACY_POSITIONTYPE2POSITION_SOURCE.get(a, 0))

    # compute point geometries for the computed positions
    # as of today, those are stored as lon/lat, so we need
    # to reproject them into the desired spatial_reference
    wgs84_crs = arcpy.SpatialReference(4326)
    computed_position_df[c.SHAPE_FIELD_NAME] = final_position_df.apply(
        lambda row: u_geom.xy2point_geometry(
            x=row['longitude'], y=row['latitude'],
            spatial_reference=wgs84_crs).projectAs(
            spatial_reference=out_spatial_reference),
        axis=1)

    return computed_position_df


def compute_positioning_quality(
        reference_positions_fc: str,
        computed_positions_fc: str,
        in_ips_recordings_features: str,
        data_dir: str,
        in_sight_blocking_details_features: Union[arcpy.Parameter, str] = None):
    """Computes the positioning quality by reading quality recordings and the
    details from the indoors features (optional). It stores the output in the
    IPS Quality dataset created by the Create IPS Quality Dataset tool.

    Args:
        reference_positions_fc: IPS Quality dataset's Reference Positions
        computed_positions_fc: IPS Quality dataset Computed Positions
        in_ips_recordings_features: Line feature class containing IPS
            quality recordings collected via the ArcGIS IPS Setup App
        data_dir: path to where the data created in the process is stored
        in_sight_blocking_details_features: Line feature class consisting
            of sight-blocking features

    Returns:

    """
    progressor = u_io.Progressor(step_num=6)

    out_spatial_reference = \
        arcpy.Describe(reference_positions_fc).spatialReference

    ips_recordings_fn_map = u.create_field_name_dict(
        data_element=in_ips_recordings_features,
        xml_schema_path=c.MODEL_30.XML_PATH,
        xml_element_name=c.MODEL_30.IPS_RECORDINGS.NAME)

    # load all given recordings into a dataframe
    ips_recordings_df = u_db.fc2sdf(fc=in_ips_recordings_features,
                                    field_names_dict=ips_recordings_fn_map)

    # Step 1 - Validate  and filter recordings with invalid attributes
    progressor.update_label(message_id=250053)

    ips_recordings_df = cpq_v.filter_recordings_attributes(
        ips_recordings_df=ips_recordings_df)

    ips_recordings_df = \
        cpq_v.filter_single_attachment(recordings_df=ips_recordings_df,
                                       recordings_fc=in_ips_recordings_features)
    progressor.increment()

    # Step 2 - Extracting recordings
    progressor.update_label(message_id=250008)

    # download recording files
    valid_object_ids = sorted(ips_recordings_df[
        c.OBJECT_ID_FIELD_NAME].values.tolist())

    progressor.set_small_increment(sub_steps=len(valid_object_ids))

    attachment_df = pd.DataFrame(
        map(progressor.generator_increment, u_db.extract_attachments(
            table=in_ips_recordings_features,
            target_dir=data_dir,
            object_ids=valid_object_ids
        )),
        columns=[c.DF_FILE_PATH_COLUMN,
                 c.OBJECT_ID_FIELD_NAME,
                 c.DF_ATT_OID_COLUMN])

    # expand the recording dataframe with attachment info
    ips_recordings_df = pd.merge(
        left=ips_recordings_df, right=attachment_df,
        on=c.OBJECT_ID_FIELD_NAME)

    # Step 3 - validating attachment
    progressor.update_label(message_id=250054)
    recording_access_df = pd.DataFrame(
        map(progressor.generator_increment,
            cpq_v.validate_recording_files(ips_recordings_df)),
        columns=[c.OBJECT_ID_FIELD_NAME,
                 c.DF_RECORDING_ACCESS_COLUMN])

    # filter recordings with invalid data
    recording_access_df = recording_access_df[
        ~recording_access_df[c.DF_RECORDING_ACCESS_COLUMN].isna()]

    # expand the recording dataframe with recording_access and
    # filter out rows with invalid recording files
    ips_recordings_df = pd.merge(
        left=ips_recordings_df, right=recording_access_df,
        on=c.OBJECT_ID_FIELD_NAME)

    # check if all the rows are filtered out
    if ips_recordings_df.empty:
        raise v.NoValidRecordings

    # Step 4 - processing attachments
    progressor.update_label(message_id=250010)

    gt_position_df, final_position_df = get_gt_and_final_positions(
        ips_recordings_df=ips_recordings_df)

    reference_positions_df = interpolate_reference_positions(
        gt_position_df=gt_position_df,
        final_position_df=final_position_df,
        output_spatial_reference=out_spatial_reference,
        progressor=progressor)

    computed_position_df = get_computed_positions(
        final_position_df=final_position_df,
        out_spatial_reference=out_spatial_reference
    )

    # merge reference and computed positions
    merged_df = pd.merge(
        left=reference_positions_df, right=computed_position_df,
        on=[c.RECORDING_GUID_FIELD_NAME, c.IPS_TIME_FIELD_NAME,
            c.POSITIONING_GUID_FIELD_NAME],
        suffixes=('_reference', '_computed'))

    # compute level match
    merged_df[c.LEVEL_MATCH_FIELD_NAME] = merged_df.apply(
        lambda r: (r[f'{c.LEVEL_ID_FIELD_NAME}_computed'] == r[
            f'{c.LEVEL_ID_FIELD_NAME}_reference']),
        axis=1)

    # Step 5 - computing positioning quality
    progressor.update_label(message_id=250055)
    # compute line-of-sight
    merged_df = compute_line_of_sight(
        merged_df=merged_df,
        quality_sr=out_spatial_reference,
        in_indoors_details_features=in_sight_blocking_details_features)

    # compute distance
    # all point geometries must be of the same type,
    # so we can use the first one to decide
    # if we want to compute a planar or geodesic distance
    distance_type = "PLANAR" \
        if merged_df.iloc[0][
               f'{c.SHAPE_FIELD_NAME}_reference'].spatialReference.type == "Projected" \
        else "GEODESIC"

    merged_df[c.DISTANCE_TO_COMPUTED_FIELD_NAME] = merged_df.apply(
        lambda row: row[f'{c.SHAPE_FIELD_NAME}_reference'].angleAndDistanceTo(
            row[f'{c.SHAPE_FIELD_NAME}_computed'], distance_type)[1] if row[
            c.LEVEL_MATCH_FIELD_NAME] else None,
        axis=1
    )

    # compute accuracy level
    merged_df[c.ACCURACY_LEVEL_FIELD_NAME] = np.select(
        accuracy_level_conditions(merged_df),
        ACCURACY_LEVEL_CHOICES)
    progressor.increment()

    # Step 6 - processing attachment
    progressor.update_label(message_id=250056)
    # split the merged df into final computed positions and
    # reference positions dataframes that have the exact
    # same schema of the output feature classes
    computed_position_df = merged_df[[
        f'{c.LEVEL_ID_FIELD_NAME}_computed', c.RECORDING_GUID_FIELD_NAME,
        c.IPS_TIME_FIELD_NAME, f'{c.SHAPE_FIELD_NAME}_computed']].rename(
        columns={f'{c.LEVEL_ID_FIELD_NAME}_computed': c.LEVEL_ID_FIELD_NAME,
                 f'{c.SHAPE_FIELD_NAME}_computed': c.SHAPE_FIELD_NAME})

    # convert IPS time to be datetime objects
    computed_position_df[c.IPS_TIME_FIELD_NAME] = computed_position_df[
        c.IPS_TIME_FIELD_NAME].apply(lambda t: datetime.fromtimestamp(t))

    reference_position_df = merged_df[[
        f'{c.LEVEL_ID_FIELD_NAME}_reference', c.RECORDING_GUID_FIELD_NAME,
        c.IPS_TIME_FIELD_NAME, c.POSITIONING_GUID_FIELD_NAME,
        c.BLUETOOTH_POSITIONING_FIELD_NAME, c.WIFI_POSITIONING_FIELD_NAME,
        c.DISTANCE_TO_COMPUTED_FIELD_NAME, c.ACCURACY_LEVEL_FIELD_NAME,
        c.LOS_TO_COMPUTED_FIELD_NAME, c.LEVEL_MATCH_FIELD_NAME,
        c.LOCATION_SOURCE_FIELD_NAME, f'{c.SHAPE_FIELD_NAME}_reference']].rename(
        columns={f'{c.LEVEL_ID_FIELD_NAME}_reference': c.LEVEL_ID_FIELD_NAME,
                 f'{c.SHAPE_FIELD_NAME}_reference': c.SHAPE_FIELD_NAME})

    # convert IPS time to be datetime objects
    reference_position_df[c.IPS_TIME_FIELD_NAME] = reference_position_df[
        c.IPS_TIME_FIELD_NAME].apply(lambda t: datetime.fromtimestamp(t))

    reference_fn_map = u.create_field_name_dict(
        data_element=reference_positions_fc,
        xml_schema_path=c.MODEL_QUALITY_31.XML_PATH,
        xml_element_name=c.MODEL_QUALITY_31.REFERENCE_POSITIONS.NAME,
        is_in_dataset=True)
    computed_fn_map = u.create_field_name_dict(
        data_element=computed_positions_fc,
        xml_schema_path=c.MODEL_QUALITY_31.XML_PATH,
        xml_element_name=c.MODEL_QUALITY_31.COMPUTED_POSITIONS.NAME,
        is_in_dataset=True)

    # convert Reference and Computed Positions to 3D Points using the Z value of the Quality Recordings
    # if there is no Z value in the Quality Recordings, the Z value is set to 0.0
    reference_position_df, computed_position_df = cpq_u_geom.make_quality_points_3d(
        reference_position_df=reference_position_df,
        computed_position_df=computed_position_df,
        ips_recordings_df=ips_recordings_df)

    # ensure to write the arcpy geometries using the SHAPE@ special column name
    reference_fn_map[c.SHAPE_FIELD_NAME] = "SHAPE@"
    computed_fn_map[c.SHAPE_FIELD_NAME] = "SHAPE@"

    # write the dataframes to the corresponding feature class
    u_db.df2fc_insert(df=reference_position_df, fc=reference_positions_fc,
                      field_names_dict=reference_fn_map)

    u_db.df2fc_insert(df=computed_position_df, fc=computed_positions_fc,
                      field_names_dict=computed_fn_map)
    progressor.increment()
