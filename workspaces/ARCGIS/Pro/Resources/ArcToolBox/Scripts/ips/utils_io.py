import math
from typing import Generator, Union, Tuple

import arcpy
import ips.const as c
import ips.utils as u
import ips.utils_db as u_db
import pandas as pd
from arcpy._mp import Layer
from arcpy.arcobjects.arcobjects import Parameter

M = c.MODEL_LATEST


def layer_or_fc(param: Parameter) -> Layer or str:
    """Given a parameter with datatype "GPFeatureLayer", returns its value

    Args:
        param: input parameter

    Returns: A Layer object if the given input is a layer, else the database path of the feature class

    """
    if not param:
        return None

    v = param.value
    if isinstance(v, Layer):
        return v
    else:
        return param.valueAsText


# TODO: we need to find a way to make these read* functions capable of reading
#  input from different versions of the model
def read_recordings(recordings_fc) -> pd.DataFrame:
    # Get the mapping for the field names from the input recording fc
    field_names_dict = u.create_field_name_dict(
        data_element=recordings_fc,
        xml_schema_path=c.MODEL_30.XML_PATH,
        xml_element_name=c.MODEL_30.IPS_RECORDINGS.NAME,
        is_in_dataset=False
    )

    # Convert the Feature class to Dataframe to improve the performance of
    # processing the feature class
    recording_df = u_db.fc2sdf(fc=recordings_fc,
                               field_names_dict=field_names_dict)

    return recording_df


def read_transitions(transitions_fc) -> Union[pd.DataFrame, None]:
    """load transitions FC to a transition DF. If transitions FC is None, returns None

    Args:
        transitions_fc: path to feature class or map layer

    Returns: transition dataframe, if input is given

    """

    if transitions_fc is None:
        return None

    ips_transition_dict = u.create_field_name_dict(data_element=transitions_fc,
                                                   xml_element_name=c.TRANSITIONS_NAME,
                                                   xml_schema_path=c.TRANSITIONS_XML_SCHEMA_PATH,
                                                   is_in_dataset=True)

    ips_transition_df = u_db.fc2sdf(
        fc=transitions_fc,
        field_names_dict=ips_transition_dict)

    return ips_transition_df


# TODO: pass the model version to read the correct version of the beacons
def read_beacons(in_beacon_features) -> pd.DataFrame:
    """reads beacons into a df"""
    beacons_dict = u.create_field_name_dict(
        data_element=in_beacon_features,
        xml_element_name=c.MODEL_LATEST.IPS_BEACONS.NAME,
        xml_schema_path=c.MODEL_LATEST.XML_PATH)
    beacons_df = u_db.fc2sdf(
        fc=in_beacon_features,
        field_names_dict=beacons_dict)
    return beacons_df


def read_walls(in_wall_features) -> pd.DataFrame:
    """reads walls into a df"""
    walls_dict = u.create_field_name_dict(
        data_element=in_wall_features,
        xml_element_name=c.WALLS_NAME,
        xml_schema_path=c.WALLS_XML_SCHEMA_PATH)
    walls_df = u_db.fc2sdf(
        fc=in_wall_features,
        field_names_dict=walls_dict)
    return walls_df


def read_facilities(in_facility_features) -> pd.DataFrame:
    """reads facilities into a df"""
    facility_dict = u.create_field_name_dict(
        data_element=in_facility_features,
        xml_element_name=c.FACILITIES_NAME,
        xml_schema_path=c.INDOORS_MODEL_XML_SCHEMA_PATH,
        is_in_dataset=True)
    facility_df = u_db.fc2sdf(
        fc=in_facility_features,
        field_names_dict=facility_dict)
    return facility_df


def read_ips_areas(in_ips_area_features) -> pd.DataFrame:
    """reads IPS areas into a df"""
    ips_area_dict = u.create_field_name_dict(
        data_element=in_ips_area_features,
        xml_element_name=c.IPS_AREA_NAME,
        xml_schema_path=c.IPS_AREA_XML_SCHEMA_PATH)
    ips_area_df = u_db.fc2sdf(
        fc=in_ips_area_features,
        field_names_dict=ips_area_dict)
    return ips_area_df


def read_levels(in_level_features) -> pd.DataFrame:
    """reads levels into a df"""
    levels_dict = u.create_field_name_dict(
        data_element=in_level_features,
        xml_element_name=c.LEVELS_NAME,
        xml_schema_path=c.INDOORS_MODEL_XML_SCHEMA_PATH,
        is_in_dataset=True)
    level_df = u_db.fc2sdf(
        fc=in_level_features,
        field_names_dict=levels_dict)
    return level_df


def read_positioning_dataset(datasets_path: str,
                             points_path: str,
                             signals_path: str,
                             ips_dataset_name: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """loads one positioning dataset into dataframes

    Args:
        datasets_path: indoor positioning datasets feature class path
        points_path: indoor positioning points feature class path
        signals_path: indoor positioning signals feature class path
        ips_dataset_name: name of dataset to be read

    Returns: dataset_sdf, point_sdf, signal_df

    """

    # prep empty output
    dataset_sdf, point_sdf, signal_df = pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

    datasets_field_names_dict = u.create_field_name_dict(
        data_element=datasets_path,
        xml_schema_path=M.XML_PATH,
        xml_element_name=M.IPS_POSITIONING_DATASETS.NAME,
        is_in_dataset=False
    )

    dataset_sdf = u_db.fc2sdf(
        fc=datasets_path, field_names_dict=datasets_field_names_dict,
        where_clause=f"{M.IPS_POSITIONING_DATASETS.FIELDS.DATASET_NAME.name} = '{ips_dataset_name}'")

    if not dataset_sdf.empty:
        points_field_names_dict = u.create_field_name_dict(
            data_element=points_path,
            xml_schema_path=M.XML_PATH,
            xml_element_name=M.IPS_POSITIONING_POINTS.NAME,
            is_in_dataset=False
        )

        dataset_guid_field_fc = points_field_names_dict[M.IPS_POSITIONING_POINTS.FIELDS.DATASET_GUID.name]
        dataset_global_id = dataset_sdf[c.GLOBAL_ID_FIELD_NAME].iloc[0]
        point_sdf = u_db.fc2sdf(
            fc=points_path, field_names_dict=points_field_names_dict,
            where_clause=f"{dataset_guid_field_fc} = '{dataset_global_id}'"
        )

    if not point_sdf.empty:
        signal_field_names_dict = u.create_field_name_dict(
            data_element=signals_path,
            xml_schema_path=M.XML_PATH,
            xml_element_name=M.IPS_POSITIONING_SIGNALS.NAME,
            is_in_dataset=False
        )

        point_guid_field_fc = signal_field_names_dict[M.IPS_POSITIONING_SIGNALS.FIELDS.POINT_GUID.name]
        point_guids = tuple(point_guid for point_guid in point_sdf[c.GLOBAL_ID_FIELD_NAME])

        # split the filter in the where clause because of the Oracle issue
        # ORA-01795: maximum number of expressions in a  list is 1000 error
        list_point_guids = u_db.split_list(list(point_guids))
        signal_df = u_db.tb2df(tb=signals_path, field_names_dict=signal_field_names_dict,
                               where_clause=f"{point_guid_field_fc} IN " + f" OR {point_guid_field_fc} IN ".join(
                                   str(tuple(lst)) for lst
                                   in list_point_guids))

    return dataset_sdf, point_sdf, signal_df


class Progressor:
    """
    Wrapper class for arcpy Progressor that is used to show the percentage of
    completion of processing of inputs within a tool. It also gives option to
    show progress of processing for individual recordings as well

    Args:
    current_step : int
        Stores the current position in the arcpy Progressor
    max_step : int
        The maximum value for the progressor. The default is 10000
    step_num : int
        Num of processing steps that is used to calculate step interval
    step_increment : int
        The progressor step interval for updating the progress bar
    small_increment : int
        The progressor step interval for updating the progress bar.

    Methods:

    increment(smaller_increment)
        Function to increment arcpy Progressor position

    update_label(message_id)
        Function to print arcpy Message by ID and also update arcpy
        Progressor label

    set_small_increment(sub_steps)
        Function to calculate step interval when processing individual
        recordings

    """

    def __init__(self, step_num: int, max_step: int = 10000):
        """
        Computes all the parameters for this Progressor class based on input
        steps

        Args:
            max_step : The maximum value for the progressor. The default is
            10000
            step_num : Num of processing steps that is used to calculate step interval
        """
        self.current_step = 0
        self.max_step = max_step
        self.step_num = step_num
        self.step_increment = int(math.floor(max_step / step_num))
        self.small_increment = int(math.floor(max_step / step_num))
        arcpy.SetProgressor(type='step',
                            min_range=self.current_step,
                            max_range=self.max_step,
                            step_value=self.step_increment)

    def increment(self, smaller_increment: bool = False) -> None:
        """
        Function to increment arcpy Progressor position. If the optional
        'small_increment' is True, then progressor position is incremented based
        on small increments otherwise it is incremented by step_increment

        Args:
            smaller_increment:Boolean value to switch between overall processing
            vs individual record processing
        """
        if smaller_increment:
            self.current_step += self.small_increment
        else:
            self.current_step += self.step_increment
        arcpy.SetProgressorPosition(self.current_step)

    def update_label(self, message_id: int):
        """
        Function to print arcpy Message by ID and also update arcpy
        Progressor label

        Args:
            message_id: The geoprocessing message ID.
        """
        arcpy.AddIDMessage('INFORMATIVE', message_id)
        arcpy.SetProgressorLabel(arcpy.GetIDMessage(message_id))

    def set_small_increment(self, sub_steps: int):
        """
        Function to calculate step interval when processing individual
        recordings

        Args:
            sub_steps: Num of processing steps that is used to calculate step
             interval
        """
        self.small_increment = int(math.floor(self.step_increment / sub_steps))

    def generator_increment(self, gen_item):
        """utility function to use with generators to
         advance the progressor after every generated value

        Args:
            gen_item: the item generated

        Returns: gen_item

        """
        self.increment(smaller_increment=True)
        return gen_item

    # TODO: once proved this work, replace all usages of generator_increment by this new function
    def generator_increments(self, gen: Generator):
        """A wrapper function to increment the progressor state for each element of a generator
        and return the final value produced by the generator through the return statement

        Args:
            gen: the generator to be consumed

        Returns: anything that is returned by the given generator

        """
        while True:
            try:
                # advance the generator. By doing so we execute one iteration
                # of the specific function implemented by the generator
                next(gen)
                # increase the progressor by a small increment
                self.increment(smaller_increment=True)
            except StopIteration as e:
                # the StopIteration exception is thrown
                # when the generator reaches the return statement
                # So, just take the returned value and return it to the caller of this function
                return e.value
