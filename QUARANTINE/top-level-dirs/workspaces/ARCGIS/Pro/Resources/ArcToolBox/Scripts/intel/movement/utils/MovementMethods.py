'''
------------------------------------------------------------------------------
MovementMethods.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.8, Python 3.7
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2021-03-09 - jjones - original writeup
------------------------------------------------------------------------------
'''
from typing import Union

from intel.types import SparkDataFrame, SparkWindow, TrackDataFrame
from intel.enumerations import Movement

def create_window(track_id_field: str, time_field: str) -> SparkWindow:
    from pyspark.sql.window import Window

    return Window.partitionBy(track_id_field).orderBy(time_field)

def add_track_time(input_dataframe: Union[SparkDataFrame, TrackDataFrame],  
                      track_id_field: str,
                      direction: str = 'LAG',
                      index: int = 1) -> SparkDataFrame:
    """Takes an input Spark or Track DataFrame and adds a new field for either the previous ('LAG') or forward ('LEAD') time value.

    Args:
        input_dataframe (SparkDataFrame | TrackDataFrame): The input Spark or Track DataFrame that will have either the previous or forward time value added.
        track_id_field (str): The field containing the unique identifier for the individual tracks. 
        direction (str, optional): Whether to add the previous (LAG) or forward (LEAD) time value. Any value not 'LAG' or 'LEAD' raises a ValueError. Defaults to 'LAG'.
        index (int, optional): The number of records either before or after the current record to obtain the time from. Defaults to 1.

    Raises:
        ValueError: An invalid string was passed in the direction parameter.  Acceptable values are either 'LAG' or 'LEAD'.

    Returns:
        SparkDataFrame: A Spark or Track Dataframe with the previous or forward time values added.
    """
    from pyspark.sql.functions import lag, col, lead

    window = create_window(track_id_field=track_id_field, time_field=col(Movement.TIME_START.value))

    if direction == 'LAG':
        return input_dataframe.withColumn(Movement.PREV_TIME.value, lag(col(Movement.TIME_START.value), index).over(window))
    elif direction == 'LEAD':
        return input_dataframe.withColumn(Movement.FWD_TIME.value, lead(col(Movement.TIME_START.value), index).over(window))
    else:
        raise ValueError

def add_track_xy_as_field(input_dataframe: Union[SparkDataFrame, TrackDataFrame],
                          track_id_field: str,
                          time_field: str,
                          direction: str = 'CURRENT',
                          index: int = 1) -> SparkDataFrame:
    """Adds either the current, previous, or forward location X and Y as new fields int the specified dataframe.

    Args:
        input_dataframe (SparkDataFrame | TrackDataFrame): The input dataframe that will have the coordinates added.
        track_id_field (str): The field that contains the unique track identifer for the dataset.
        time_field (str): The field that contains the time value that will be used to order the track.
        direction (str, optional): Which coordinate pair to add.  Acceptable values are 'CURRENT', 'LAG', and 'LEAD'. Defaults to 'CURRENT'.
        index (int, optional): The number of records before or after the current record to use for the 'LEAD' or 'LAG' value. Defaults to 1.

    Raises:
        ValueError: A invalid value was presented to the direction parameter.

    Returns:
        SparkDataFrame: A dataframe with the appropriate fields added for either the current, previous, or forward coordinate values.
    """
    from pyspark.sql.functions import lag, col, lead
    from ga_spark.sql import functions as ST
    
    window = create_window(track_id_field=track_id_field, time_field=time_field)

    # Uses the Spark SQL lag function to go back by the value specified in the index param and capture that X value.
    # It then appends that to a new field as specified by the Movement Enum variable PX.
    if direction == 'CURRENT':
        return input_dataframe.withColumn(Movement.PX.value, ST.x(col(Movement.SHAPE.value))) \
                              .withColumn(Movement.PY.value, ST.y(col(Movement.SHAPE.value)))
    elif direction == 'LAG':
        return input_dataframe.withColumn(Movement.PREV_X.value, lag(ST.x(col(Movement.SHAPE.value)), index).over(window)) \
                              .withColumn(Movement.PREV_Y.value, lag(ST.y(col(Movement.SHAPE.value)), index).over(window))
    elif direction == 'LEAD':
        # Takes the input Spark DataFrame and creates a new column based on the Spark SQL lead function that adds the X and Y values
        # from the value specified in index parameter ahead of the current row.
        # This is then appended to a new column specified by the Movement Enum value for LEAD_X and LEAD_Y.
        return input_dataframe.withColumn(Movement.LEAD_X.value, lead(ST.x(col(Movement.SHAPE.value)), index).over(window)) \
                              .withColumn(Movement.LEAD_Y.value, lead(ST.y(col(Movement.SHAPE.value)), index).over(window))
    else:
        raise ValueError


def add_day_of_week(input_dataframe: Union[SparkDataFrame, TrackDataFrame]) -> Union[TrackDataFrame, SparkDataFrame]:
    from pyspark.sql.functions import date_format, col
    return input_dataframe.withColumn("day_of_week", date_format(col(Movement.TIME_START.value), 'E'))