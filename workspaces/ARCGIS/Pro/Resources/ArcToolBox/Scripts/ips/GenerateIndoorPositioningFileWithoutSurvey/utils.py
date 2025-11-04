import tempfile
from typing import Tuple, Generator

import arcpy
import indoorsdatapy.common.const.network_type as type
import ips.GenerateIndoorPositioningFile.utils as gipf_u
import ips.GenerateIndoorPositioningFile.utils_db as gipf_u_db
import ips.GenerateIndoorPositioningFileWithoutSurvey.const as gipfws_c
import ips.GenerateIndoorPositioningFileWithoutSurvey.utils_geom as gipfws_u_geom
import ips.GenerateIndoorPositioningFileWithoutSurvey.validation as gipfws_v
import ips.const as c
import ips.utils_io as u_io
import ips.validation as v
import numpy as np
import pandas as pd

# global progressor
progressor = u_io.Progressor(step_num=4)


def generate_indoor_positioning_file_without_survey(
        target_positioning_table: str,
        in_beacon_features: str,
        in_ips_area_features: str,
        in_wall_features: str,
        in_level_features: str,
        in_facility_features: str,
        in_ips_transition_features: str = None,
        air_attenuation: float = 1.8,
        matter_attenuation: float = 2.07,
        min_rssi_threshold: float = -102.5,
        comment: str = None,
        parameter_names_dict: dict = None) -> None:
    """
    Generates a "Survey-less" Positioning File using the RadioMap Generator

    * creates signal distributions

    Args:
        target_positioning_table: path to Positioning Table
        in_beacon_features: path to Beacons Feature Class
        in_ips_area_features: path to Feature Class denoting the IPS Area
        in_wall_features: path to Feature Class denoting the Wall Features
        in_level_features: path to Levels Feature Class
        in_facility_features: path to Facility Feature Class
        in_ips_transition_features: path to Transitions Feature Class
        air_attenuation: radio attenuation factor for air medium
                         default value: 1.8
        matter_attenuation: radio attenuation factor for matter (wall) medium
                            default value: 2.07
        min_rssi_threshold: rssi value denoting that a signal is not visible/
                            received; default value: -102.5 db
        comment: optional user comment
        parameter_names_dict: optional dictionary for the parameter display
                              names used for gp messages

    Returns:
        None

    """

    global progressor

    progressor = u_io.Progressor(step_num=4)

    if not parameter_names_dict:
        parameter_names_dict = {
            gipfws_c.BEACONS_PARAM: gipfws_c.BEACONS_PARAM,
            gipfws_c.IPS_AREAS_PARAM: gipfws_c.IPS_AREAS_PARAM,
            gipfws_c.WALLS_PARAM: gipfws_c.WALLS_PARAM,
            gipfws_c.FACILITIES_PARAM: gipfws_c.FACILITIES_PARAM,
            gipfws_c.LEVELS_PARAM: gipfws_c.LEVELS_PARAM}

    # Step 0: read inputs
    # --------------------------------------------
    beacons_df = u_io.read_beacons(in_beacon_features=in_beacon_features)
    ips_area_df = u_io.read_ips_areas(in_ips_area_features=in_ips_area_features)
    walls_df = u_io.read_walls(in_wall_features=in_wall_features)
    level_df = u_io.read_levels(in_level_features=in_level_features)
    facility_df = u_io.read_facilities(in_facility_features=in_facility_features)
    ips_transition_df = u_io.read_transitions(transitions_fc=in_ips_transition_features)

    # --------------------------------------------------
    #  Step 1 - Validating attributes
    # --------------------------------------------------
    progressor.update_label(message_id=250053)
    progressor.set_small_increment(sub_steps=9)
    (beacons_df, ips_area_df, walls_df, level_df,
     facility_df, ips_transition_df) = progressor.generator_increments(
        gen=gipfws_v.validate_attributes(beacons_df, ips_area_df, walls_df,
                                         level_df, facility_df, ips_transition_df,
                                         parameter_names_dict))

    (beacons_df, ips_area_df, walls_df, level_df,
     facility_df, ips_transition_df) = progressor.generator_increments(
        gen=gipfws_v.cross_validate_attributes(beacons_df, ips_area_df, walls_df,
                                               level_df, facility_df, ips_transition_df,
                                               parameter_names_dict))

    # Check for single site
    v.validate_single_site(df=level_df)

    # --------------------------------------------------
    #  Step 2 - Validating geometries
    # --------------------------------------------------
    progressor.update_label(message_id=250070)  # Validating geometries...
    progressor.set_small_increment(sub_steps=6)

    (beacons_df, ips_area_df, walls_df, level_df,
     ips_transition_df, origin_point, origin_lat,
     origin_lon) = progressor.generator_increments(
        gen=gipfws_v.validate_geometry(
            beacons_df, ips_area_df, walls_df, level_df,
            ips_transition_df, parameter_names_dict))

    # --------------------------------------------------
    #  Step 3 - Generating indoor positioning data
    # --------------------------------------------------
    progressor.update_label(message_id=250011)  # Generating indoor positioning data...
    progressor.set_small_increment(sub_steps=len(level_df))

    fingerprint_df = progressor.generator_increments(
        gen=predict_fingerprints(
            level_df=level_df, ips_area_df=ips_area_df,
            walls_df=walls_df, beacons_df=beacons_df,
            air_attenuation=air_attenuation,
            matter_attenuation=matter_attenuation,
            min_rssi_threshold=min_rssi_threshold))

    portal_df = gipf_u.convert_transitions_to_portals(
        origin_lon=origin_lon,
        origin_lat=origin_lat,
        transition_df=ips_transition_df
    )

    # --------------------------------------------------
    #  Step 4 - Saving indoor positioning data
    # --------------------------------------------------
    progressor.update_label(message_id=250012)  # Saving indoor positioning data...
    tempfile.TemporaryDirectory.cleanup = gipf_u.cleanup_patch
    with tempfile.TemporaryDirectory() as target_dir:
        # write data into legacy db
        legacy_db = gipf_u.create_legacy_db(fingerprint_df=fingerprint_df,
                                            portal_df=portal_df,
                                            origin_lat=origin_lat,
                                            origin_lon=origin_lon,
                                            target_dir=target_dir)

        radio_types = fingerprint_df.transmitter_type.unique()
        ble = type.IBEACON in radio_types
        wifi = type.WLAN in radio_types
        site_id = level_df.iloc[0][c.SITE_ID_FIELD_NAME]

        gipf_u_db.insert_building_db_in_table(
            legacy_db,
            site_id=site_id,
            positioning_table=target_positioning_table,
            comment=comment,
            ble=int(ble),
            wifi=int(wifi))
    progressor.increment()
    arcpy.AddIDMessage('INFORMATIVE', 250058,
                       ','.join([str(oid) for oid in sorted(level_df[c.OBJECT_ID_FIELD_NAME].values.tolist())]))


def predict_fingerprints(level_df: pd.DataFrame,
                         ips_area_df: pd.DataFrame,
                         walls_df: pd.DataFrame,
                         beacons_df: pd.DataFrame,
                         air_attenuation: float = 1.8, matter_attenuation: float = 2.07,
                         min_rssi_threshold: float = -102.5
                         ) -> Generator[str, None, pd.DataFrame]:
    """Generates a "Survey-less" Positioning File using the RadioMap Generator
    The fingerprints are created one Level at a time

    Args:
        level_df: dataframe containing the level
        ips_area_df: dataframe containing the ips area
        walls_df: dataframe containing the wall
        beacons_df: dataframe containing the beacons
        air_attenuation: radio attenuation factor for air medium
                         default value: 1.8
        matter_attenuation: radio attenuation factor for matter (wall) medium
                            default value: 2.07
        min_rssi_threshold: rssi value denoting that a signal is not visible/
                            received; default value: -102.5 db

    Yields: Level ID of the level that was just processed

    Raises: EmptyRadiomapError in case of empty fingerprint dataframe

    Returns: predicted fingerprint DF: ['point_id', 'x', 'y', 'vertical_order',
                                 'rssi_mean', 'rssi_var', 'rssi_std',
                                 'transmitter_id', 'transmitter_type', 'transmitter_occ', 'ssid', 'bssid']

    """

    # dissolve the walls by level: this is necessary ti fulfill a crucial assumption of the core algorithm!
    # if we would not do this we could get unpredictable results in case multiple walls partially or totally overlap.
    walls_df = gipfws_u_geom.dissolve_by_level(sdf=walls_df, level_col=c.LEVEL_ID_FIELD_NAME)
    ips_area_df = gipfws_u_geom.dissolve_by_level(sdf=ips_area_df, level_col=c.LEVEL_ID_FIELD_NAME)

    # TODO: this is an edge case, but if we have 2 adjacent levels, the signals of a beacon in one
    #  level should propagate in the other one too. Since we do the processing per level_id this will
    #  never happen. If we want to cover this case we should do the processing per VERTICAL_ORDER instead
    level_predicted_fp_dfs = []
    for _, level in level_df.iterrows():
        level_id, vertical_order = level[c.LEVEL_ID_FIELD_NAME], \
            level[c.VERTICAL_ORDER]

        level_ips_area = ips_area_df[ips_area_df[c.LEVEL_ID_FIELD_NAME] == level_id]
        level_walls_df = walls_df[walls_df[c.LEVEL_ID_FIELD_NAME] == level_id]
        level_beacons_df = beacons_df.loc[beacons_df[c.LEVEL_ID_FIELD_NAME] == level_id]

        full_hex_grid = gipfws_u_geom.covering_hex_cells(level_ips_area.spatial.full_extent)
        full_hex_grid_df = pd.DataFrame.spatial.from_xy(
            df=pd.DataFrame(full_hex_grid, columns=list('xy')),
            x_column='x', y_column='y', sr=3857)

        contained_hex_grid = full_hex_grid_df.spatial.join(level_ips_area, op='within')[['x', 'y']].values

        # TODO: we shall get rid of the vertex_array column in the future and just work with the json (i.e. SHAPE col)
        # create a segment array representing all the edges of all walls of this level
        wall_segment_array = np.vstack(
            [gipfws_u_geom.vertex_array2segment_array(vertex_array=va)
             for vas in level_walls_df[c.SDF_VERTEX_ARRAY_COLUMN]
             for va in vas])

        level_predicted_fp_df = predict_floor_fingerprints(
            wall_segment_array=wall_segment_array,
            receiving_point_xy_array=contained_hex_grid,
            transmitting_beacons=level_beacons_df,
            receiving_point_ids=None,
            vertical_order=vertical_order,
            air_attenuation=air_attenuation,
            matter_attenuation=matter_attenuation,
            min_rssi_threshold=min_rssi_threshold
        )
        level_predicted_fp_dfs.append(level_predicted_fp_df)
        yield level_id

    predicted_fp_df = pd.concat(level_predicted_fp_dfs)

    # check for empty radio map -> Error
    if predicted_fp_df.empty:
        raise v.EmptyRadiomapError

    predicted_fp_df.rename(columns={'mean_rssi': 'rssi_mean',
                                    'floor_level': 'vertical_order',
                                    'std_rssi': 'rssi_std'},
                           inplace=True)
    predicted_fp_df['rssi_var'] = np.power(predicted_fp_df['rssi_std'], 2)

    return predicted_fp_df


def predict_floor_fingerprints(
        wall_segment_array: np.array,
        receiving_point_xy_array: np.array,
        transmitting_beacons: pd.DataFrame,
        air_attenuation: float,
        matter_attenuation: float,
        min_rssi_threshold: float,
        receiving_point_ids=None,
        vertical_order: int = None) -> pd.DataFrame:
    """
    MaGe

    Args:
        positions of beacons in the local coordinate system
        wall_segment_array: all straight segments of walls of a level
        receiving_point_xy_array: fingerprint points of a level
        transmitting_beacons: the beacons dataframe of a level
        air_attenuation: radio attenuation factor for air medium
        matter_attenuation: radio attenuation factor for matter (wall) medium
        min_rssi_threshold: rssi value denoting that a signal is not visible/
                            received
        receiving_point_ids: ids for receiving points (fingerprints)
        vertical_order: the floor vertical order

    Returns:
         A dataframe with the calculated fingerprint points values

    """
    # TODO: we can replace all the input to be dataframes (?)
    #  - wall_segment_array -> wall_segment_df [x0, y0, x1, y1]
    #  - receiving_point_xy_array -> receiving_point_df [id, x, y, floor, level_id]

    if receiving_point_ids is None:
        receiving_point_ids = list(range(receiving_point_xy_array.shape[0]))

    basic_fingerprint_list = []
    for _, beacon in transmitting_beacons.iterrows():
        grid_power_level = decay_f(
            transmitter_position=(beacon.SHAPE.x, beacon.SHAPE.y),
            transmitter_p0=beacon[c.RSSI_1M_FIELD_NAME],  # beacon.P0,
            transmitter_d0=1.,  # beacon.d0
            receiver_position_array=receiving_point_xy_array,
            wall_segment_array=wall_segment_array,
            air_attenuation=air_attenuation,
            matter_attenuation=matter_attenuation,
            min_rssi_threshold=min_rssi_threshold,
        )

        row_num = len(receiving_point_xy_array[:, 0])

        # iBeacon ssids have the pattern : uuid.major.minor
        # use int() for minor/major because possible np.nan causes float conversion
        ssid = f"{beacon[c.UUID_FIELD_NAME]}.{int(beacon[c.MAJOR_FIELD_NAME])}." \
               f"{int(beacon[c.MINOR_FIELD_NAME])}"

        basic_fingerprint_list.extend(
            zip(
                receiving_point_ids,  # point_id
                receiving_point_xy_array[:, 0],  # x
                receiving_point_xy_array[:, 1],  # y
                [ssid] * row_num,  # ssid
                ["{}_{}".format(type.IBEACON, ssid)] *
                row_num,  # transmitter_id
                [type.IBEACON] * row_num,  # transmitter_type
                [1] * row_num,  # transmitter_occ
                [beacon[c.OBJECT_ID_FIELD_NAME]] * row_num,  # bssid
                grid_power_level,  # mean_rssi
                [gipfws_c.DEFAULT_STD_RSSI] * row_num  # std_rssi
            ))

    basic_fingerprint_df = pd.DataFrame(
        basic_fingerprint_list,
        columns=gipfws_c.BASIC_FINGERPRINT_DF_COLUMNS)

    basic_fingerprint_df = basic_fingerprint_df[
        basic_fingerprint_df['mean_rssi'] > min_rssi_threshold].reset_index(
        drop=True)

    basic_fingerprint_df['vertical_order'] = vertical_order

    return basic_fingerprint_df


def decay_f(transmitter_position: Tuple,
            transmitter_p0: float,
            transmitter_d0: float,
            receiver_position_array: np.ndarray,
            wall_segment_array: np.ndarray,
            air_attenuation: float,
            matter_attenuation: float,
            min_rssi_threshold: float) -> np.ndarray:
    """
    Computes the rssi of the given transmitter at the given receiver points
    considering the given walls.
    Applies Radio MaGe formula (with unlimited crossed walls).

    Args:
        transmitter_position: (x, y) in the local coordinate system
        transmitter_p0: rssi of the transmitter at distance d0
        transmitter_d0: distance where the transmitter rssi is equal to p0
        receiver_position_array: position of receiver points (nx2): [x, y]
        wall_segment_array: (mx4) array of coordinates: [x0, y0, x1, y1]
        air_attenuation: radio attenuation factor for air medium
                         default value: 1.8
        matter_attenuation: radio attenuation factor for matter (wall) medium
                            default value: 2.07
        min_rssi_threshold: rssi value denoting that a signal is not visible/
                            received; default value: -102.5 db

    Returns:
        RSSI values for each of the passed receiver points

    """
    # assign an artificial id to the transmitter (required in the
    # transmitter_receiver_df but will not be used)
    transmitter_data = np.array([1, transmitter_position[0],
                                 transmitter_position[1]])
    # create the transmitter_receiver_df
    transmitter_receiver_df = pd.DataFrame(
        np.hstack([
            np.broadcast_to(transmitter_data,
                            (len(receiver_position_array), 3)),
            np.array(range(len(receiver_position_array)))[:, None],
            receiver_position_array
        ]),
        columns=['id_t', 'x_t', 'y_t', 'id_r', 'x_r', 'y_r'])

    # compute transmitter-receiver distance
    transmitter_receiver_df['t2r_dist'] = ((transmitter_receiver_df[
                                                'x_r'] -
                                            transmitter_receiver_df[
                                                'x_t']) ** 2 +
                                           (transmitter_receiver_df[
                                                'y_r'] -
                                            transmitter_receiver_df[
                                                'y_t']) ** 2) ** .5

    # optimization: only process transmitter-receiver pairs that are within the
    # RADIO_SIGNAL_MAX_RANGE
    transmitter_receiver_to_process_mask = \
        transmitter_receiver_df['t2r_dist'] <= gipfws_c.RADIO_SIGNAL_MAX_RANGE
    transmitter_receiver_df_to_process = transmitter_receiver_df[
        transmitter_receiver_to_process_mask]
    transmitter_receiver_df_other = transmitter_receiver_df[
        ~transmitter_receiver_to_process_mask]
    transmitter_receiver_id_to_process = \
        transmitter_receiver_df_to_process.index.values
    transmitter_receiver_id_other = transmitter_receiver_df_other.index.values

    # early termination: all points are too far away. This is necessary to avoid
    # crashes in the later functions
    if len(transmitter_receiver_id_to_process) == 0:
        return min_rssi_threshold * np.ones(len(transmitter_receiver_df))

    # optimization: filter the walls that are outside the radio signal range in
    # free space
    t2w_squared_dist = gipfws_u_geom.point2seg_squared_dist(transmitter_position[0],
                                                            transmitter_position[1],
                                                            wall_segment_array[:, 0],
                                                            wall_segment_array[:, 1],
                                                            wall_segment_array[:, 2],
                                                            wall_segment_array[:, 3])

    wall_dist_filter = np.where(
        t2w_squared_dist <= gipfws_c.RADIO_SIGNAL_MAX_RANGE ** 2)
    wall_segment_array = wall_segment_array[wall_dist_filter]

    # create the wall_segment_df
    wall_segment_df = pd.DataFrame(wall_segment_array,
                                   columns=['x0_w', 'y0_w', 'x1_w', 'y1_w'])

    # get an array of transmitter-receiver distances to use for calculations
    t2r_dist_flat = transmitter_receiver_df_to_process['t2r_dist'].values

    # compute the transmitter-wall distances (only until the receiver,
    # after-> masked elements)
    t2w_dist = transmitter2wall_distance(
        transmitter_receiver_df=transmitter_receiver_df_to_process,
        wall_segment_df=wall_segment_df)

    # artificially add d0 as first column
    t2w_dist = np.ma.column_stack(
        [np.tile(transmitter_d0, (t2w_dist.shape[0], 1)), t2w_dist])

    # compute the index j:
    # the index of the last intersection distance smaller than or equal to the
    # transmitter2point distance
    j_indices_flat = np.ma.argmin(
        t2r_dist_flat[:, None] * np.ones(t2w_dist.shape[1]) - t2w_dist,
        axis=1)

    # fill the masked elements with 1. (this is the neutral element for the
    # operations that we want to perform on this matrix) -> results in a normal
    # (not masked) ndarray
    t2w_dist = np.ma.filled(t2w_dist, 1.)

    # also replace d0 with 1. (we treat it manually)
    t2w_dist[:, 0] = 1.

    # get the last distance (d_j) before the receiver
    dist_j_flat = t2w_dist[range(len(t2w_dist)), j_indices_flat]

    # replace the last distance (d_j) before the receiver with 1.
    # (we treat it manually)
    t2w_dist[range(t2w_dist.shape[0]), j_indices_flat] = 1.

    dist_odd = t2w_dist[:, 1::2]
    dist_even = t2w_dist[:, 2::2]

    # compute the exponents (l\in{0,1}) to decide if the receiver is in air
    # (l=1) or not (l=0)
    selection_exp_flat = (j_indices_flat - 1) % 2

    # it is better to split the whole equation into pieces for readability
    alpha1 = t2r_dist_flat / dist_j_flat
    alpha2 = np.power(alpha1, selection_exp_flat)
    alpha3 = alpha2 * np.prod(dist_odd, axis=1) / np.prod(dist_even, axis=1)
    alpha4 = alpha3 * np.power(dist_j_flat,
                               1 - selection_exp_flat) / transmitter_d0
    alpha5 = -10. * np.log10(alpha4)

    beta1 = t2r_dist_flat / dist_j_flat
    beta2 = np.power(beta1, 1 - selection_exp_flat)
    beta3 = beta2 * np.prod(dist_even, axis=1) / np.prod(dist_odd, axis=1)
    beta4 = beta3 * np.power(dist_j_flat, selection_exp_flat)
    beta5 = -10. * np.log10(beta4)

    rssi_computed = transmitter_p0 + air_attenuation * alpha5 + matter_attenuation * beta5

    rssi_all_pairs = np.zeros(len(transmitter_receiver_df))
    rssi_all_pairs[transmitter_receiver_id_to_process] = rssi_computed
    rssi_all_pairs[transmitter_receiver_id_other] = min_rssi_threshold

    return rssi_all_pairs


def transmitter2wall_distance(
        transmitter_receiver_df: pd.DataFrame,
        wall_segment_df: pd.DataFrame,
        max_wall_segment_crossing=None) -> np.ma.core.MaskedArray:
    """
    Computes transmitter-wall distances. Only for walls that fall in between a
    transmitter-receiver segment. Returns a masked np.Array containing a row for
    each given transmitter-receiver pair. The array has as many columns as the
    maximum number of intersections found for a transmitter-receiver pair.
    The distances are sorted in ascending order through the columns.
    Abbreviations:
        - t: transmitter
        - r: receiver
        - w: wall

    Args:
        transmitter_receiver_df: transmitter-receiver pairs;
                                 columns=[id_t, x_t, y_t, id_r, x_r, y_r,...]
        wall_segment_df: wall segments; columns=[x0_w, y0_w, x1_w, y1_w, ...]
        max_wall_segment_crossing: if set, the model does not account for more
        than this number of wall segment intersections

    Returns:
        Sorted distance array

    """
    transmitter_x_flat = transmitter_receiver_df['x_t'].values
    transmitter_y_flat = transmitter_receiver_df['y_t'].values

    # compute intersection info
    segment_array_1 = transmitter_receiver_df[['x_t', 'y_t', 'x_r',
                                               'y_r']].values
    segment_array_2 = wall_segment_df[['x0_w', 'y0_w', 'x1_w', 'y1_w']].values
    intersect_matrix, intersections_x, intersections_y, intersections_s, _ = \
        segments_intersection(
            s1_x0=segment_array_1[:, 0],
            s1_y0=segment_array_1[:, 1],
            s1_x1=segment_array_1[:, 2],
            s1_y1=segment_array_1[:, 3],
            s2_x0=segment_array_2[:, 0],
            s2_y0=segment_array_2[:, 1],
            s2_x1=segment_array_2[:, 2],
            s2_y1=segment_array_2[:, 3])

    if max_wall_segment_crossing is not None:
        max_wall_intersection_count = max_wall_segment_crossing
    else:
        # compute the number of intersections for each transmitter2point
        intersection_count_flat = intersect_matrix.sum(axis=1)
        # compute a parameter of the model
        max_wall_intersection_count = intersection_count_flat.max()

    # make an intersection_mask out of the intersect_matrix that can be used to
    # create masked arrays
    # (in a masked arrays, true values in the mask mean that the corresponding
    # data-element is masked)
    intersection_mask = np.logical_not(intersect_matrix)

    # sort the matrices so to have intersections first
    sort_by_intersect_idx = np.argsort(intersection_mask, axis=1)
    row_idx = np.array(range(intersect_matrix.shape[0]))[:, None] * np.ones(
        intersect_matrix.shape[1], dtype=int)

    intersection_mask = intersection_mask[row_idx, sort_by_intersect_idx]
    intersections_x = intersections_x[row_idx, sort_by_intersect_idx]
    intersections_y = intersections_y[row_idx, sort_by_intersect_idx]
    intersections_s = intersections_s[row_idx, sort_by_intersect_idx]

    # mask the arrays using intersection_mask
    intersections_x = np.ma.masked_array(intersections_x, intersection_mask)
    intersections_y = np.ma.masked_array(intersections_y, intersection_mask)
    intersections_s = np.ma.masked_array(intersections_s, intersection_mask)

    # sort by s
    sort_by_distance_idx = np.ma.argsort(intersections_s, axis=1)
    intersections_x = intersections_x[row_idx, sort_by_distance_idx]
    intersections_y = intersections_y[row_idx, sort_by_distance_idx]

    # get the first max_wall_intersection_count intersection points
    intersections_x = intersections_x[:, :max_wall_intersection_count]
    intersections_y = intersections_y[:, :max_wall_intersection_count]

    # now we have all we need to compute the transmitter-to-intersection-point-distances
    transmitter2intersection_distance = np.ma.sqrt(
        (intersections_x - transmitter_x_flat[:, None] *
         np.ones(max_wall_intersection_count)) ** 2 +
        (intersections_y -
         transmitter_y_flat[:, None] * np.ones(
                    max_wall_intersection_count)) ** 2)

    return transmitter2intersection_distance


def segments_intersection(s1_x0: np.ndarray,
                          s1_y0: np.ndarray,
                          s1_x1: np.ndarray,
                          s1_y1: np.ndarray,
                          s2_x0: np.ndarray,
                          s2_y0: np.ndarray,
                          s2_x1: np.ndarray,
                          s2_y1: np.ndarray,
                          include_end_point: bool = True,
                          epsilon: float = 1e-6):
    """
    Computes intersection data between two arrays of line segments (s1 and s2)

    Args:
        s1_x0: segment array 1: x coordinate of first segment extreme
        s1_y0: segment array 1: y coordinate of first segment extreme
        s1_x1: segment array 1: x coordinate of second segment extreme
        s1_y1: segment array 1: y coordinate of second segment extreme
        s2_x0: segment array 2: x coordinate of first segment extreme
        s2_y0: segment array 2: y coordinate of first segment extreme
        s2_x1: segment array 2: x coordinate of second segment extreme
        s2_y1: segment array 2: y coordinate of second segment extreme
        include_end_point: if False, segments are considered not to intersect
        at their extremes
        epsilon: threshold for coordinate comparison

    Returns:
        inter: (nxm) boolean matrix with element (i,j) == True if the ith s1
                intersects the jth s2
        inter_xs: (nxm) matrix with element (i,j) denoting the x-coordinate of
                the intersection point between the ith s1 and the jth s2
        inter_ys: (nxm) matrix with element (i,j) denoting the
                y-coordinate of the intersection point between the ith s1 and
                the jth s2
        s: (nxm) boolean matrix with element (i,j) the relative position along
                the segment s1 where the supporting lines of s1_i and s2_j
                intersect. NOTE: the matrix element contains a fake value if
                the lines do not intersect (i.e., they are parallel).
        t: (nxm) boolean matrix with element (i,j) the relative position along
                the segment s2 where the supporting lines of s1_i and s2_j
                intersect. NOTE: the matrix element contains a fake value if the
                lines do not intersect (i.e., they are parallel).

    """
    if any([coord_arr.ndim != 1 for coord_arr in (s1_x0, s1_y0, s1_x1, s1_y1,
                                                  s2_x0, s2_y0, s2_x1, s2_y1)]):
        # TODO: we need to catch this and output a proper message instead
        #  (we don't want to raise this outside of our code)
        gipfws_v.ArrayShapeMismatchError(expected_shape='(n,)')

    # TODO we should also check that s1_coord_arrays are all of same size
    #  (and same for s2)

    # get the coordinates of the first set of segments as (nx1) arrays
    s1_x0_col = s1_x0[:, None]
    s1_y0_col = s1_y0[:, None]
    s1_x1_col = s1_x1[:, None]
    s1_y1_col = s1_y1[:, None]

    # get the coordinates of the second set of segments as (1xm) arrays
    s2_x0_row = s2_x0[None, :]
    s2_y0_row = s2_y0[None, :]
    s2_x1_row = s2_x1[None, :]
    s2_y1_row = s2_y1[None, :]

    s1_x = s1_x1_col - s1_x0_col
    s1_y = s1_y1_col - s1_y0_col
    s2_x = s2_x1_row - s2_x0_row
    s2_y = s2_y1_row - s2_y0_row
    m = (-s2_x * s1_y + s1_x * s2_y)

    m_mask = np.abs(m) < epsilon  # this is to deal with (almost) parallel lines
    m[m_mask] = 1  # trick to avoid division errors

    s = ((s1_y0_col - s2_y0_row) * s2_x - (s1_x0_col - s2_x0_row) * s2_y) / m
    t = (-(s1_x0_col - s2_x0_row) * s1_y + (s1_y0_col - s2_y0_row) * s1_x) / m

    if include_end_point:
        inter = (s >= 0) & (s <= 1) & (t >= 0) & (t <= 1)
    else:
        inter = (s > 0 + epsilon) & (s < 1 - epsilon) & (t > 0 + epsilon) & (
                t < 1 - epsilon)
    # (almost) parallel lines meet near infinity, which we deem to be no-intersection
    inter[m_mask] = False

    inter_xs = s1_x0_col + s * s1_x
    inter_ys = s1_y0_col + s * s1_y

    return inter, inter_xs, inter_ys, s, t
