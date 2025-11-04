'''
------------------------------------------------------------------------------
ClassifyMovementEvents.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.8, Python 3.7
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2020-09-19 - jjones - original writeup
* 2020-12-03 - jjones - renamed file, moved to current location
* 2021-03-09 - jjones - updated file to account for changes in ga_spark
------------------------------------------------------------------------------
'''

from __future__ import annotations

import arcpy

from intel.enumerations import Movement
from intel.movement.utils import get_objectid_field, get_time_field_from_lyr
from intel.movement import BaseMovementClass
from intel.types import SparkDataFrame, SparkWindow, Column
from intel.utilities import Logger, DEBUG
from intel.errors import InvalidPortalTokenError

class MovementEvents(BaseMovementClass):

    def __init__(self, input_features: str,
                       id_field: str,
                       out_featureclass: str,
                       linear_unit: str,
                       create_turn_ids: str,
                       return_turn_events: str,
                       turn_mid_points: str,
                       minimum_curvature: float = 2,
                       num_points: int = 3,
                       distance_boundary: str | None = None,
                       time_boundary: str | None = None,
                       regions_of_interest: str | None = None,
                       roi_id_field: str | None = None) -> None:

        super().__init__()
        
        self._input_features: str = input_features
        self._id_field: str = id_field
        self._out_featureclass: str = out_featureclass
        self._minimum_curvature: float = minimum_curvature
        self._num_points: int = num_points
        self._distance_boundary: str | None = distance_boundary
        self._time_boundary: str | None = time_boundary
        self._linear_unit: str | None = linear_unit
        self._roi: str | None = regions_of_interest
        self._roi_id_field: str | None = roi_id_field
        self._turn_ids = create_turn_ids
        self._return_turn_events = return_turn_events
        self._turn_mid_points = turn_mid_points

        self.DEBUG = DEBUG

        self.logger = Logger()
        self.logger.create_logger(self.__class__.__name__)
        
        if self.DEBUG:
            self.logger.debug(f"Loggers: {self.logger.loggers}")
            self.logger.debug(f"Active handlers: {self.logger.active_handlers}")

    def __repr__(self) -> str:
        return f"MovementEvents<input features: {self.input_features}, \n\
                                id field: {self.id_field}, \n\
                                out feature class: {self.out_featureclass}, \n\
                                minimum curvature: {self.minimum_curvature}, \n\
                                number of points: {self.num_points}, \n\
                                distance boundary: {self.distance_boundary}, \n\
                                time boundary: {self.time_boundary}, \n\
                                linear unit: {self.linear_unit}, \n\
                                regions of interest: {self.roi}, \n\
                                region of interest id field: {self.roi_id_field}>"

    def __str__(self) -> str:
        return self.__repr__()

    @property
    def input_features(self) -> str:
        return self._input_features
    @input_features.setter
    def input_features(self, value: str):
        self._input_features = value

    @property
    def id_field(self):
        return self._id_field
    @id_field.setter
    def id_field(self, value: str):
        self._id_field = value

    @property
    def out_featureclass(self):
        return self._out_featureclass
    @out_featureclass.setter
    def out_featureclass(self, value: str):
        self._out_featureclass = value

    @property
    def minimum_curvature(self):
        return self._minimum_curvature
    @minimum_curvature.setter
    def minimum_curvature(self, value: float):
        self._minimum_curvature = value

    @property
    def num_points(self):
        return self._num_points
    @num_points.setter
    def num_points(self, value: int):
        self._num_points = value

    @property
    def distance_boundary(self):
        return self._distance_boundary
    @distance_boundary.setter
    def distance_boundary(self, value: str):
        self._distance_boundary = value

    @property
    def time_boundary(self):
        return self._time_boundary
    @time_boundary.setter
    def time_boundary(self, value: str):
        self._time_boundary = value

    @property
    def linear_unit(self):
        return self._linear_unit
    @linear_unit.setter
    def linear_unit(self, value: str):
        self._linear_unit = value

    @property
    def roi(self):
        return self._roi
    @roi.setter
    def roi(self, value: str):
        self._roi = value

    @property
    def roi_id_field(self):
        return self._roi_id_field
    @roi_id_field.setter
    def roi_id_field(self, value: str):
        self._roi_id_field = value

    @property
    def oid_field(self):
        return self._oid_field
    @oid_field.setter
    def oid_field(self, value: str):
        self._oid_field = value

    @property
    def time_field(self) -> str:
        return self._time_field
    @time_field.setter
    def time_field(self, value: str) -> None:
        self._time_field = value

    @property
    def create_turn_ids(self) -> str:
        return self._turn_ids

    @property
    def return_turn_events(self) -> str:
        return self._return_turn_events

    @property
    def turn_mid_points(self) -> str:
        return self._turn_mid_points

    def add_turn_event_id_field(self, input_dataframe: SparkDataFrame) -> SparkDataFrame:
        from pyspark.sql.window import Window
        from pyspark.sql.functions import col, monotonically_increasing_id, when, lag, lead

        window: SparkWindow = Window.orderBy(Movement.TIME.value).partitionBy(Movement.TRACK_ID.value)

        def group(track_id: Column, turn_column: Column, group_column: Column) -> str:
            out: str = when(((track_id == lag(track_id).over(window)) & (turn_column != lag(turn_column).over(window)) & (turn_column == lead(turn_column).over(window))), group_column)\
                    .when(((track_id == lag(track_id).over(window)) & (turn_column == lag(turn_column).over(window)) & (turn_column != lead(turn_column).over(window))), lag(group_column).over(window))\
                    .when(((track_id == lag(track_id).over(window)) & (turn_column == lag(turn_column).over(window)) & (turn_column == lead(turn_column).over(window))), lag(group_column).over(window))\
                    .otherwise(group_column)
                    
            return out

        df: SparkDataFrame = input_dataframe.withColumn("group_id_1", monotonically_increasing_id())\
                                            .withColumn("group_id", group(col(Movement.TRACK_ID.value), col(Movement.TE.value), col("group_id_1")))\
                                            .withColumn(Movement.TEID.value, group(col(Movement.TRACK_ID.value), col(Movement.TE.value), col("group_id")))\
                                            .drop(*["group_id_1", "group_id"])

        return df

    def find_turn_midpoints(self, input_dataframe: SparkDataFrame) -> SparkDataFrame:
        from ga_spark.sql import functions as ST
        from pyspark.sql.window import Window
        from pyspark.sql.functions import col, row_number

        win: SparkWindow = Window.orderBy(Movement.TIME.value).partitionBy(Movement.TEID.value)

        if self.turn_mid_points ==  'true' or self.turn_mid_points == Movement.MIDPOINT.value:        
            df = self.add_turn_event_id_field(input_dataframe=input_dataframe)

            turn = df.where(col(Movement.TE.value) != "Traveling")\
                     .withColumn("window_row", row_number().over(win))\
                     .withColumn("geometry", ST.aggr_mean_center("geometry").over(win))\
                     .where(col("window_row") == 1)\
                     .drop(*["window_row"])

            trav_df = df.where(col(Movement.TE.value) == "Traveling")

            out = self.merge_dataframes(dataframes=[turn, trav_df])

            return out.drop(*["window_row"])

        else:
            return input_dataframe

    def filter_turn_events(self, input_dataframe: SparkDataFrame) -> SparkDataFrame:
        from pyspark.sql.functions import col

        if self.return_turn_events == 'true' or self.return_turn_events == Movement.TURN_EVENTS.value:
            return input_dataframe.where(col(Movement.TE.value) != "Traveling")
        else:
            return input_dataframe

    def turn_id_field(self, input_dataframe: SparkDataFrame) -> SparkDataFrame:
        if self.create_turn_ids == 'true' or self.create_turn_ids == Movement.TURN_ID.value:
            return input_dataframe if Movement.TEID.value in input_dataframe.columns else self.add_turn_event_id_field(input_dataframe)
        else:
            return input_dataframe.drop(*[Movement.TEID.value])


    def add_regions_of_interest(self, input_areas: SparkDataFrame, 
                                      input_points: SparkDataFrame,
                                      roi_objectid_field: str) -> SparkDataFrame:
        """Adds the regions of interest to the output dataframe.  This appends the regions of interest names
        to the output feature class.  This method is optional.  Will only be called if if a user provides 
        a regions of interest input.
        Args:
            input_areas (SparkDataFrame): The input regions of interest.
            input_points (Union[TrackDataFrame, SparkDataFrame]): A SparkDataFrame or TrackDataFrame, typically one that has already had all of the Movement Events calculated.
            roi_id_field (str): The name of the field containing unique identifiers for the regions of interest.  
        Returns:
            Union[TrackDataFrame, SparkDataFrame]: SparkDataFrame or TrackDataFrame with regions of interest populated.
        """
        try:
            from ga_spark.sql import functions as ST

            _roi_id_field = "ROI_name_field"

            points = input_points.select(self.oid_field, Movement.SHAPE.value)
            roi_df = input_areas.select(Movement.SHAPE.value, self.roi_id_field)\
                                .withColumnRenamed(Movement.SHAPE.value, Movement.SHAPE_JOIN.value)\
                                .withColumnRenamed(self.roi_id_field, _roi_id_field)

            self.roi_id_field = _roi_id_field
            
            # Calls the GeoAnalytics Desktop Join Feature function.  This is managed by the 
            # ga_spark library.  This does a simple intersect with no Time or Spatial proximity.
            join_df = roi_df.join(input_points, ST.intersects(roi_df[Movement.SHAPE_JOIN.value], points[Movement.SHAPE.value]))\
                                 .drop('$track')\
                                 .select(self.roi_id_field, self.oid_field)\
                                 .withColumnRenamed(self.oid_field, "join_OID")

            if self.DEBUG:
                self.logger.debug(f"points_drop columns: {points.columns}")
                self.logger.debug(f"join_df columns: {join_df.columns}")
            
            points_drop = input_points.drop('$track')
            
            return points_drop.join(join_df, points_drop[self.oid_field] == join_df["join_OID"], how='left')
        
        except Exception as e:
            self.handle_movement_error(e, id_message=190390)

    def calculate(self):
        try:
            arcpy.SetProgressor("step", min_range=0, max_range=13)

            if self.DEBUG:
                self.logger.debug(f"input features: {self.input_features}")
                self.logger.debug(f"id field: {self.id_field}")
                self.logger.debug(f"out feature class: {self.out_featureclass}")
                self.logger.debug(f"minimum curvature: {self.minimum_curvature}")
                self.logger.debug(f"number of points: {self.num_points}")
                self.logger.debug(f"distance boundary: {self.distance_boundary}")
                self.logger.debug(f"time boundary: {self.time_boundary}")
                self.logger.debug(f"linear unit: {self.linear_unit}")
                self.logger.debug(f"regions of interest: {self.roi}")
                self.logger.debug(f"region of interest id field: {self.roi_id_field}")
                self.logger.debug(f"Create turn ids: {self.create_turn_ids}")
                self.logger.debug(f"Return turn events: {self.return_turn_events}")
                self.logger.debug(f"Turn mid-points: {self.turn_mid_points}")

            d = arcpy.Describe(self.input_features)
            src_linear_unit: str = d.spatialReference.linearUnitName
            
            self.initialize_spark()

            from pyspark.sql.functions import col
            from ga_spark.sql import functions as ST

            df = self.read_layer(input_layer=self.input_features)

            if self.DEBUG:
                self.logger.debug(f"Input dataframe columns: {str(df.columns)}")
                self.logger.debug(f"Input dataframe type: {type(df)}")

            arcpy.SetProgressorLabel(arcpy.GetIDMessage(190283))
            arcpy.SetProgressorPosition()
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(190284))
            arcpy.SetProgressorPosition()
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(190285))
            arcpy.SetProgressorPosition()
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(190277))
            arcpy.SetProgressorPosition()
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(190278))
            arcpy.SetProgressorPosition()
            tracks: SparkDataFrame = df.mv.add_track_fields(source_layer=self.input_features, 
                                                            track_id_field=self.id_field)

            if self.DEBUG:
                self.logger.debug(f"Added tracks fields.")
                self.logger.debug(f"source_layer: {self.input_features}")
                self.logger.debug(f"track_id_field: {self.id_field}")
                self.logger.debug(f"oid_field_name: {self.oid_field}")

            self.oid_field = 'OID'        
            
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(190286))
            arcpy.SetProgressorPosition()
            self.logger.debug(arcpy.GetIDMessage(190286))
            speed: SparkDataFrame = tracks.mv.calculate_speed(src_linear_unit)

            if self.DEBUG:
                self.logger.debug("Calculate speed.")
                self.logger.debug(f"linear_unit: {src_linear_unit}")

            arcpy.SetProgressorLabel(arcpy.GetIDMessage(190287))
            arcpy.SetProgressorPosition()
            self.logger.debug(arcpy.GetIDMessage(190287))
            acceleration: SparkDataFrame = speed.mv.find_acceleration_deceleration()

            if self.DEBUG:
                self.logger.debug("Added accleration/deceleration events.")
            
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(190269))
            arcpy.SetProgressorPosition()
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(190288))
            arcpy.SetProgressorPosition()       
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(190289))
            arcpy.SetProgressorPosition()
            self.logger.debug(arcpy.GetIDMessage(190289))
            turns: SparkDataFrame = acceleration.mv.calculate_turn_events(minimum_curvature=self.minimum_curvature, 
                                                                          records_window=self.num_points)

            if self.DEBUG:
                self.logger.debug("Calculate direction")
                self.logger.debug(f"minimum_curvature: {self.minimum_curvature}\n\
                                    records_window: {self.minimum_curvature}")

            
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(190269))
            arcpy.SetProgressorPosition()
            bearing: SparkDataFrame = turns.mv.calculate_bearing()\
                                              .drop(*[Movement.PREV_TIME.value, Movement.FWD_TIME.value])

            if self.DEBUG:
                self.logger.debug("Calculate bearing")

            if self.roi is not None:
                roi_df = self.read_layer(input_layer=self.roi)
                roi_oid_field = get_objectid_field(input_layer=self.roi)

                rois = self.add_regions_of_interest(input_areas=roi_df, 
                                                    input_points=bearing,
                                                    roi_objectid_field=roi_oid_field)

                if self.DEBUG: 
                    self.logger.debug(f"Regions of interest: {rois.columns}")
                    self.logger.debug(f"input_areas: {self.roi}\
                                        input_points: bearing_df\
                                        roi_objectid_field: {roi_oid_field}")
                
                arcpy.SetProgressorLabel(arcpy.GetIDMessage(190290))
                arcpy.SetProgressorPosition
                self.logger.debug(arcpy.GetIDMessage(190290))
                try:
                   
                    drop_df = rois.withColumnRenamed("Speed", Movement.SPEED.value)\
                                  .withColumnRenamed(self.roi_id_field, Movement.ROID.value)\
                                  .withColumnRenamed(self.time_field, Movement.TIME.value)\
                                  .withColumnRenamed("OID", Movement.SRC_OID.value)\
                                  .withColumn(Movement.PX.value, ST.x(col(Movement.SHAPE.value)))\
                                  .withColumn(Movement.PY.value, ST.y(col(Movement.SHAPE.value)))\
                                  .select(
                                      Movement.SHAPE.value,
                                      Movement.TRACK_ID.value,
                                      Movement.TIME.value,
                                      Movement.SRC_OID.value,
                                      Movement.PX.value,
                                      Movement.PY.value,
                                      Movement.DD.value,
                                      Movement.TD.value,
                                      Movement.SPEED.value,
                                      Movement.MPH.value,
                                      Movement.KMPH.value,
                                      Movement.BE.value,
                                      Movement.TE.value,
                                      Movement.FB.value,
                                      Movement.TB.value,
                                      Movement.ROID.value,
                                  )
                    
                    if self.DEBUG:
                        self.logger.debug(f"Writing output feature class to {self.out_featureclass}")
                
                    midpoint = self.find_turn_midpoints(input_dataframe=drop_df)
                    fte = self.filter_turn_events(input_dataframe=midpoint)
                    turn_df = self.turn_id_field(input_dataframe=fte)
                    
                    turn_df.write.layer(self.out_featureclass)
                except Exception as e:
                    self.handle_movement_error(e, id_message=190385)
                           
            else:
                arcpy.SetProgressorLabel(arcpy.GetIDMessage(190290))
                arcpy.SetProgressorPosition()
                self.logger.debug(arcpy.GetIDMessage(190290))
                try:
                    drop_df = bearing.withColumnRenamed("Speed", Movement.SPEED.value)\
                                     .withColumnRenamed(self.time_field, Movement.TIME.value)\
                                     .withColumnRenamed("OID", Movement.SRC_OID.value)\
                                     .withColumn(Movement.PX.value, ST.x(col(Movement.SHAPE.value)))\
                                     .withColumn(Movement.PY.value, ST.y(col(Movement.SHAPE.value)))\
                                     .select(
                                         Movement.SHAPE.value,
                                         Movement.TRACK_ID.value,
                                         Movement.TIME.value,
                                         Movement.SRC_OID.value,
                                         Movement.PX.value,
                                         Movement.PY.value,
                                         Movement.DD.value,
                                         Movement.TD.value,
                                         Movement.SPEED.value,
                                         Movement.MPH.value,
                                         Movement.KMPH.value,
                                         Movement.BE.value,
                                         Movement.TE.value,
                                         Movement.FB.value,
                                         Movement.TB.value,
                                     )
                    
                    if self.DEBUG:
                        self.logger.debug(f"Writing output feature class to {self.out_featureclass}")

                    midpoint = self.find_turn_midpoints(input_dataframe=drop_df)
                    fte = self.filter_turn_events(input_dataframe=midpoint)
                    turn_id = self.turn_id_field(input_dataframe=fte)
                
                    turn_id.write.layer(self.out_featureclass)
                except Exception as e:
                    self.handle_movement_error(e, 190385)           
            
            return self.out_featureclass
        
        except InvalidPortalTokenError:
            self.logger.error(arcpy.GetIDMessage(190297))
            exit()
        
        except Exception as e:
            self.handle_movement_error(e)