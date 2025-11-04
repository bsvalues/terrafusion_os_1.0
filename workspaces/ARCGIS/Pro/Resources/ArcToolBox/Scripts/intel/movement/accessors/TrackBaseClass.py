'''
------------------------------------------------------------------------------
MovementAccessor.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.6, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2020-10-30 - split off Track functions and created TrackDataFrame class
* 2021-05-20 - reformatted into supporting a dataframe accessor
------------------------------------------------------------------------------
'''
from __future__ import annotations

import arcpy
import logging

from typing import Dict, Optional

from intel.movement.utils import add_track_xy_as_field
from intel.movement.utils import add_track_time
from intel.enumerations import Movement
from intel.errors import GASparkNotInitializedError
from intel.types import SparkDataFrame, Column
from intel.utilities import DEBUG, Logger
from intel.movement import BaseMovementClass

class TrackBaseClass(BaseMovementClass):

    def __init__(self) -> None:

        super().__init__()

        self.DEBUG = DEBUG
        
        self._dist_diff: int
        self._time_diff: int
        self._dist_unit: str
        self._time_unit: str
        self._track_id_field: str
        self._time_field: str
        self._spatial_reference: int
        self._input_dataframe: SparkDataFrame
        self._oid_field: str
        self._convert_linear_unit: bool
        self._dataframe: SparkDataFrame
        self._spark: str

        self.logger = Logger()
        self.logger.create_logger(self.__class__.__name__)
        if self.DEBUG:
            self.logger.debug(f"Loggers: {self.logger.loggers}")
            self.logger.debug(f"Active handlers: {self.logger.active_handlers}")

    def __repr__(self) -> str:
        return f"SparkDataFrame<distance difference: {self.dist_diff}, \n\
                                distance unit: {self.dist_unit}, \n\
                                time difference: {self.time_diff}, \n\
                                time unit: {self.time_unit}, \n\
                                time field: {self.time_field}, \n\
                                track identifier: {self.id_field}, \n\
                                spatial reference: {self.spatial_reference}>"

    def __str__(self) -> str:
        return self.__repr__()

    @property
    def input_dataframe(self) -> SparkDataFrame:
        return self._input_dataframe
    @input_dataframe.setter
    def input_dataframe(self, value: SparkDataFrame) -> None:
        self._input_dataframe = value

    @property
    def id_field(self) -> str:
        return self._track_id_field
    @id_field.setter
    def id_field(self, value: str) -> None:
        self._track_id_field = value

    @property
    def convert_linear_unit(self) -> bool:
        return self._convert_linear_unit
    @convert_linear_unit.setter
    def convert_linear_unit(self, value: bool) -> None:
        self._convert_linear_unit = value

    @property
    def dataframe(self) -> SparkDataFrame:
        return self._dataframe
    @dataframe.setter
    def dataframe(self, value: SparkDataFrame) -> None:
        self._dataframe = value
    
    @property
    def dist_diff(self) -> int:
        return self._dist_diff

    @property
    def time_diff(self) -> int:
        return self._time_diff

    @property
    def dist_unit(self):
        return self._dist_unit
    @dist_unit.setter
    def dist_unit(self, value: str):
        self._dist_unit = value


    @property
    def time_unit(self):
        return self._time_unit

    @property
    def time_field(self) -> str:
        return self._time_field
    @time_field.setter
    def time_field(self, value: str) -> None:
        self._time_field = value

    @property
    def oid_field(self) -> str:
        return self._oid_field
    @oid_field.setter
    def oid_field(self, value: str) -> None:
        self._oid_field = value

    @property
    def spark(self):
        return self._spark
    @spark.setter
    def spark(self, value):
        self._spark = value

    @property
    def spatial_reference(self):
        return self._spatial_reference

    def add_track_field(self) -> SparkDataFrame:
        try:
            from pyspark.sql.functions import when, abs, struct, col
            
            from ga_spark.sql import functions as ST

            drop_df = self.drop_fields_on_load(input_dataframe=self.input_dataframe,
                                               keep_fields=[
                                                    Movement.SHAPE.value,
                                                    Movement.TIME_START.value,
                                                    self.id_field,
                                                    self.time_field,
                                                    self.oid_field,
                                               ]
                                            )

            prev_xy = add_track_xy_as_field(input_dataframe=drop_df,
                                            track_id_field=self.id_field,
                                            time_field=self.time_field,
                                            direction='LAG')

            fwd_xy = add_track_xy_as_field(input_dataframe=prev_xy, 
                                        track_id_field=self.id_field, 
                                        time_field=self.time_field,
                                        direction='LEAD')

            fwd_geo = fwd_xy.withColumn(Movement.PREV_GEO.value, ST.point(col(Movement.PREV_X.value), col(Movement.PREV_Y.value)))\
                            .withColumn(Movement.NEXT_GEO.value, ST.point(col(Movement.LEAD_X.value), col(Movement.LEAD_Y.value)))\
                            .drop(*[
                                Movement.PREV_X.value,
                                Movement.PREV_Y.value,
                                Movement.LEAD_X.value,
                                Movement.LEAD_Y.value,
                            ])

            prev_time = add_track_time(input_dataframe=fwd_geo,
                                    track_id_field=self.id_field)

            fwd_time = add_track_time(input_dataframe=prev_time,
                                    track_id_field=self.id_field,
                                    direction='LEAD')

            time_diff = self.calculate_time_difference(input_dataframe=fwd_time, 
                                                       other_time_field=Movement.PREV_TIME.value)
            
            dist_diff = self.calculate_distance_difference(input_dataframe=time_diff,
                                                           other_geometry=Movement.PREV_GEO.value)

            fwd_time_diff = self.calculate_time_difference(input_dataframe=dist_diff, 
                                                           other_time_field=Movement.FWD_TIME.value,
                                                           position='fwd')
            
            fwd_dist_diff = self.calculate_distance_difference(input_dataframe=fwd_time_diff,
                                                               position='fwd',
                                                               other_geometry=Movement.NEXT_GEO.value)

            if self.convert_linear_unit:
                conv_df = self.convert_angular_to_linear(fwd_dist_diff)

            else:
                conv_df: SparkDataFrame = fwd_dist_diff
                
                        
            drop_fields = [
                            Movement.PX.value,
                            Movement.PY.value,
                            "__prev_x",
                            "__prev_y",
                            Movement.PREV_X.value,
                            Movement.PREV_Y.value,
                            "__fwd_x",
                            "__fwd_y",
                            Movement.LEAD_X.value,
                            Movement.LEAD_Y.value,
                            'fwd_distance_diff',
                            'fwd_time_diff',
                        ]

            out: SparkDataFrame = conv_df.drop(*drop_fields)\
                                         .withColumnRenamed(self.id_field, Movement.TRACK_ID.value)\
                                         .withColumnRenamed(self.oid_field, "OID")
                                            
            return out 
        
        except Exception as e:
            self.handle_movement_error(exception=e, id_message=190386)

    def partition_tracks(self, time_difference: str, distance_difference: str) -> SparkDataFrame:
        """[summary]
        Args:
            time_difference (str): [description]
            distance_difference (str): [description]
        Returns:
            SparkDataFrame: [description]
        """
        from pyspark.sql.functions import monotonically_increasing_id, row_number
        from intel.movement.utils import create_window
        
        time_value, time_unit = time_difference.split(" ")
        distance_value, distance_unit = distance_difference.split(" ")
        
        tracks: SparkDataFrame = self.spark.ga.tools.reconstruct_tracks(self.dataframe, 
                                                                        track_fields=[self.id_field], 
                                                                        summary_fields=[], 
                                                                        time_split=float(time_value),
                                                                        time_split_unit=time_unit, 
                                                                        distance_split=float(distance_value), 
                                                                        distance_split_unit=distance_unit)\
                                                    .select(self.id_field,
                                                            'COUNT',
                                                            'TRACK_DURATION',
                                                            Movement.SHAPE.value,
                                                            Movement.TIME_START.value,
                                                            Movement.TIME_END.value)\
                                                    .withColumnRenamed(Movement.SHAPE.value, Movement.SHAPE_JOIN.value)\
                                                    .withColumnRenamed(Movement.TIME_START.value, 'line_start_time')\
                                                    .withColumn("track_uid", monotonically_increasing_id())



        _join_condition = f"$join['{self.id_field}'] == $target['{self.id_field}']"

        window = create_window("track_id", Movement.TIME_START.value)
        
        join: SparkDataFrame =  self.spark.ga.tools.join_features(target_layer=self.dataframe, 
                                                                  join_layer=tracks,
                                                                  join_operation="JoinOneToMany",
                                                                  temporal_relationship="During", 
                                                                  join_condition=_join_condition)\
                                                    .withColumnRenamed('COUNT', 'TRACK_COUNT')\
                                                    .withColumn("TRACK_POINT_NUM", row_number().over(window))\
                                                    .select('OID',
                                                            self.id_field,
                                                            'track_uid',
                                                            'TRACK_COUNT',
                                                            'TRACK_DURATION',
                                                            'TRACK_POINT_NUM',
                                                            Movement.SHAPE.value,
                                                            Movement.PREV_GEO.value,
                                                            Movement.NEXT_GEO.value,
                                                            Movement.TIME_START.value,
                                                            Movement.PREV_TIME.value,
                                                            Movement.FWD_TIME.value,
                                                            Movement.TD.value,
                                                            Movement.DD.value,)

        return join

    def convert_angular_to_linear(self, input_dataframe: SparkDataFrame) -> SparkDataFrame:
              
        try:
            angular_to_linear: Dict[str, float] = {
                                                   "Feet": 364567.2, 
                                                   "Meters": (364567.2 * 0.3048), 
                                                   "Miles": (364567.2 * 0.000189394), 
                                                   "Kilometers": (364567.2 * 0.000189394),
                                                   "Nautical Miles": (364567.2 * 0.000164579)
                                                }
            
            return input_dataframe.withColumn(Movement.DD.value, input_dataframe[Movement.DD.value] * angular_to_linear[self.dist_unit])
        except Exception as e:
            self.handle_movement_error(exception=e, id_message=190386)

    def calculate_time_difference(self, 
                                input_dataframe: SparkDataFrame, 
                                other_time_field: str, 
                                position: Optional[str] = None,
                                debug: bool = False) -> SparkDataFrame:
            """Adds a new field to the input DataFrame for the time difference between the current and previous record. 
            Args:
                input_dataframe (SparkDataFrame): A normalized DataFrame, generally the output from the calculate_distance_difference method.
            
            Returns:
                SparkDataFrame: A new DataFrame that contains the time difference between the current point and previous point.
            """
            try:
                from pyspark.sql.types import LongType
                from pyspark.sql.functions import col

                time_df = input_dataframe
                # In order to do this, Spark has the ability to convert datetime fields into long fields where the datetime gets converted to
                # Unix time.  From there it is a simple subtraction of the current records newly converted time field (in Unix time) from the previous 
                # records time field (in Unix time).  The result is presented back as an integer representing the difference in seconds between the 
                # two points. This method is more Spark-friendly and does not rely on User Defined Functions, which significantly slowed down performance of
                # the tool.
                
                if position is None:
                    field_name = Movement.TD.value
                else:
                    field_name = position + "_" + Movement.TD.value
                
                df: SparkDataFrame = time_df.withColumn(field_name, (col(Movement.TIME_START.value).cast(LongType()) - 
                                                                     col(other_time_field).cast(LongType())))
                
                return df
            except Exception as e:
                self.handle_movement_error(exception=e, id_message=190389)

    def calculate_distance_difference(self,
                                      input_dataframe: SparkDataFrame,
                                      other_geometry: str,
                                      position: str | None = None,
                                      debug: bool = False) -> SparkDataFrame:
        """Calculates the distance difference between the current point and the previous point in the track.  
            The equation used for this calculation is:
                        sqrt(((X2 - X1) **2) + ((Y2 - Y1) **2))
            In order to reduce the amount of imports used during this module, the 1/2 exponent is used.  This is to help performance and to keep
            this method from needing to be a Python User Defined Function.  
            Method assumes that the previous XY data has been added.  If previous XY data has not been added, gives option to add the values via the add_previous_xy
            parameter.
        Args:
            input_dataframe (str): A Spark DataFrame.  Optionally can contain the previous records XY data as fields. 
        Returns:
            SparkDataFrame: A Spark DataFrame with a field for calculated distance added.  
        """
        
        # Adds new field with the calculated distance difference between the two points.  This is a flat linear distance, does not take into account
        # curvature of the Earth.  This is partially why the user is forced to use a Projected Coordinate System.
        # This is returned to the user a new Spark DataFrame and as the output of this method.
        try:
            from pyspark.sql.functions import col
            from ga_spark.sql import functions as ST
            
            if position is None:
                field_name = Movement.DD.value
            else:
                field_name = position + "_" + Movement.DD.value
            
            df: SparkDataFrame = input_dataframe.withColumn(field_name, (((ST.x(col(Movement.SHAPE.value)) - ST.x(col(other_geometry))) ** 2) +
                                                                         ((ST.y(col(Movement.SHAPE.value)) - ST.y(col(other_geometry))) ** 2)) ** 
                                                                          (1/2))
            
            return df
        except Exception as e:
            self.handle_movement_error(exception=e, id_message=190386)


    def calculate_bearing(self) -> SparkDataFrame:
        """Calculates the bearing in the input dataframe. The tool adds the "from_bearing"
        and "to_bearing" fields to the output.  The method used to calculate bearing was obtained
        from the following website:
            https://www.analytics-link.com/post/2018/08/21/calculating-the-compass-direction-between-two-points-in-python
        Args:
            input_track_dataframe (SparkDataFrame): A Track DataFrame that will have to_bearing and from_bearing calculated
        Returns:
            SparkDataFrame: A track dataframe that will have the to bearing and from bearing calculated
        """
        try:
            from pyspark.sql.functions import atan2, when, col
            from math import pi
            from ga_spark.sql import functions as ST

            def bearing(x1: float, y1: float, x2: float, y2: float) -> Column:
                delta_x = x2 - x1
                delta_y = y2 - y1
                out: Column = atan2(delta_x, delta_y)/pi*180
                return out

        
            bearing_df = self.dataframe.withColumn("from_bearing", bearing(ST.x(col(Movement.SHAPE.value)),
                                                                           ST.y(col(Movement.SHAPE.value)),
                                                                           ST.x(col(Movement.PREV_GEO.value)),
                                                                           ST.y(col(Movement.PREV_GEO.value))))\
                                        .withColumn("to_bearing", bearing(ST.x(col(Movement.SHAPE.value)),
                                                                          ST.y(col(Movement.SHAPE.value)),
                                                                          ST.x(col(Movement.NEXT_GEO.value)),
                                                                          ST.y(col(Movement.NEXT_GEO.value))))
            
            bearing_fixed = bearing_df.withColumn("from_bearing", when((col("from_bearing") < 0), col("from_bearing") + 360)\
                                                                    .otherwise(col("from_bearing")))\
                                      .withColumn("to_bearing", when((col("to_bearing") < 0), col("to_bearing") + 360)\
                                                                     .otherwise(col("to_bearing")))

            return bearing_fixed
        except Exception as e:
            self.handle_movement_error(exception=e, id_message=190387)

    def calculate_speed(self, linear_unit: str | None = None) -> SparkDataFrame:
        """Calculates the speed of the Movement Events in both Miles/Hour (MPH) and Kilometers/Hour (KMPH).
        The formula used to calculate the speed was:
                Velocity = Distance / Time
        For the distance, the value used was the distance differnce calculated by the calculate_distance_difference method.
        For the time, the value used was the time difference calculated by the calculate_time_difference method.
        Args:
            input_dataframe (SparkDataFrame): A SparkDataFrame that needs to have speed calculated.  
                                                This is the output from the calculate time difference method.
            linear_unit (str): The linear unit used in the Projected Coordinate System. (Default is None)
        Returns:
            SparkDataFrame: A new SparkDataFrame that contains the speed columns for Miles/Hour and Kilometers/Hour.
        """
        try:
            from pyspark.sql.functions import col
                
            conversions_dict = {"Meter":{"MPH": 2.23694, "KMPH": 3.6}, "Foot": {"MPH": 0.681818, "KMPH": 1.09728}}

            # Calculates the raw speed of the point using Distance Differnce column and the Time Difference column. 
            # Currently, the raw speed is in Meters/Second.
            df = self.dataframe.withColumn("Speed", (col(Movement.DD.value) / col(Movement.TD.value)))
            
            # Does the conversion from raw speed (Meters/Second) to Miles/Hour.
            # Converts from raw speed (Meters/Second) to Miles/Hour. This is the Spark DataFrame that gets returned as the 
            # output from this method.
            out_speed = df.withColumn(Movement.MPH.value, col('Speed') * conversions_dict[linear_unit]["MPH"]) \
                          .withColumn(Movement.KMPH.value, col('Speed') * conversions_dict[linear_unit]["KMPH"])
            
            return out_speed
        except Exception as e:
            self.handle_movement_error(exception=e, id_message=190388)

    def find_acceleration_deceleration(self) -> SparkDataFrame:
        """Identifies periods of acceleration and deceleration.  Annotates when those events started and ended.  Further indicates when the track is stopped.

        Args:
            input_dataframe (SparkDataFrame): Input SparkDataFrame where Speed and Time Differences have been calculated.

        Returns:
            SparkDataFrame: New SparkDataFrame that contains the "BrakeEvent" field.
        """
        try:
            from pyspark.sql.functions import when, lag, lead, col
            from pyspark.sql.window import Window
            
            # Inner function that is used to calculate a values in a new column specifying Starting and Ending of Brake Events and Acceleration Events,  Accelration
            # Braking, Stopped and Traveling.  This method of using .when statements and .otherwise is significantly more performant that using Python User Defined Functions.
            def brake(accelerating: Column, braking: Column, speed: Column) -> str:
                out: str = when(((braking - lag(braking,1).over(over_columns))== 1), Movement.SBE.value) \
                            .when(((braking - lead(braking,1).over(over_columns))== 1), Movement.EBE.value) \
                            .when((braking == 1) & ((lag(braking,1).over(over_columns)) == 1) & ((lead(braking,1).over(over_columns)) == 1), Movement.BRAKE.value) \
                            .when(((accelerating - lag(accelerating,1).over(over_columns))== 1), Movement.SAE.value) \
                            .when(((accelerating - lead(accelerating,1).over(over_columns))== 1), Movement.EAE.value) \
                            .when((accelerating == 1) & ((lag(accelerating,1).over(over_columns)) == 1) & ((lead(accelerating,1).over(over_columns)) == 1), Movement.ACCEL.value) \
                            .when((speed == 0), Movement.STOP.value) \
                            .otherwise(Movement.TRAV.value)
                
                return out
            
            # Creates a Window function that is used to go through the Spark DataFrame row by row.  This Window Function partitions the data into tracks based
            # on the ID field specified on initialization and orders it by the time field that is returned from the input layer. 
            over_columns = Window.partitionBy(self.id_field).orderBy(self.time_field)

            # Calculates the Speed Difference between the current record and the next record.  
            speed_diff = self.dataframe.withColumn("SpeedDiff", lead("Speed", 1).over(over_columns) - col('Speed'))
            
            # If the Speed Diff value is negative, that indicates that the speed after the current row is lower than the current row.
            # This is indicative of a mover slowing down. This then populates a value of 1 in a new field called "braking".
            # This is then used in the brake inner function.
            # If the Speed Diff is positive, this indicates that the speed after the current row is higher than the current row. 
            # This would indicate a mover speed up.  This then populates a value of 1 in a new field called "accelerating".
            # This is then used in the brake inner function.
            raw_acc_brake = speed_diff.withColumn("braking", when(col("SpeedDiff") < 0, 1).otherwise(0)) \
                                    .withColumn("accelerating", when(col("SpeedDiff") > 0, 1).otherwise(0))
            
            return raw_acc_brake.withColumn(Movement.BE.value, brake(col("accelerating"), col("braking"), col("Speed")))\
                                .drop(*['SpeedDiff', 'braking', 'accelerating'])
        except Exception as e:
            self.handle_movement_error(exception=e, id_message=190388)

    def calculate_direction(self, minimum_curvature: float = 15, 
                                  records_window: int = 1) -> SparkDataFrame:

        try:
            from pyspark.sql.functions import atan2, when, col
            from math import pi
            from intel.movement.utils import add_track_xy_as_field
            from ga_spark.sql import functions as ST

            def bearing(x1: float, y1: float, x2: float, y2: float) -> Column:
                delta_x = x2 - x1
                delta_y = y2 - y1
                out: Column = atan2(delta_x, delta_y)/pi*180
                return out

            if records_window == 1:
                bearing_df = self.dataframe.withColumn("prev_bearing", bearing(ST.x(col(Movement.PREV_GEO.value)),
                                                                               ST.y(col(Movement.PREV_GEO.value)),
                                                                               ST.x(col(Movement.SHAPE.value)),
                                                                               ST.y(col(Movement.SHAPE.value))))\
                                           .withColumn("next_bearing", bearing(ST.x(col(Movement.SHAPE.value)),
                                                                               ST.y(col(Movement.SHAPE.value)),
                                                                               ST.x(col(Movement.NEXT_GEO.value)),
                                                                               ST.y(col(Movement.NEXT_GEO.value))))

            else:
                geo2 = add_track_xy_as_field(self.dataframe, col(self.id_field), col(self.time_field), direction='LAG', index=records_window)
                geo = add_track_xy_as_field(geo2, col(self.id_field), col(self.time_field), direction='LEAD', index=records_window)
                
                bearing_df = geo.withColumn("prev_bearing", bearing(col(Movement.PREV_X.value),
                                                                    col(Movement.PREV_Y.value),
                                                                    ST.x(col(Movement.SHAPE.value)),
                                                                    ST.y(col(Movement.SHAPE.value))))\
                                .withColumn("next_bearing", bearing(ST.x(col(Movement.SHAPE.value)),
                                                                    ST.y(col(Movement.SHAPE.value)),
                                                                    col(Movement.LEAD_X.value),
                                                                    col(Movement.LEAD_Y.value)))\
                                .drop(*[
                                    Movement.PREV_X.value,
                                    Movement.PREV_Y.value,
                                    Movement.LEAD_X.value,
                                    Movement.LEAD_Y.value,
                                ])

            bearing_fixed = bearing_df.withColumn("next_bearing", when((col("next_bearing") < 0), col("next_bearing") + 360)\
                                                                    .otherwise(col("next_bearing")))\
                                    .withColumn("prev_bearing", when((col("prev_bearing") < 0), col("prev_bearing") + 360)\
                                                                    .otherwise(col("prev_bearing")))

            def turns(bearing1: Column, bearing2: Column, speed: Column) -> Column:
                out: Column =  when((speed == Movement.STOP.value), Movement.STOP.value)\
                                .when((bearing1==0) | (bearing2==0), Movement.TRAV.value)\
                                .when(((bearing1 > 270) & (bearing2 < 90 )) & (bearing1-(bearing2+360) < minimum_curvature * -1) & (bearing1-(bearing2+360) > -120), Movement.LEFT_TURN.value)\
                                .when(((bearing1 > 270) & (bearing2 < 90 )) & (bearing1-(bearing2+360) > minimum_curvature) & (bearing1-(bearing2+360) < 120), Movement.RIGHT_TURN.value)\
                                .when(((bearing1 > 270) & (bearing2 < 90 )) &  (bearing1-(bearing2+360) > 120), Movement.TRAV.value)\
                                .when(((bearing1 > 270) & (bearing2 < 90 )) &  (bearing1-(bearing2+360) < -120), Movement.TRAV.value)\
                                .when(((bearing2 > 270) & (bearing1 < 90 )) & (bearing2-(bearing1+360) < minimum_curvature * -1) & (bearing2-(bearing1+360) > -120), Movement.LEFT_TURN.value)\
                                .when(((bearing2 > 270) & (bearing1 < 90 )) & (bearing2-(bearing1+360) > minimum_curvature) & (bearing2-(bearing1+360) < 120), Movement.RIGHT_TURN.value)\
                                .when(((bearing2 > 270) & (bearing1 < 90 )) &  (bearing2-(bearing1+360) > 120), Movement.TRAV.value)\
                                .when(((bearing2 > 270) & (bearing1 < 90 )) &  (bearing2-(bearing1+360) < -120), Movement.TRAV.value)\
                                .when((bearing1-bearing2 < 0) & (bearing1-bearing2 < (minimum_curvature * -1)) & (bearing1-bearing2 > -120), Movement.LEFT_TURN.value)\
                                .when((bearing1-bearing2 < 0) & (bearing1-bearing2 < -120), Movement.TRAV.value)\
                                .when((bearing1-bearing2 > 0) & (bearing1-bearing2 > minimum_curvature) & (bearing1-bearing2 < 120), Movement.RIGHT_TURN.value)\
                                .when((bearing1-bearing2 > 0) & (bearing1-bearing2 > 120), Movement.TRAV.value)\
                                .otherwise(Movement.TRAV.value)
                
                return out

            bearing_diff = bearing_fixed.withColumn(Movement.TE.value, turns(col("next_bearing"), col("prev_bearing"), col(Movement.BE.value)))\
                                        .drop(*[
                                            Movement.PX.value,
                                            Movement.PY.value,
                                            Movement.PREV_X.value,
                                            Movement.PREV_Y.value,
                                            Movement.LEAD_X.value,
                                            Movement.LEAD_Y.value,
                                            "next_bearing",
                                            "prev_bearing",
                                        ])

            return bearing_diff
        except Exception as e:
            self.handle_movement_error(exception=e, id_message=190384)