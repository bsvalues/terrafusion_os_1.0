import os.path
import tempfile
from typing import Tuple

import arcpy
import ips.GenerateIndoorPositioningDataset.const as gipd_c
import ips.GenerateIndoorPositioningDataset.dataset_update_utils as gipd_duu
import ips.GenerateIndoorPositioningDataset.utils_db as gipd_u_db
import ips.GenerateIndoorPositioningDataset.validation as gipd_v
import ips.GenerateIndoorPositioningFile.utils as gipf_u
import ips.GenerateIndoorPositioningFile.validation as gipf_v
import ips.GenerateIndoorPositioningFileWithoutSurvey.const as gipfws_c
import ips.GenerateIndoorPositioningFileWithoutSurvey.utils as gipfws_u
import ips.GenerateIndoorPositioningFileWithoutSurvey.utils_geom as gipfws_u_geom
import ips.GenerateIndoorPositioningFileWithoutSurvey.validation as gipfws_v
import ips.const as c
import ips.utils_geom as u_geom
import ips.utils_io as u_io
import ips.validation as v
import pandas as pd
from arcgis.geometry import Point, SpatialReference
from arcpy._mp import Layer

# handy alias for the model to use
M = c.MODEL_LATEST

# global progressor
progressor = u_io.Progressor(step_num=4)


def survey_based_fingerprints(recordings_fc: Layer or str,
                              levels_fc: Layer or str,
                              parameter_names_dict: dict) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Generates fingerprints df from recordings (as done in GIPF)

    Args:
        recordings_fc: recordings FC or map layer
        levels_fc: levels FC or map layer used for cross validation and making the fingerprints floor-aware
        parameter_names_dict: dictionary of parameter display name (used for messaging)

    Returns:
        fingerprint_df with the following fields
         ['x', 'y', 'q', 'r', 'rssi_mean', 'rssi_var', 'vertical_order','transmitter_id',
         'transmitter_type', 'ssid', 'bssid']
        level_df with the filtered level

    """
    # Step 1: read inputs
    # ---------------------------------------------------------------
    progressor.update_label(message_id=250101)
    recording_df = u_io.read_recordings(recordings_fc=recordings_fc)
    level_df = u_io.read_levels(in_level_features=levels_fc)
    progressor.increment()

    # Step 2 - Validating recording and level attributes
    # ---------------------------------------------------------------
    progressor.update_label(message_id=250053)
    progressor.set_small_increment(sub_steps=2)
    recording_df, level_df = progressor.generator_increments(
        gen=gipd_v.validate_attributes(
            recording_df=recording_df, recordings_fc=recordings_fc,
            level_df=level_df, parameter_names_dict=parameter_names_dict)
    )

    # Step 3 - cross validating levels against recordings
    # --------------------------------------------------------------
    progressor.update_label(message_id=250093)
    progressor.set_small_increment(sub_steps=2)
    recording_df, level_df = progressor.generator_increments(
        gen=gipd_v.cross_validate_attributes(
            recording_df=recording_df,
            level_df=level_df, parameter_names_dict=parameter_names_dict)
    )

    # Step 4 - Validate geometry of recordings
    # ---------------------------------------------------------------
    progressor.update_label(message_id=250070)
    recording_df = gipd_v.validate_recording_within_level(recording_df=recording_df,
                                                          level_df=level_df,
                                                          recording_param=parameter_names_dict[gipd_c.RECORDINGS_PARAM])
    progressor.increment()

    tempfile.TemporaryDirectory.cleanup = gipf_u.cleanup_patch
    with tempfile.TemporaryDirectory() as target_dir:
        # Step 5 - Extracting recordings
        # ---------------------------------------------------------------
        progressor.update_label(message_id=250008)
        progressor.set_small_increment(sub_steps=len(recording_df))
        recording_df = progressor.generator_increments(
            gen=gipf_u.extract_recordings(recording_df, recordings_fc, target_dir))

        # Step 6 - Validating recordings files
        # ---------------------------------------------------------------
        progressor.update_label(message_id=250054)
        progressor.set_small_increment(sub_steps=len(recording_df))
        recording_df = progressor.generator_increments(
            gen=gipf_v.validate_recording_files(recording_df, level_df))

    # Step 7 - processing attachments
    # ---------------------------------------------------------------
    progressor.update_label(message_id=250010)
    progressor.set_small_increment(len(recording_df))

    # handle coordinate conversion (slam expects local coordinates)
    origin_lat, origin_lon, floors = gipf_u.calc_legacy_origin(
        recording_accesses=recording_df[c.DF_RECORDING_ACCESS_COLUMN])

    origin = arcpy.PointGeometry(arcpy.Point(origin_lon, origin_lat), c.WGS84_SR)

    recording_df = progressor.generator_increments(
        gen=gipf_u.enrich_recording_accesses(
            recording_df=recording_df,
            legacy_origin=origin))

    # Step 8 - Generating indoor positioning file...
    # ---------------------------------------------------------------
    progressor.update_label(message_id=250011)

    # extend all the Levels with Z values (we need all rows, so re-read the feature class)
    level_df = extend_levels_with_z(df=u_io.read_levels(in_level_features=levels_fc))

    fingerprint_df = gipf_u.create_fingerprints_from_recordings(recording_df=recording_df)

    # make the fingerprint dataframe a spatial dataframe in WGS84
    fingerprint_sdf = u_geom.legacy_df2wgs84_sdf(
        legacy_df=fingerprint_df, origin=origin)

    fingerprint_sdf = make_floor_aware(fingerprint_sdf, level_df)
    progressor.increment()
    return fingerprint_sdf, level_df


def survey_less_fingerprints(
        beacons_fc: Layer or str,
        ips_areas_fc: Layer or str,
        walls_fc: Layer or str,
        levels_fc: Layer or str,
        parameter_names_dict: dict) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Generates fingerprints df from beacons and other inputs (as done in GIPF-WS)

    Args:
        beacons_fc: beacon FC or map layer
        ips_areas_fc: IPS area FC or map layer
        walls_fc: wall FC or map layer
        levels_fc: level FC or map layer
        parameter_names_dict: dictionary of parameter display name (used for messaging)

    Returns: a fingerprint DF: ['x', 'y', 'q', 'r', 'rssi_mean', 'rssi_var', 'vertical_order',
            'transmitter_id', 'transmitter_type', 'ssid', 'bssid']
            level_df with filtered levels

    """
    # Step 1: read inputs
    # --------------------------------------------
    progressor.update_label(message_id=250101)
    beacon_df = u_io.read_beacons(in_beacon_features=beacons_fc)
    ips_area_df = u_io.read_ips_areas(in_ips_area_features=ips_areas_fc)
    wall_df = u_io.read_walls(in_wall_features=walls_fc)
    level_df = u_io.read_levels(in_level_features=levels_fc)
    progressor.increment()

    # --------------------------------------------------
    #  Step 2 - Validating attributes
    # --------------------------------------------------
    progressor.update_label(message_id=250053)
    progressor.set_small_increment(sub_steps=6)
    (beacon_df, ips_area_df, wall_df, level_df,
     _, _) = progressor.generator_increments(
        gen=gipfws_v.validate_attributes(beacon_df, ips_area_df, wall_df,
                                         level_df, None, None,
                                         parameter_names_dict))
    # --------------------------------------------------
    # Step 3 - cross validating data
    # --------------------------------------------------------------
    progressor.update_label(message_id=250093)
    progressor.set_small_increment(sub_steps=3)
    (beacon_df, ips_area_df, wall_df, level_df,
     _, _) = progressor.generator_increments(
        gen=gipfws_v.cross_validate_attributes(beacon_df, ips_area_df, wall_df,
                                               level_df, _, _,
                                               parameter_names_dict))

    level_df = extend_levels_with_z(df=level_df)

    # --------------------------------------------------
    #  Step 4 - Validating geometries
    # --------------------------------------------------
    progressor.update_label(message_id=250070)  # Validating geometries...
    progressor.set_small_increment(sub_steps=6)

    # NOTE: here the dfs are also converted to legacy CRS (fake web mercator)
    (beacon_df, ips_area_df, wall_df, level_df,
     ips_transition_df, origin, origin_lat,
     origin_lon) = progressor.generator_increments(
        gen=gipfws_v.validate_geometry(
            beacon_df, ips_area_df, wall_df, level_df,
            None, parameter_names_dict))

    # validate dataset extent is not too large
    gipd_v.validate_dataset_extent(level_sdf=level_df)

    # --------------------------------------------------
    #  Step 5 - Generating positioning data
    # --------------------------------------------------
    progressor.update_label(message_id=250011)  # Generating indoor positioning data...
    progressor.set_small_increment(sub_steps=len(level_df))

    fingerprint_df = progressor.generator_increments(
        gen=gipfws_u.predict_fingerprints(
            level_df=level_df, ips_area_df=ips_area_df,
            walls_df=wall_df, beacons_df=beacon_df))

    # make the fingerprint dataframe a spatial dataframe in WGS84
    fingerprint_sdf = u_geom.legacy_df2wgs84_sdf(
        legacy_df=fingerprint_df, origin=origin)

    # make the level dataframe a spatial dataframe in WGS84
    level_sdf = u_geom.transform_poly_df(
        sdf=level_df, origin=origin, reverse=True)

    fingerprint_sdf = make_floor_aware(fingerprint_sdf, level_sdf)

    return fingerprint_sdf, level_sdf


def make_floor_aware(fingerprint_df: pd.DataFrame,
                     level_df: pd.DataFrame) -> pd.DataFrame:
    """Makes the given fingerprints floor aware

    Args:
        fingerprint_df: fingerprint df
        level_df: level df

    Returns: fingerprint dataframe enriched with level id column

    """

    # TODO: note that this function works under the assumption that the level geometries with the
    #  same vertical order do not overlap. If the assumption is broken the fingerprints are assigned
    #  to the first level that is found to contain it. We need to discuss if we want to validate
    #  for this and, if so, catch this during validation
    # create a unique point_id column based on unique values of the triplet (x, y, vertical_order)
    if 'point_id' in fingerprint_df.columns:
        fingerprint_df = fingerprint_df.drop(columns='point_id')
    fingerprint_df.insert(
        loc=0, column='point_id',
        value=fingerprint_df.set_index(['x', 'y', 'vertical_order']).index.factorize()[0] + 1)

    point_df = fingerprint_df.drop_duplicates(['point_id'])

    # save the original fingerprint and level spatial reference
    point_sr = point_df.spatial.sr['wkid']
    level_sr = level_df.spatial.sr['wkid']

    # sdfs do not handle well with geographic CRS, so if levels are not projected, use web mercator
    working_sr = level_sr if level_df.spatial.sr.as_arcpy.type == 'Projected' else 3857

    # reproject the dataframes
    point_df.spatial.project(spatial_reference=working_sr)
    level_df.spatial.project(spatial_reference=working_sr)

    # process the data per vertical order. This is necessary because otherwise fingerprints of stacked levels
    # would be assigned ANY of the containing levels in the level dataframe (the first being processed by the join)
    vo_point_in_level_dfs = []
    for vo in set(level_df[c.VERTICAL_ORDER]).intersection(set(point_df['vertical_order'])):
        # select points and levels for the vertical order
        vo_point_df = point_df.loc[point_df['vertical_order'] == vo]
        vo_level_df = level_df.loc[level_df[c.VERTICAL_ORDER] == vo]

        # we need to reset the indices otherwise the spatial join won't work XD
        vo_point_df = vo_point_df.reset_index(drop=True)
        vo_level_df = vo_level_df.reset_index(drop=True)

        # filter out fingerprint points that are not contained in any level and expand the point df by LEVEL_ID
        vo_point_in_level_df = vo_point_df.spatial.join(
            vo_level_df[[c.SHAPE_FIELD_NAME, c.LEVEL_ID_FIELD_NAME, c.Z_VALUE]],
            op='within')
        vo_point_in_level_dfs.append(vo_point_in_level_df)

    point_in_level_df = pd.concat(vo_point_in_level_dfs)

    # associate the LEVEL_ID to the fingerprints
    fingerprint_df = fingerprint_df.merge(point_in_level_df[['point_id', c.LEVEL_ID_FIELD_NAME, c.Z_VALUE]],
                                          on='point_id')

    return fingerprint_df


def compute_dataset_geometry(level_df, fingerprint_df, sr):
    """Computes the produced dataset geometry.

    The calculation is done based on the following logic:
     i. Calculate the union (set-theoretic union) of all the levels within one facility (facility approximation)
     ii. Calculate the envelopes of all facility approximations
     iii. Return the union of all the envelopes created at step 2

    Args:
        level_df: the levels dataframe
        fingerprint_df: the fingerprint dataframe used to filter the levels
        sr: the spatial Reference object of the final output of GIPD

    Returns:
        arcgis.gis.Polygon object which represents the dataset extent

    """
    # filter only the level where we have dataframes
    level_df = level_df[level_df[c.LEVEL_ID_FIELD_NAME].isin(fingerprint_df[c.LEVEL_ID_FIELD_NAME])]

    # project levels to the desired spatial reference
    level_df.spatial.project(spatial_reference=sr)

    # approximate the geometry of all the facilities by making the union of all the levels
    facilities_approx_geom = []
    for _, level in level_df.groupby("FACILITY_ID"):
        facility_approx_geom = level.SHAPE.iloc[0]
        for level_geom in level.SHAPE.iloc[1:]:
            facility_approx_geom = facility_approx_geom.union(level_geom)
        facilities_approx_geom.append(facility_approx_geom)

    # construct the final dataset geometry by taking the union of all the envelopes of all the facility approximations
    # first construct a new Polygon based on the envelope of the first facility approximation
    # as making a union of envelopes only doesn't work
    dataset_geometry = facilities_approx_geom[0].envelope.polygon
    for f_geom in facilities_approx_geom[1:]:
        dataset_geometry = dataset_geometry.union(f_geom.envelope)

    return dataset_geometry


def update_fingerprints(
        positioning_datasets: Layer or str,
        positioning_points: Layer or str,
        positioning_signals: Layer or str,
        existing_dataset: str,
        levels: Layer or str,
        recordings: Layer or str,
        parameter_names_dict: dict) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """

    Args:
        positioning_datasets: the IPS Positioning Datasets path
        positioning_points: the IPS Positioning Points path
        positioning_signals: the IPS Positioning Signals path
        existing_dataset: the name of the existing dataset to be used for the blend in
        levels: the Levels Feature Class path
        recordings: the IPS Recordings Feature Class path
        parameter_names_dict: name of the parameters (used for some messages)

    Returns:
        updated_fingerprint_sdf_wgs84: the updated fingerprint dataframe in WGS84 coordinates
        level_sdf: the updated level dataframe

    """
    # STEP 1: read the inputs
    # ----------------------------------------------------------------------------------
    progressor.update_label(message_id=250101)
    dataset_sdf, point_sdf, signal_df = u_io.read_positioning_dataset(
        datasets_path=positioning_datasets, points_path=positioning_points,
        signals_path=positioning_signals, ips_dataset_name=existing_dataset)

    # check first that the inputs are not empty, otherwise we can't update
    if point_sdf.empty:
        raise gipd_v.EmptyPositioningDataset(param_name=os.path.basename(positioning_points))

    if signal_df.empty:
        raise gipd_v.EmptyPositioningDataset(param_name=os.path.basename(positioning_signals))

    recording_df = u_io.read_recordings(recordings_fc=recordings)
    level_sdf = u_io.read_levels(in_level_features=levels)
    progressor.increment()

    # STEP 2 - Validating recording and level attributes
    # ----------------------------------------------------------------------------------
    progressor.update_label(message_id=250053)
    progressor.set_small_increment(sub_steps=2)
    recording_df, level_sdf = progressor.generator_increments(
        gen=gipd_v.validate_attributes(
            recording_df=recording_df, recordings_fc=recordings,
            level_df=level_sdf, parameter_names_dict=parameter_names_dict)
    )

    # STEP 3 - cross validating levels against recordings
    # ----------------------------------------------------------------------------------
    progressor.update_label(message_id=250093)
    progressor.set_small_increment(sub_steps=2)
    recording_df, level_sdf = progressor.generator_increments(
        gen=gipd_v.cross_validate_attributes(
            recording_df=recording_df,
            level_df=level_sdf,
            parameter_names_dict=parameter_names_dict)
    )
    progressor.increment()

    # STEP 3.5 - Validate Recordings radio types vs. existing fingerprints (dataset update only)
    # ----------------------------------------------------------------------------------
    recording_df = gipd_v.validate_recording_x_fingerprints(
        recording_df=recording_df,
        point_df=point_sdf,
        signal_df=signal_df)

    # STEP 4 - Validate geometry of recordings
    # ----------------------------------------------------------------------------------
    progressor.update_label(message_id=250070)
    recording_df = gipd_v.validate_recording_within_level(
        recording_df=recording_df,
        level_df=level_sdf,
        recording_param=parameter_names_dict[gipd_c.RECORDINGS_PARAM])
    progressor.increment()

    tempfile.TemporaryDirectory.cleanup = gipf_u.cleanup_patch
    with tempfile.TemporaryDirectory() as target_dir:
        # STEP 5 - Extracting recordings
        # -------------------------------------------------------------------------------
        progressor.update_label(message_id=250008)
        progressor.set_small_increment(sub_steps=len(recording_df))
        recording_df = progressor.generator_increments(
            gen=gipf_u.extract_recordings(recording_df, recordings, target_dir))

        # STEP 6 - Validating recordings files
        # -------------------------------------------------------------------------------
        progressor.update_label(message_id=250054)
        progressor.set_small_increment(sub_steps=len(recording_df))
        recording_df = progressor.generator_increments(
            gen=gipf_v.validate_recording_files(recording_df, level_sdf))

    # STEP 7 - processing attachments
    # ----------------------------------------------------------------------------------
    progressor.update_label(message_id=250010)
    progressor.set_small_increment(len(recording_df))

    # we need a reference point to be used as local origin to project to legacy coords.
    # it does not really matter which point we choose as far as it is close enough to our data.
    # so, let's choose the bottom left corner of the dataset geometry as the legacy origin
    # dataset_geom_4326 = dataset_sdf.iloc[0].SHAPE.project_as(spatial_reference=arcpy.SpatialReference(4326))
    dataset_geom_4326 = dataset_sdf.iloc[0].SHAPE.project_as(spatial_reference=c.WGS84_SR)
    origin = Point({"x": dataset_geom_4326.extent[0],
                    "y": dataset_geom_4326.extent[1],
                    "spatialReference": {"wkid": 4326}}).as_arcpy

    recording_df = progressor.generator_increments(
        gen=gipf_u.enrich_recording_accesses(
            recording_df=recording_df,
            legacy_origin=origin))

    # STEP 8 - Generating indoor positioning data...
    # ----------------------------------------------------------------------------------
    progressor.update_label(message_id=250011)

    # project fingerprints to WGS84 and then to a legacy CRS
    if point_sdf.spatial.sr['latestWkid'] != 4326:
        point_sdf.spatial.project(spatial_reference=4326)
    point_sdf_legacy = gipfws_u_geom.legacy_project_point_df(
        sdf=point_sdf,
        origin=origin)

    # add the VERTICAL ORDER field to recordings
    recording_sdf = recording_df.merge(
        level_sdf[[c.LEVEL_ID_FIELD_NAME, c.VERTICAL_ORDER]],
        on=c.LEVEL_ID_FIELD_NAME)

    # project recordings to WGS84 and then to a legacy CRS
    if recording_sdf.spatial.sr['latestWkid'] != 4326:
        recording_sdf.spatial.project(spatial_reference=4326)
    recording_sdf_legacy = u_geom.transform_poly_df(
        sdf=recording_sdf,
        origin=origin,
        reverse=False)

    updated_fingerprint_sdf_legacy = gipd_duu.blend_survey_data(
        base_point_sdf_legacy=point_sdf_legacy,
        base_signal_df=signal_df,
        level_sdf=level_sdf,
        recording_sdf_legacy=recording_sdf_legacy)

    # make the fingerprint dataframe a spatial dataframe in WGS84
    updated_fingerprint_sdf_wgs84 = u_geom.legacy_df2wgs84_sdf(
        legacy_df=updated_fingerprint_sdf_legacy, origin=origin)
    # extend all the Levels with Z values (we need all rows, so re-read the feature class)
    level_sdf = extend_levels_with_z(df=u_io.read_levels(in_level_features=levels))
    updated_fingerprint_sdf_wgs84 = make_floor_aware(updated_fingerprint_sdf_wgs84, level_sdf)
    progressor.increment()
    return updated_fingerprint_sdf_wgs84, level_sdf


def generate_positioning_dataset(
        target_ips_positioning_datasets: Layer or str,
        dataset_name: str,
        generation_method: str,
        in_levels: Layer or str,
        in_recordings: Layer or str,
        in_ips_beacons: Layer or str,
        in_ips_areas: Layer or str,
        in_walls: Layer or str,
        update_existing: bool = None,
        existing_dataset: str = None,
        parameter_names_dict: dict = None):
    """generates a positioning dataset

    Args:
        target_ips_positioning_datasets: target positioning dataset layer or FC database path
        dataset_name: name of the dataset being created
        generation_method: "Survey-based" or "Survey-less"
        in_levels: Levels layer or FC database path
        in_recordings: Recordings layer or FC database path
        in_ips_beacons: Beacon layer or FC database path
        in_ips_areas: IPS Area layer or FC database path
        in_walls: Wall layer or FC database path
        update_existing: True for GIPD-Update else False
        existing_dataset: the existing dataset name, used only when update_existing=True
        parameter_names_dict: name of the parameters (used for some messages)

    Returns:

    """

    if not parameter_names_dict:
        parameter_names_dict = {
            gipd_c.RECORDINGS_PARAM: gipd_c.RECORDINGS_PARAM,
            gipfws_c.BEACONS_PARAM: gipfws_c.BEACONS_PARAM,
            gipfws_c.IPS_AREAS_PARAM: gipfws_c.IPS_AREAS_PARAM,
            gipfws_c.WALLS_PARAM: gipfws_c.WALLS_PARAM,
            gipfws_c.LEVELS_PARAM: gipfws_c.LEVELS_PARAM}

    global progressor

    target_ips_positioning_datasets, positioning_points, positioning_signals = gipd_u_db.find_related_positioning_tables(
        positioning_datasets_path=target_ips_positioning_datasets)

    # Function to validate related tables
    gipd_v.validate_related_tables(positioning_points=positioning_points, positioning_signals=positioning_signals)

    if generation_method == gipd_c.METHOD_SURVEY_BASED:
        # check if the inputs have attachment tables
        if not v.has_attachments(table=in_recordings):
            raise v.AttachmentTableError(table=in_recordings)

        if update_existing:
            progressor = u_io.Progressor(step_num=9)

            fingerprint_df, level_df = update_fingerprints(
                positioning_datasets=target_ips_positioning_datasets,
                positioning_points=positioning_points,
                positioning_signals=positioning_signals,
                existing_dataset=existing_dataset,  # the existing dataset is passed as separate input
                levels=in_levels,
                recordings=in_recordings,
                parameter_names_dict=parameter_names_dict)

        else:
            progressor = u_io.Progressor(step_num=9)

            fingerprint_df, level_df = survey_based_fingerprints(recordings_fc=in_recordings,
                                                                 levels_fc=in_levels,
                                                                 parameter_names_dict=parameter_names_dict)
            fingerprint_df[M.IPS_POSITIONING_SIGNALS.FIELDS.GENERATION_METHOD.name] = \
                M.DOM_IPS_GENERATION_METHOD.VALUES.SURVEY_BASED.value
    else:
        progressor = u_io.Progressor(step_num=6)
        fingerprint_df, level_df = survey_less_fingerprints(beacons_fc=in_ips_beacons,
                                                            ips_areas_fc=in_ips_areas,
                                                            walls_fc=in_walls,
                                                            levels_fc=in_levels,
                                                            parameter_names_dict=parameter_names_dict)
        fingerprint_df[M.IPS_POSITIONING_SIGNALS.FIELDS.GENERATION_METHOD.name] = \
            M.DOM_IPS_GENERATION_METHOD.VALUES.SURVEY_LESS.value

    # --------------------------------------------------
    #  Saving indoor positioning data
    # --------------------------------------------------
    progressor.update_label(message_id=250012)  # Saving indoor positioning data...

    datasets_desc = arcpy.Describe(target_ips_positioning_datasets)
    dataset_geom = compute_dataset_geometry(level_df, fingerprint_df, sr=datasets_desc.spatialReference.factoryCode)
    gipd_u_db.save_positioning_dataset(fingerprint_df, dataset_name, dataset_geom,
                                       target_ips_positioning_datasets, positioning_points,
                                       positioning_signals)
    progressor.increment()
    arcpy.AddIDMessage('INFORMATIVE', 250058,
                       ','.join([str(oid) for oid in sorted(level_df[c.OBJECT_ID_FIELD_NAME].values.tolist())]))
    # Add the results of execution to the map
    gipd_u_db.add_layer_to_map(dataset_name=dataset_name,
                               positioning_points_path=positioning_points,
                               positioning_datasets_path=target_ips_positioning_datasets,
                               positioning_signals_path=positioning_signals)


def extend_levels_with_z(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extends the level dataframe with z-value for each level
    Args:
        df: Dataframe

    Returns:
     Dataframe with z-value column added
    """
    # remove any empty geometries
    df = df[df[c.SHAPE_FIELD_NAME].notnull()]
    # for every valid level geometry, calculate the Z value
    df[c.Z_VALUE] = df.apply(lambda x: u_geom.extract_z_values(x[c.SHAPE_FIELD_NAME]), axis=1)
    return df
