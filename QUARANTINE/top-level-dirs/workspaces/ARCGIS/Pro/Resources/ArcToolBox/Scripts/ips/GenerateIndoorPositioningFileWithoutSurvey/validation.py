from typing import Tuple, Union, Generator, Optional

import arcpy
import ips.GenerateIndoorPositioningFile.const as gipf_c
import ips.GenerateIndoorPositioningFile.validation as gipf_v
import ips.GenerateIndoorPositioningFileWithoutSurvey.const as gipfws_c
import ips.GenerateIndoorPositioningFileWithoutSurvey.utils_geom as gipfws_u_geom
import ips.const as c
import ips.utils as u
import ips.validation as v
import numpy as np
import pandas as pd

BEACON_UUID_PATTERN = '[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}'


class ArrayShapeMismatchError(Exception):
    def __init__(self, expected_shape):
        self.expected_shape = expected_shape

    def __str__(self):
        return f'Shape mismatch: expected {self.expected_shape}'


class CurvedGeometriesError(Exception):
    def __init__(self, input_param_name, curved_geometries_oids):
        self.input_param_name = input_param_name
        self.curved_geometries_oids = curved_geometries_oids


class MisplacedBeaconsError(Exception):
    def __init__(self, beacon_object_ids):
        self.beacon_object_ids = beacon_object_ids


class DisjointInputError(Exception):
    def __init__(self, param_name, object_ids):
        self.param_name = param_name
        self.object_ids = object_ids


class DuplicatedBeaconsError(Exception):
    def __init__(self, beacon_object_ids):
        self.beacon_object_ids = beacon_object_ids


class DuplicatedFacilitiesError(Exception):
    def __init__(self, facility_object_ids):
        self.facility_object_ids = facility_object_ids


class DuplicatedLevelsError(Exception):
    def __init__(self, level_object_ids):
        self.level_object_ids = level_object_ids


def validate_facility_attributes(facility_df: pd.DataFrame,
                                 facility_param) -> pd.DataFrame:
    """Validates the attributes of the input facilities.
    1. not-null FACILITY_ID and SITE_ID fields (null rows are skipped)
    2. no-duplicated FACILITY_ID (else error out)
    Args:
        facility_df: the facility dataframe to validate
        facility_param: Facilities input param name

    Returns:
        validated dataframe (invalid rows are filtered out)

    raise:
        DuplicatedFeaturesError
    """
    # Check feature classes for null or invalid attributes
    facility_df = validate_input_attributes(
        input_df=facility_df,
        input_param_name=facility_param,
        message_id=250065,
        field_filters=[c.FACILITY_ID_FIELD_NAME,
                       c.SITE_ID_FIELD_NAME])

    # detect duplicates
    duplicate_idx = facility_df.duplicated(
        subset=[c.FACILITY_ID_FIELD_NAME],
        keep=False)

    if any(duplicate_idx):
        # Create a comma separated list of Beacon IDs
        duplicated_facility_oids = ', '.join([
            str(oid) for oid in sorted(facility_df[duplicate_idx][c.OBJECT_ID_FIELD_NAME].values.tolist())])
        raise DuplicatedFacilitiesError(facility_object_ids=duplicated_facility_oids)

    return facility_df


def validate_level_attributes(level_df: pd.DataFrame,
                              level_param_name: str) -> pd.DataFrame:
    """Validates the attributes of the input levels.
    1. not-null SHAPE, LEVEL_ID, VERTICAL_ORDER, and FACILITY_ID fields (null rows are skipped)
    2. no-duplicated LEVEL_ID (else error out)
    Args:
        level_df: the facility dataframe to validate
        level_param_name: the name of the levels param, used to output the message about skipped rows

    Returns:
        validated dataframe (invalid rows are filtered out)

    raise:
        DuplicatedFeaturesError

    """
    level_df = validate_input_attributes(
        input_df=level_df,
        input_param_name=level_param_name,
        message_id=250066,
        field_filters=[c.SHAPE_FIELD_NAME,
                       c.LEVEL_ID_FIELD_NAME,
                       c.VERTICAL_ORDER,
                       c.FACILITY_ID_FIELD_NAME])

    # detect duplicates
    duplicate_idx = level_df.duplicated(
        subset=[c.LEVEL_ID_FIELD_NAME],
        keep=False)

    if any(duplicate_idx):
        # Create a comma separated list of Beacon IDs
        duplicated_level_oids = ', '.join([
            str(oid) for oid in sorted(level_df[duplicate_idx][c.OBJECT_ID_FIELD_NAME].values.tolist())])
        raise DuplicatedLevelsError(level_object_ids=duplicated_level_oids)

    return level_df


def validate_beacon_attributes(df: pd.DataFrame, param_name: str):
    """performs all necessary attribute validations on a beacon dataframe

    Args:
        df: the beacon dataframe read from the FC
        param_name: the name of the Beacons parameter in the tool

    Returns:
        valid beacon dataframe. All invalid rows are sorted out
    """
    # make sure all the important attributes contain valid data
    df = validate_input_attributes(
        input_df=df,
        message_id=250062,
        input_param_name=param_name,
        field_filters=[c.SHAPE_FIELD_NAME,
                       (c.UUID_FIELD_NAME, 'RegexMatch', BEACON_UUID_PATTERN),
                       (c.MAJOR_FIELD_NAME, 'Between', [1, 65535]),
                       (c.MINOR_FIELD_NAME, 'Between', [1, 65535]),
                       c.LEVEL_ID_FIELD_NAME,
                       (c.RSSI_1M_FIELD_NAME, 'Between', [-120, 0])])

    # make the UUID upper case
    df[c.UUID_FIELD_NAME] = df[c.UUID_FIELD_NAME].str.upper()

    # detect duplicates
    duplicate_idx = df.duplicated(
        subset=[c.UUID_FIELD_NAME, c.MAJOR_FIELD_NAME, c.MINOR_FIELD_NAME],
        keep=False)

    if any(duplicate_idx):
        # Create a comma separated list of Beacon IDs
        duplicated_beacons_oids = ', '.join([
            str(oid) for oid in sorted(df[duplicate_idx][c.OBJECT_ID_FIELD_NAME].values.tolist())])
        raise DuplicatedBeaconsError(beacon_object_ids=duplicated_beacons_oids)

    return df


def validate_input_attributes(input_df: pd.DataFrame,
                              input_param_name: str,
                              message_id: int,
                              field_filters: list[Union[str, Tuple[
                                  str, str, Union[list, str]]]]
                              ) -> pd.DataFrame:
    """
    Validates the attributes of the input dataframe and raises the according
    warnings messages according to the message id and the field_filters.

    Args:
        input_df: the input dataframe to be validated
        input_param_name: the name of the GP parameter of GIPFWS (gets translated)
                          default is the english version (ips.const)
        message_id: the message id as defined in GPIndoorPositioningSystem.xml
        field_filters: List of elements to define the check to be made like:
                     - field_name: a string only for doing null check on the field
                     - field_name, filter_type, filter_values: [str, str, list | str]
                       - field_name: a string denoting the field to be checked
                       - filter_type:
                            - 'isin' for checking values inside a list
                            - 'Between' for checking value withing range
                            - 'Regex Match' for checking value matches full regex pattern

    Returns:
        The filtered Dataframe.

    """
    for field_filter in field_filters:
        if isinstance(field_filter, str):
            field_name = field_filter
            # check for null value or empty geometry
            input_df, dropped_df = u.filter_df(df=input_df,
                                               field_name=field_name)
        else:
            field_name, filter_type, filter_values = field_filter
            input_df, dropped_df = u.filter_df(df=input_df,
                                               field_name=field_name,
                                               filter_type=filter_type,
                                               field_values=filter_values)
        oids = sorted(dropped_df[c.OBJECT_ID_FIELD_NAME].values.tolist())
        if not oids:
            continue
        if field_name == c.SHAPE_FIELD_NAME:
            # for empty or null geometry use gp message id 250061
            arcpy.AddIDMessage('WARNING', 250061, input_param_name,
                               ', '.join([str(oid) for oid in oids]))
        else:
            arcpy.AddIDMessage('WARNING', message_id, field_name,
                               ', '.join([str(oid) for oid in oids]))

        # Check for empty feature class
        if input_df.empty:
            raise v.NoValidFeaturesError(input_param_name=input_param_name)

    return input_df


def validate_beacon_geometry(walls_df: pd.DataFrame,
                             beacons_df: pd.DataFrame) -> pd.DataFrame:
    """
    Function to check for the beacons that may be overlapping with wall
    boundaries.In case there are overlapping beacons, we list the beacons and
    raise an Exception. Otherwise, we continue with the execution.

    Args:
        beacons_df: Dataframe of beacons
        walls_df: Dataframe of walls

    Returns: beacons_df with only the beacons that are placed on or outside
    the walls

    """
    # we need to operate per-level
    beacon_wall_relations = []
    for level_id, level_walls_df in walls_df.groupby(c.LEVEL_ID_FIELD_NAME):
        level_beacons_df = beacons_df[beacons_df[c.LEVEL_ID_FIELD_NAME] == level_id]

        if level_beacons_df.empty:
            # PROTECTIVE CODE: this should never happen,
            # but if (for whatever unpredicted scenario) it happens the spatial join will fail
            continue

        # compute the (wall, beacon) pairs that intersect
        wall_beacon_intersect_df = level_walls_df.spatial.join(
            level_beacons_df, op="intersects")

        # refine the spatial relation: is it within or cross?
        for _, row in wall_beacon_intersect_df[[f'{c.OBJECT_ID_FIELD_NAME}_left',
                                                f'{c.OBJECT_ID_FIELD_NAME}_right']].iterrows():
            wall_oid, beacon_oid = row
            wall = level_walls_df[level_walls_df[c.OBJECT_ID_FIELD_NAME] == wall_oid]
            beacon = level_beacons_df[level_beacons_df[c.OBJECT_ID_FIELD_NAME] == beacon_oid]
            relationship = 'within' if wall.SHAPE.geom.contains(beacon.SHAPE, relation='PROPER').iloc[0] else 'touch'
            beacon_wall_relations.append([level_id, beacon_oid, wall_oid, relationship])

    beacon_wall_relation_df = pd.DataFrame(beacon_wall_relations, columns=[
        c.LEVEL_ID_FIELD_NAME, 'BEACON_OID', 'WALL_OID', 'REL'])

    # create a boolean index of the beacons within walls.
    # The negation will correspond to beacons on the boundary.
    # Because of how we constructed the dataframe, there are no other options
    beacons_walls_within_idx = beacon_wall_relation_df['REL'] == 'within'
    beacon_within_wall_df = beacon_wall_relation_df[beacons_walls_within_idx]
    beacon_touch_wall_df = beacon_wall_relation_df[~beacons_walls_within_idx]

    misplaced_beacons_df = beacons_df[beacons_df[c.OBJECT_ID_FIELD_NAME].isin(
        beacon_within_wall_df['BEACON_OID'])]
    if len(misplaced_beacons_df):
        # Create a comma separated list of Beacon IDs
        misplaced_beacons_oids = ', '.join([str(oid) for oid in sorted(misplaced_beacons_df[
                                                                           c.OBJECT_ID_FIELD_NAME].values.tolist())])
        raise MisplacedBeaconsError(beacon_object_ids=misplaced_beacons_oids)

    # If we are here, no beacons is inside a wall,
    # but some might be on the boundary of some wall.
    # We need to push them 1mm away
    beacons_df = gipfws_u_geom.push_beacons_from_walls(
        beacon2wall_oids=zip(beacon_touch_wall_df['BEACON_OID'],
                             beacon_touch_wall_df['WALL_OID']),
        beacons_df=beacons_df,
        walls_df=walls_df,
        distance=0.001)
    return beacons_df


def validate_input_within_levels(
        input_df: pd.DataFrame,
        levels_df: pd.DataFrame,
        input_param_name: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Function to check if the geometries (per level) of the input spatial df
    are contained within the specific Levels df. The options are:
        - fully contained: no modification
        - partially contained: only the portion within the level geometry is returned
        - completely outside: the geometry (and the row) is removed

    Notes: The dataframes must be defined in a  projected reference system.

    Args:
        levels_df: Dataframe of levels
        input_df: Dataframe with geometry to be checked against levels geometry
        input_param_name: the name of the GP parameter of GIPFWS (gets translated)
                          default is the english version (ips.const)

    Returns:
        Modified version of the dataframe with only the full or partial polygons
        that lies within the specific levels and updated (if changed) levels df.

    """
    message_id_partial = 250067

    modified_input_df = pd.DataFrame(columns=input_df.columns)

    partial_oids = []
    full_oids = []

    for object_id, level_id in zip(input_df[c.OBJECT_ID_FIELD_NAME],
                                   input_df[c.LEVEL_ID_FIELD_NAME]):
        input_row = input_df[input_df[c.OBJECT_ID_FIELD_NAME] == object_id]
        input_row.reset_index(drop=True, inplace=True)
        level_row = levels_df[levels_df[c.LEVEL_ID_FIELD_NAME] == level_id]
        level_row.reset_index(drop=True, inplace=True)

        input_row_overlay = level_row.spatial.overlay(input_row[[c.SHAPE_FIELD_NAME]], op="intersection")
        if input_row_overlay.spatial.area == 0:
            full_oids.append(object_id)  # input row is disjoint
            continue
        elif not np.isclose(input_row_overlay.spatial.area, input_row.spatial.area, rtol=1e-3, atol=0.1):
            partial_oids.append(object_id)  # input row is partial contained

        # Create a new dataframe with only portion of the shape that lies
        # within the level
        modified_input_df = pd.concat([modified_input_df,
                                       input_row_overlay[input_df.columns]])

    if full_oids:
        raise DisjointInputError(input_param_name, sorted(full_oids))

    if partial_oids:
        arcpy.AddIDMessage('WARNING', message_id_partial, input_param_name,
                           ', '.join([str(oid) for oid in sorted(partial_oids)]))

    return modified_input_df, levels_df


def validate_curved_geometries(sdf: pd.DataFrame, input_param_name: str) -> None:
    """
    Checks if the input spatial dataframe contains curved geometries and raises
    an error message containing the name of Features and the object IDs that
    contain the curved geometries

    Args:
        sdf: spatial dataframe to be validated
        input_param_name: the name of the GP parameter of GIPFWS (gets translated)
                          default is the english version (ips.const)

    raise:
        250073 error message.

    Returns:
        None

    """
    curved_geometries_oids = [row[c.OBJECT_ID_FIELD_NAME] for _, row in
                              sdf.iterrows() if 'curve' in row.SHAPE.JSON]
    if curved_geometries_oids:
        raise CurvedGeometriesError(input_param_name,
                                    ', '.join([str(oid) for oid in sorted(curved_geometries_oids)]))

    return


def validate_levels_vs_facilities(
        levels_df: pd.DataFrame,
        levels_param: str,
        facility_df: pd.DataFrame) -> pd.DataFrame:
    """Cross-validate levels against facilities.
    Drops all Levels for which we cannot find a matching facility.
    Also drops all facilities for which we cannot find a matching level.
    If no match, raise an error.

    Args:
        levels_df: Level dataframe to validate
        levels_param: Name of the Level input param
        facility_df: Facility dataframe to validate against

    Returns:
        Levels that match a facility. Non-matching levels are dropped

    raise:
        NoValidFeaturesError

    """
    # merge levels and facility dataframe
    merge_df = pd.merge(
        left=levels_df,
        right=facility_df[[c.OBJECT_ID_FIELD_NAME, c.FACILITY_ID_FIELD_NAME, c.SITE_ID_FIELD_NAME]],
        on=c.FACILITY_ID_FIELD_NAME,
        suffixes=('_level', '_facility'))

    level_oid = f'{c.OBJECT_ID_FIELD_NAME}_level'
    facility_oid = f'{c.OBJECT_ID_FIELD_NAME}_facility'

    # get the matched level and facility oids
    matched_level_oids = sorted(merge_df[level_oid].unique().tolist())
    matched_facility_oids = sorted(merge_df[facility_oid].unique().tolist())

    if len(matched_facility_oids) < len(facility_df):
        # we dropped some facilities, warn the user
        _, dropped_facility_df = u.filter_df(
            df=facility_df,
            field_name=c.OBJECT_ID_FIELD_NAME,
            field_values=matched_facility_oids,
            filter_type='isin')

        arcpy.AddIDMessage('WARNING', 250069, ', '.join(
            [str(oid) for oid in sorted(dropped_facility_df[c.OBJECT_ID_FIELD_NAME].values.tolist())]))

    if len(matched_level_oids) < len(levels_df):
        # we dropped some levels, warn the user
        _, dropped_levels_df = u.filter_df(
            df=levels_df,
            field_name=c.OBJECT_ID_FIELD_NAME,
            field_values=matched_level_oids,
            filter_type='isin')

        arcpy.AddIDMessage('WARNING', 250077, ', '.join(
            [str(oid) for oid in sorted(dropped_levels_df[c.OBJECT_ID_FIELD_NAME].values.tolist())]))

    if len(matched_level_oids) == 0:
        # we skipped all levels, error out: NoValidFeatures
        raise v.NoValidFeaturesError(input_param_name=levels_param)

    # clean the merge (level) dataframe
    merge_df = merge_df.drop([facility_oid], axis=1)
    merge_df = merge_df.rename(columns={level_oid: c.OBJECT_ID_FIELD_NAME})

    # return level_df + SITE_ID
    return merge_df


def validate_sufficient_data_per_level(
        beacons_df: pd.DataFrame,
        ips_area_df: pd.DataFrame,
        walls_df: pd.DataFrame,
        levels_df: pd.DataFrame,
        levels_param: str) -> pd.DataFrame:
    """Validate that there is sufficient data for each valid level.
    That is, at least 4 beacons, 1 wall, and 1 IPS area
    Levels with insufficient data are skipped.

    Args:
        beacons_df: Valid beacons
        ips_area_df: Valid IPS Area
        walls_df: Valid Walls
        levels_df: Valid Levels
        levels_param: param label of Levels (used to error out)

    Returns:
        Levels with sufficient data

    Raise:
        NoValidFeaturesError if all levels are skipped

    """

    invalid_level_ids = []
    for _, level in levels_df.iterrows():
        level_id = level[c.LEVEL_ID_FIELD_NAME]
        level_beacons_df = beacons_df[beacons_df[c.LEVEL_ID_FIELD_NAME] == level_id]
        level_ips_areas_df = ips_area_df[ips_area_df[c.LEVEL_ID_FIELD_NAME] == level_id]
        level_walls_df = walls_df[walls_df[c.LEVEL_ID_FIELD_NAME] == level_id]

        if len(level_beacons_df.index) < 4 or level_ips_areas_df.empty or level_walls_df.empty:
            invalid_level_ids.append(level_id)

    if invalid_level_ids:
        invalid_levels_df, levels_df = u.filter_df(
            df=levels_df, field_name=c.LEVEL_ID_FIELD_NAME,
            field_values=invalid_level_ids, filter_type='isin')

        # Warning about skipping level
        arcpy.AddIDMessage('WARNING', 250059, ', '.join(
            [str(oid) for oid in sorted(invalid_levels_df[c.OBJECT_ID_FIELD_NAME].values.tolist())]))

        if levels_df.empty:
            # all levels are invalid, raise an error
            raise v.NoValidFeaturesError(levels_param)

    return levels_df


def validate_features_vs_levels(
        features_df: pd.DataFrame,
        features_param: str,
        skipping_message_id: int,
        levels_df: pd.DataFrame) -> pd.DataFrame:
    """Cross-validate features against valid levels.
    Drops all features for which we cannot find a matching level.
    If no valid features, raise an error.

    Args:
        features_df: features to validate
        features_param: param label of the features (used for erroring out)
        skipping_message_id: message ID used for warning about skipped features
        levels_df: valid levels

    Returns:
        Valid features (those that match a valid level). Features that do not match a level are dropped

    raise:
        NoValidFeaturesError
    """
    # Filter out features data frame based on common level_ids
    valid_level_ids = sorted(levels_df[c.LEVEL_ID_FIELD_NAME].values.tolist())

    features_df, dropped_df = u.filter_df(
        df=features_df,
        field_name=c.LEVEL_ID_FIELD_NAME,
        field_values=valid_level_ids,
        filter_type='isin')

    if not dropped_df.empty:
        # Warning about skipping features
        arcpy.AddIDMessage('WARNING', skipping_message_id, ', '.join(
            [str(oid) for oid in sorted(dropped_df[c.OBJECT_ID_FIELD_NAME].values.tolist())]))

    if features_df.empty:
        # we skipped all features, error out: NoValidFeatures
        raise v.NoValidFeaturesError(input_param_name=features_param)

    return features_df


def validate_attributes(beacons_df, ips_area_df, walls_df, level_df, facility_df, ips_transition_df,
                        parameter_names_dict) -> Generator[None, None, Tuple]:
    """
    validate dataframe attributes for generates an indoor positioning file without survey
    prepare input for process data

    Args:
        beacons_df: Beacons dataframe
        ips_area_df: IPS Area dataframe
        walls_df: Wall dataframe
        level_df: Levels dataframe
        facility_df: Facility dataframe
        ips_transition_df: IPS Transitions dataframe
        parameter_names_dict: dictionary for the parameter display names used for gp messages

    Yields: None after every validation step

    Returns:
        (beacons dataframe, ips area dataframe, walls dataframe, level dataframe, facility dataframe,
        ips transition dataframe)
         # Tuple of beacons_df, ips_area_df, walls_df, level_df, facility_df, ips_transition_df

    """
    # --------------------------------------------------
    #        attribute validation (single input)
    # --------------------------------------------------
    if facility_df is not None and not facility_df.empty:
        facility_df = validate_facility_attributes(
            facility_df=facility_df,
            facility_param=parameter_names_dict[gipfws_c.FACILITIES_PARAM])
    yield

    level_df = validate_level_attributes(
        level_df=level_df,
        level_param_name=parameter_names_dict[gipfws_c.LEVELS_PARAM])
    yield

    beacons_df = validate_beacon_attributes(
        df=beacons_df,
        param_name=parameter_names_dict[gipfws_c.BEACONS_PARAM])
    yield

    ips_area_df = validate_input_attributes(
        input_df=ips_area_df,
        input_param_name=parameter_names_dict[gipfws_c.IPS_AREAS_PARAM],
        message_id=250063,
        field_filters=[c.SHAPE_FIELD_NAME,
                       c.LEVEL_ID_FIELD_NAME])
    yield

    walls_df = validate_input_attributes(
        input_df=walls_df,
        input_param_name=parameter_names_dict[gipfws_c.WALLS_PARAM],
        message_id=250064,
        field_filters=[c.SHAPE_FIELD_NAME,
                       c.LEVEL_ID_FIELD_NAME])
    yield

    ips_transition_df = gipf_v.validate_transition_attributes(
        transition_df=ips_transition_df)

    yield

    return beacons_df, ips_area_df, walls_df, level_df, facility_df, ips_transition_df


def cross_validate_attributes(beacons_df, ips_area_df, walls_df, level_df, facility_df, ips_transition_df,
                              parameter_names_dict) -> Generator[None, None, Tuple]:
    """
    cross validate dataframe attributes for generates an indoor positioning file without survey
    prepare input for process data

    Args:
        beacons_df: Beacons dataframe
        ips_area_df: IPS Area dataframe
        walls_df: Wall dataframe
        level_df: Levels dataframe
        facility_df: Facility dataframe
        ips_transition_df: IPS Transitions dataframe
        parameter_names_dict: dictionary for the parameter display names used for gp messages

    Returns:
        (beacons dataframe, ips area dataframe, walls dataframe, level dataframe, facility dataframe,
        ips transition dataframe)
         # Tuple of beacons_df, ips_area_df, walls_df, level_df, facility_df, ips_transition_df

    """
    # --------------------------------------------------
    #        attribute cross-validation
    # --------------------------------------------------
    # Check levels against facilities
    if facility_df is not None and not facility_df.empty:
        level_df = validate_levels_vs_facilities(
            levels_df=level_df,
            levels_param=parameter_names_dict[gipfws_c.LEVELS_PARAM],
            facility_df=facility_df)
    yield

    # Check for sufficiency of data per valid level
    level_df = validate_sufficient_data_per_level(
        beacons_df=beacons_df,
        ips_area_df=ips_area_df,
        walls_df=walls_df,
        levels_df=level_df,
        levels_param=parameter_names_dict[gipfws_c.LEVELS_PARAM])
    yield

    # Checks features against valid levels
    beacons_df = validate_features_vs_levels(
        features_df=beacons_df,
        features_param=parameter_names_dict[gipfws_c.BEACONS_PARAM],
        skipping_message_id=250078, levels_df=level_df)
    ips_area_df = validate_features_vs_levels(
        features_df=ips_area_df,
        features_param=parameter_names_dict[gipfws_c.IPS_AREAS_PARAM],
        skipping_message_id=250079, levels_df=level_df)
    walls_df = validate_features_vs_levels(
        features_df=walls_df,
        features_param=parameter_names_dict[gipfws_c.WALLS_PARAM],
        skipping_message_id=250080, levels_df=level_df)
    ips_transition_df = validate_transition_x_levels(transition_df=ips_transition_df, level_df=level_df)

    yield

    return beacons_df, ips_area_df, walls_df, level_df, facility_df, ips_transition_df


def validate_geometry(beacons_df, ips_area_df, walls_df, level_df, ips_transition_df,
                      parameter_names_dict) -> Generator[None, None, Tuple]:
    """
    validate dataframe geometry for generates an indoor positioning file without survey
    prepare input for process data

    Args:
        beacons_df: Beacons dataframe
        ips_area_df: IPS Area dataframe
        walls_df: Wall dataframe
        level_df: Levels dataframe
        ips_transition_df: IPS Transitions dataframe
        parameter_names_dict: dictionary for the parameter display names used for gp messages

    Yields: None after every validation step

    Returns:
        (beacons dataframe, ips area dataframe, walls dataframe, level dataframe, ips transition dataframe,
        origin_point, origin_lat, origin_lon)
         # Tuple of beacons_df, ips_area_df, walls_df, level_df, ips_transition_df,
         #      origin_point, origin_lat, origin_lon

    """

    # Check for Curved Geometries and raise error if found
    validate_curved_geometries(sdf=walls_df, input_param_name=parameter_names_dict[gipfws_c.WALLS_PARAM])
    validate_curved_geometries(sdf=ips_area_df,
                               input_param_name=parameter_names_dict[gipfws_c.IPS_AREAS_PARAM])
    validate_curved_geometries(sdf=level_df, input_param_name=parameter_names_dict[gipfws_c.LEVELS_PARAM])
    yield

    if ips_transition_df is not None:
        # Validate the transition geometries
        ips_transition_df = gipf_v.validate_transition_geometries(transition_df=ips_transition_df)
        # Check for transitions within levels before projecting to legacy CRS
        ips_transition_df = validate_transition_within_levels(transition_df=ips_transition_df,
                                                              level_df=level_df)
    yield

    # Project to legacy CRS
    origin_lat, origin_lon = gipfws_u_geom.calculate_legacy_origin(level_df)
    origin_point = arcpy.PointGeometry(arcpy.Point(origin_lon, origin_lat), c.WGS84_SR)

    beacons_df = gipfws_u_geom.legacy_project_point_df(sdf=beacons_df, origin=origin_point)
    walls_df = gipfws_u_geom.legacy_project_poly_df(sdf=walls_df, origin=origin_point)
    level_df = gipfws_u_geom.legacy_project_poly_df(sdf=level_df, origin=origin_point)
    ips_area_df = gipfws_u_geom.legacy_project_poly_df(sdf=ips_area_df, origin=origin_point)
    yield

    # Validates beacons are outside of walls and snaps them on walls
    beacons_df = validate_beacon_geometry(walls_df=walls_df,
                                          beacons_df=beacons_df)
    yield

    # Validate ips area feature class
    ips_area_df, level_df = validate_input_within_levels(
        input_df=ips_area_df,
        levels_df=level_df,
        input_param_name=parameter_names_dict[gipfws_c.IPS_AREAS_PARAM])
    yield

    # Validate walls feature class
    walls_df, level_df = validate_input_within_levels(
        input_df=walls_df,
        levels_df=level_df,
        input_param_name=parameter_names_dict[gipfws_c.WALLS_PARAM])
    yield

    return beacons_df, ips_area_df, walls_df, level_df, ips_transition_df, origin_point, origin_lat, origin_lon


def validate_transition_x_levels(transition_df: pd.DataFrame,
                                 level_df: pd.DataFrame) -> Optional[pd.DataFrame]:
    """Cross-validate transitions attributes against levels
    Drops all the transitions for which we cannot find a matching facility or have a wrong From Vertical Order

    Args:
        transition_df: Dataframe of Transitions
        level_df: Dataframe of Levels

    Returns:
        Transitions that match a facility and From Vertical Order equal to one of the Vertical Order of the Levels.
        Non - matching transitions are dropped

    """
    if transition_df is None or transition_df.empty:
        return transition_df

    skipped_transition_ids = {
        gipf_c.FACILITY_MISMATCH: [],
        gipf_c.WRONG_VERTICAL_ORDER: []
    }
    # check for invalid facilities ids
    transition_df, dropped_df = u.filter_df(transition_df, c.FACILITY_ID_FIELD_NAME,
                                            sorted(level_df[c.FACILITY_ID_FIELD_NAME].values.tolist()),
                                            'isin')
    skipped_transition_ids[gipf_c.FACILITY_MISMATCH] = sorted(dropped_df[c.OBJECT_ID_FIELD_NAME].values.tolist())

    # check for wrong "From Vertical Order" values
    transition_df, dropped_df = u.filter_df(transition_df, c.VERTICAL_ORDER_FROM_FIELD_NAME,
                                            sorted(level_df[c.VERTICAL_ORDER].values.tolist()),
                                            'isin')
    skipped_transition_ids[gipf_c.WRONG_VERTICAL_ORDER] = sorted(dropped_df[c.OBJECT_ID_FIELD_NAME].values.tolist())

    # print any messages
    for fail_type, id_list in skipped_transition_ids.items():
        if len(id_list):
            arcpy.AddIDMessage('WARNING', gipf_c.TRANSITION_FAILS[fail_type],
                               ', '.join([str(oid) for oid in sorted(id_list)]))

    if transition_df.empty:
        # there are no valid transitions left, print a warning
        arcpy.AddIDMessage('WARNING', 250087)

    return transition_df


def validate_transition_within_levels(transition_df: pd.DataFrame,
                                      level_df: pd.DataFrame) -> Optional[pd.DataFrame]:
    """
    Function to check for the transition that are intersecting with levels. In case they are wholly or
    partially within the level, we keep them. Otherwise, we warn about the skipped transitions

    Args:
        transition_df: Dataframe of transitions
        level_df: Dataframe of levels

    Returns: transition_df with only the transition that are partial or fully within the levels

    """

    if transition_df is None or transition_df.empty:
        return transition_df

    misplaced_transition_idxs = set()
    for vertical_order in level_df[c.VERTICAL_ORDER]:
        # loop per vertical order value and fetch levels and transitions with that vertical order
        transition_at_vertical_order_df = transition_df[
            transition_df[c.VERTICAL_ORDER_FROM_FIELD_NAME] == vertical_order]
        # transition_per_vertical_order_df.reset_index(drop=True, inplace=True)

        if transition_at_vertical_order_df.empty:
            # In case there is no transition within a give level continue with the next level
            continue

        level_at_vertical_order_df = level_df[level_df[c.VERTICAL_ORDER] == vertical_order]
        level_at_vertical_order_df.reset_index(drop=True, inplace=True)
        misplaced_transition_idxs.update(transition_at_vertical_order_df.index.values.tolist())
        for t_idx, t in transition_at_vertical_order_df.iterrows():
            for _, l in level_at_vertical_order_df.iterrows():
                if t.SHAPE.within(l.SHAPE, relation='BOUNDARY'):
                    # valid transition, break
                    misplaced_transition_idxs.remove(t_idx)
                    break

    misplaced_transition_mask = transition_df.index.isin(misplaced_transition_idxs)
    valid_transition_df = transition_df[~misplaced_transition_mask]
    misplaced_transitions_df = transition_df[misplaced_transition_mask]

    if len(misplaced_transitions_df):
        arcpy.AddIDMessage('WARNING', 250084,
                           ', '.join([str(oid) for oid in
                                      sorted(misplaced_transitions_df[c.OBJECT_ID_FIELD_NAME].values.tolist())]))

    if valid_transition_df.empty:
        # all transitions are invalid!
        arcpy.AddIDMessage('WARNING', 250087)

    return valid_transition_df
