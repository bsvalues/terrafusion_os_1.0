'''
------------------------------------------------------------------------------
FindCotravelers.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.6, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2020-03-02 - jjones - original writeup
* 2020-05-01 - jjones - updated default output symbology for Find Cotravelers and Find Meeting Locations
* 2020-09-14 - jjones - split Cotravelers into separate file, refactored to take advantage of ga_spark functionality
* 2020-12-03 - jjones - renamed file to match class name
* 2021-02-01 - jjones - added __repr__, __str__, and __del__methods
* 2021-03-11 - jjones - updates due to underlying changes in ga_spark
------------------------------------------------------------------------------
'''
from __future__ import annotations

import arcpy
import json
import numpy as np
import os

from typing import Dict, List

from gautils import split_unit

from intel.movement.MovementBaseClass import BaseMovementClass
from intel.movement.utils import get_time_field_from_lyr, add_track_xy_as_field

from intel.types import SparkDataFrame, StyleJSON, TimeDifferenceList, SparkWindow
from intel.enumerations import Movement
from intel.data_classes.Movement import FindCotravelerResult
from intel.utilities import DEBUG, Logger, error_handler, general_error_logger, LocaleValidate
from intel.errors import InvalidPortalTokenError
from intel.movement.styles.FindCotravelersStyle import apply_cotravelers_symbology


class CotravelersLogic(BaseMovementClass):
    # TODO:  Add method for creating optional output summarization table.
    
    def __init__(self, source_features: str, 
                       src_unique_id: str,
                       output_point_features: str, 
                       search_distance: str = '100 Meters', 
                       time_difference: str = '10 Minutes',
                       input_type: str = "ONE_FEATURECLASS",
                       secondary_features: str | None = None,
                       secondary_id_field: str | None = None,
                       create_summary_table: bool = False,
                       out_summary_table: str | None = None,
                       include_min_time_cotraveling: bool = False,
                       min_time_cotraveling: str = '1 Minutes') -> None:  
        
        super().__init__()

        self._loc = LocaleValidate()
        
        self._source_features = source_features
        self._src_unique_id = src_unique_id
        self._search_distance = search_distance
        self._output_point_features = output_point_features
        self._time_difference = time_difference
        self._input_type = input_type
        self._secondary_features = secondary_features
        self._secondary_id_field = secondary_id_field
        self._create_summary_table = create_summary_table
        self._out_summary_table = out_summary_table
        self._include_min_time_cotraveling = include_min_time_cotraveling
        self._min_time_cotraveling = min_time_cotraveling

        self.delete_features = []
        self.cotravler_pairs_dict = {}
        self.xy_dict = []
        self.cotraveler_pairs_coords = []
        self.time_difference_list = []

        self._near_dist, self._near_dist_unit = split_unit(self.search_distance)
        self._temp_dist, self._temp_dist_unit = split_unit(self.time_difference)

        self.DEBUG = DEBUG

        self.logger = Logger()
        self.logger.create_logger(self.__class__.__name__)
        
        if self.DEBUG:
            self.logger.debug(f"Loggers: {self.logger.loggers}")
            self.logger.debug(f"Active handlers: {self.logger.active_handlers}")

    def __del__(self) -> None:
        for f in self.delete_features:
            if arcpy.Exists(f):
                arcpy.DeleteFeatures_management(f)

        del self.cotravler_pairs_dict
        del self.xy_dict
        del self.cotraveler_pairs_coords
        del self.time_difference_list

    def __repr__(self) -> str:
        return f"FindCotravelers<source features: {self._source_features},\n\
                                 source unique identifier: {self._src_unique_id},\n\
                                 search distance: {self._search_distance},\n\
                                 output point features:  {self._output_point_features},\n\
                                 time difference: {self._time_difference}, \n\
                                 input type: {self._input_type}, \n\
                                 secondary features: {self._secondary_features}, \n\
                                 secondary unique identifier: {self._secondary_id_field}, \n\
                                 create summary table: {self._create_summary_table}, \n\
                                 summary table output location: {self._out_summary_table}, \n\
                                 minimum cotraveling duration filter: {self._include_min_time_cotraveling}, \n\
                                 minimum cotraveling time: {self._min_time_cotraveling}>"

    def __str__(self) -> str:
        return self.__repr__()
            

    @property
    def source_features(self) -> str:
        return self._source_features
    @source_features.setter
    def source_features(self, value: str) -> None:
        if type(value) is not str:
            raise TypeError
        else:
            self._source_features = value

    @property
    def track_id(self) -> str:
        return self._src_unique_id
    @track_id.setter
    def track_id(self, value: str) -> None:
        if type(value) is not str:
            raise TypeError
        else:
            self._src_unique_id = value

    @property
    def search_distance(self) -> str:
        value_unit = self._search_distance.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._search_distance)
        switched_distance = f"{value} {value_unit}"
        return switched_distance
    @search_distance.setter
    def search_distance(self, value: str) -> None:
        if type(value) is not str:
            raise TypeError
        else:
            self._search_distance = value

    @property
    def output_point_features(self) -> str:
        return self._output_point_features
    @output_point_features.setter
    def output_point_features(self, value: str) -> None:
        if type(value) is not str:
            raise TypeError
        else:
            self.output_point_features = value

    @property
    def time_difference(self) -> str:
        value_unit = self._time_difference.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._time_difference)
        switched_time_difference = f"{value} {value_unit}"
        return switched_time_difference
    @time_difference.setter
    def time_difference(self, value: str) -> None:
        if type(value) is not str:
            raise TypeError
        else:
            self._time_difference = value

    @property
    def input_type(self) -> str:
        return self._input_type
    @input_type.setter
    def input_type(self, value: str) -> None:
        if type(value) is not str:
            raise TypeError
        else:
            self._input_type = value

    @property
    def secondary_features(self) -> str:
        assert self._secondary_features
        return self._secondary_features
    @secondary_features.setter
    def secondary_features(self, value: str) -> None:
        if type(value) is not str:
            raise TypeError
        else:
            self._secondary_features = value

    @property
    def secondary_id_field(self) -> str:
        assert self._secondary_id_field
        return self._secondary_id_field
    @secondary_id_field.setter
    def secondary_id_field(self, value: str) -> None:
        if type(value) is not str:
            raise TypeError
        else:
            self._secondary_id_field = value

    @property
    def create_summary_table(self) -> bool:
        return self._create_summary_table
    @create_summary_table.setter
    def create_summary_table(self, value: bool) -> None:
        if type(value) is not str:
            raise TypeError
        else:
            self._create_summary_table = value

    @property
    def out_summary_table(self) -> str:
        assert self._out_summary_table
        return self._out_summary_table
    @out_summary_table.setter
    def out_summary_table(self, value: str) -> None:
        if type(value) is not str:
            raise TypeError
        else:
            self._out_summary_table = value

    @property
    def keep_fields(self) -> List[str]:
        return [
            Movement.TRAV_ID.value,
            Movement.COTR_ID.value,
            Movement.TRAV_TIME.value,
            Movement.COTR_TIME.value,
            Movement.X_TRAV.value,
            Movement.Y_TRAV.value,
            Movement.X_COTR.value,
            Movement.Y_COTR.value,
            Movement.TD.value,
            Movement.DD.value,
            Movement.UI.value,
            Movement.SHAPE.value,
        ]

    @property
    def near_dist(self) -> float:
        return float(self._near_dist)
    
    @property
    def near_dist_unit(self) -> str:
        assert self._near_dist_unit
        return self._near_dist_unit

    @property
    def temp_dist(self) -> float:
        return float(self._temp_dist)

    @property
    def temp_dist_unit(self) -> str:
        assert self._temp_dist_unit
        return self._temp_dist_unit
    
    @property
    def min_time_cotraveling(self) -> str:
        value_unit = self._min_time_cotraveling.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._min_time_cotraveling)
        switched_min_time_cotraveling = f"{value} {value_unit}"
        return switched_min_time_cotraveling
    @min_time_cotraveling.setter
    def min_time_cotraveling(self, value: str) -> None:
        if type(value) is not str:
            raise TypeError
        else:
            self._min_time_cotraveling = value
    
    @error_handler(id_message=190391)
    def self_join_features(self, input_layer: SparkDataFrame, 
                                 id_field: str) -> SparkDataFrame:
        """Executes a self join of the input layer to identify cotravelers.  
        It leverages two instance variables, _search_distance and _time_difference.
        This is used to help filter the join into what the end user was looking for.

        Args:
            input_layer (SparkDataFrame): The input SparkDataFrame that was created from the input (source) feature class.
            id_field (str): The name of the field containing the track identifiers.

        Returns:
            SparkDataFrame: Output Spark DataFrame containing all of the features that were identified to match the time and space separation specified by the user.
        """
        if self.DEBUG: self.logger.debug(arcpy.GetIDMessage(190254))
        
        _join_condition = f"$join['{id_field}'] != $target['{id_field}']"

        self_join = self.spark.ga.tools.join_features(target_layer=input_layer, 
                                                    join_layer=input_layer,
                                                    join_operation="JoinOneToMany",
                                                    join_fields=None,
                                                    summary_fields=None,
                                                    spatial_relationship="NearGeodesic",
                                                    spatial_near_distance=self.near_dist,
                                                    spatial_near_distance_unit=self.near_dist_unit,
                                                    temporal_relationship="Near", 
                                                    temporal_near_distance=self.temp_dist,
                                                    temporal_near_distance_unit=self.temp_dist_unit,
                                                    join_condition=_join_condition, 
                                                    attribute_relationship=None)
        
        self_join.checkpoint()
        
        return self_join

    @error_handler(id_message=190391)
    def join_source_secondary_dataframe(self, input_layer: SparkDataFrame, 
                                              secondary_layer: SparkDataFrame, 
                                              input_field: str, 
                                              secondary_field: str) -> SparkDataFrame:
        """Executes a join between the input SparkDataFrame and the secondary SparkDataFrame. 
        This method only gets executed when TWO_FEATURECLASSES is selected as an input paramenter.

        Args:
            input_layer (SparkDataFrame): SparkDataFrame derived from the input feature class
            secondary_layer (SparkDataFrame): SparkDataFrame derived from the secondary feature class.
            input_field (str): Name of the track identification field in the input feature class.
            secondary_field (str): Name of the track identification field in the secondary feature class.

        Returns:
            SparkDataFrame: SparkDataFrame containing all of the features that match the spatial and time specifications selected by the user.
        """
        self.logger.debug(arcpy.GetIDMessage(190254))
    
        _join_condition = f"$join['{secondary_field}'] != $target['{input_field}']"

        _join = self.spark.ga.tools.join_features(target_layer=input_layer, 
                                                join_layer=secondary_layer,
                                                join_operation="JoinOneToMany",
                                                join_fields=None,
                                                summary_fields=None,
                                                spatial_relationship="NearGeodesic",
                                                spatial_near_distance=self.near_dist,
                                                spatial_near_distance_unit=self.near_dist_unit,
                                                temporal_relationship="Near", 
                                                temporal_near_distance=self.temp_dist,
                                                temporal_near_distance_unit=self.temp_dist_unit,
                                                join_condition=_join_condition, 
                                                attribute_relationship=None)
        
        _join.checkpoint()
        
        return _join

    @error_handler(id_message=190381)
    def  drop_fields_from_self_join(self, input_dataframe: SparkDataFrame, 
                                          name_field: str, 
                                          time_field: str) -> SparkDataFrame:
        """Drops unnecessary fields from the self join.  Renames necessary fields to
        standard output names.  

        Args:
            input_dataframe (SparkDataFrame): A SparkDataFrame that was generated by a self join. 
            name_field (str): The name of the track identifier field for the DataFrame.
            time_field (str): The name of the time field for the DataFrame.

        Returns:
            SparkDataFrame: Normalized dataframe.
        """
        
        if self.DEBUG: self.logger.debug(arcpy.GetIDMessage(190274))
                
        df = input_dataframe.withColumnRenamed(name_field, Movement.TRAV_ID.value) \
                            .withColumnRenamed("join_" + name_field, Movement.COTR_ID.value) \
                            .withColumnRenamed(time_field, Movement.TRAV_TIME.value) \
                            .withColumnRenamed("join_" + time_field, Movement.COTR_TIME.value) \
                            .withColumnRenamed(Movement.PX.value, Movement.X_TRAV.value) \
                            .withColumnRenamed(Movement.PY.value, Movement.Y_TRAV.value) \
                            .withColumnRenamed("join_" + Movement.PX.value, Movement.X_COTR.value) \
                            .withColumnRenamed("join_" + Movement.PY.value, Movement.Y_COTR.value)
       
        drop_fields = [f for f in df.columns if f not in self.keep_fields]
        drop_df = df.drop(*drop_fields)

        return drop_df

    @error_handler(id_message=190381)
    def drop_fields_from_multi_join(self, input_dataframe: SparkDataFrame, 
                                          name_field: str, 
                                          secondary_name_field: str, 
                                          time_field: str, 
                                          second_time_field: str) -> SparkDataFrame:
        """Drops unnecessary fields from the join between the input and secondary DataFrame.  Renames necessary fields to
        standard output names.

        Args:
            input_dataframe (SparkDataFrame): SparkDataFrame derived from the join_source_secondary_dataframe method.
            name_field (str): The field containing the track identifier from the input (source) features
            secondary_name_field (str): The field containing the track identifier form the secondary features.
            time_field (str): The time field from the source features.
            second_time_field (str): The time field from the secondary features.

        Returns:
            SparkDataFrame: Normalized DataFrame.
        """
        self.logger.debug(arcpy.GetIDMessage(190274))
        
        join_name_field = [f[0] for f in input_dataframe.dtypes if secondary_name_field in f[0] and f[0] != name_field][0]
        
        join_time_field = [f[0] for f in input_dataframe.dtypes if second_time_field in f[0] and f[0] != time_field and f[1] == 'timestamp'][0]
        
        df = input_dataframe.withColumnRenamed(name_field,Movement.TRAV_ID.value) \
                            .withColumnRenamed(join_name_field, Movement.COTR_ID.value) \
                            .withColumnRenamed(time_field, Movement.TRAV_TIME.value) \
                            .withColumnRenamed(join_time_field, Movement.COTR_TIME.value) \
                            .withColumnRenamed(Movement.PX.value, Movement.X_TRAV.value) \
                            .withColumnRenamed(Movement.PY.value, Movement.Y_TRAV.value) \
                            .withColumnRenamed("join_" + Movement.PX.value, Movement.X_COTR.value) \
                            .withColumnRenamed("join_" + Movement.PY.value, Movement.Y_COTR.value)     
        
        drop_fields = [f for f in df.columns if f not in self.keep_fields]
        drop_df = df.drop(*drop_fields)

        return drop_df

    @error_handler(id_message=190389)
    def calculate_time_difference(self, input_dataframe: SparkDataFrame, traveler_time_field: str, cotraveler_time_field: str) -> SparkDataFrame:
        """Adds a new field to the input DataFrame for the time difference between the cotraveler and traveler.
        This gets added to a new IntegerType field.
        Adds new field for distance difference and calculates values based on XY locations for traveler and cotraveler.
        
        Args:
            input_dataframe (SparkDataFrame): A normalized DataFrame, generally the output from the calculate_distance_difference method.
        Returns:
            SparkDataFrame: A new DataFrame that contains the time difference between cotraveler and traveler.
        """

        from pyspark.sql.types import LongType
        from pyspark.sql.functions import col

        out_df = input_dataframe.withColumn(Movement.TD.value, (col(traveler_time_field).cast(LongType()) - col(cotraveler_time_field).cast(LongType()))) \
                                .withColumn(Movement.DD.value, (((col(Movement.X_COTR.value) - col(Movement.X_TRAV.value)) ** 2) + 
                                                                ((col(Movement.Y_COTR.value) - col(Movement.Y_TRAV.value)) ** 2)) ** (1/2))

        return out_df
  
    @error_handler(id_message=190389)
    def calculate_unique_pair_id(self, input_dataframe: SparkDataFrame) -> SparkDataFrame:
        """Executes the calculate_unique_pair_id_udf method to create a new field containing the unique pair id for each row.

        Args:
            input_dataframe (SparkDataFrame): A normalize SparkDataFrame.  Typically the output from the calculate_time_difference method.

        Returns:
            SparkDataFrame: SparkDataFrame containing a column containing unique pair identifiers.
        """
        from pyspark.sql.functions import array, sort_array, concat_ws
        
        df = input_dataframe.withColumn("Unique_ID_Array", array([Movement.TRAV_ID.value, Movement.COTR_ID.value]))
        df1 = df.withColumn("Unique_ID_Array_Sorted", sort_array("Unique_ID_Array"))
        out_df = df1.withColumn(Movement.UI.value, concat_ws("_", "Unique_ID_Array_Sorted"))

        return out_df

    @error_handler(id_message=190381)
    def final_drop_fields(self, input_dataframe: SparkDataFrame) -> SparkDataFrame:
        drop_fields = [f for f in input_dataframe.columns if f not in self.keep_fields]
        if self.DEBUG:
            self.logger.debug(f"Final drop fields: {drop_fields}")
        
        drop_df = input_dataframe.drop(*drop_fields)

        return drop_df

    @error_handler(id_message=190392)
    def filter_by_track_duration(self, input_dataframe: SparkDataFrame) -> SparkDataFrame:
        from pyspark.sql.window import Window
        from pyspark.sql.functions import col, first, last, abs
        from pyspark.sql.types import LongType

        window: SparkWindow = Window.partitionBy("unique_pair_id", "traveler_id", "cotraveler_id")

        angular_to_linear: Dict[str, float] = {
            "Feet": 364567.2,
            "Yards":  (364567.2 * 0.333333),
            "Meters": (364567.2 * 0.3048), 
            "Miles": (364567.2 * 0.000189394), 
            "Kilometers": (364567.2 * 0.000189394),
            "Nautical Miles": (364567.2 * 0.000164579),
        }

        time_to_seconds: Dict[str, float] = {
            "Seconds": 1,
            "Minutes": 60,
            "Hours": 3600,
        }
        time_diff = float(self.min_time_cotraveling.split(" ")[0])
        time_unit = self.min_time_cotraveling.split(" ")[1]

        min_track_duration = int(time_diff * time_to_seconds[time_unit])
        
        df_dist = input_dataframe.withColumn("distance_diff_linear", col(Movement.DD.value) * angular_to_linear[self.near_dist_unit])

        df_analytics = df_dist.withColumn("first_time", first(col("traveler_time")).over(window))\
                            .withColumn("last_time", last(col("traveler_time")).over(window))

        df_analytics_2 = df_analytics.withColumn("track_duration", abs(col("last_time").cast(LongType()) - col("first_time").cast(LongType())))

        return df_analytics_2.where(abs(col("track_duration")) > min_track_duration)\
                            .drop(*["first_time", "last_time", "track_duration", "distance_diff_linear"])

    def _generate_empty_output(self) -> str:
        """Generates an empty version of the Cotravelers feature class to match the pattern when no features were identified as cotraveling.
        Returns:
            str: User defined output location for cotraveling features identification.
        """
        feature_workspace = os.path.dirname(self.output_point_features)
        feature_name = os.path.basename(self.output_point_features)

        arcpy.CreateFeatureclass_management(feature_workspace, feature_name, "POINT", None, "DISABLED", "DISABLED")

        fields = [[Movement.TRAV_ID.value, "TEXT", None, 255],
                  [Movement.COTR_ID.value, "TEXT", None, 255],
                  [Movement.X_TRAV.value, 'FLOAT', None],
                  [Movement.Y_TRAV.value, 'FLOAT', None],
                  [Movement.X_COTR.value, 'FLOAT', None],
                  [Movement.Y_COTR.value, 'FLOAT', None],
                  [Movement.TRAV_TIME.value, "DATE", None],
                  [Movement.COTR_TIME.value, "DATE", None],
                  [Movement.DD.value, 'FLOAT', None],
                  [Movement.TD.value, 'FLOAT', None]]
        
        arcpy.management.AddFields(self.output_point_features, fields)
        
        return self.output_point_features

    @error_handler(id_message=190393)
    def _make_summary_table(self, input_dataframe: SparkDataFrame, out_location: str) -> str:
        from pyspark.sql.window import Window
        from pyspark.sql.functions import col, max, min, mean, row_number,stddev, count 

        window = Window.partitionBy(Movement.UI.value, Movement.TRAV_ID.value, Movement.COTR_ID.value)
        window_time = Window.partitionBy(Movement.UI.value, Movement.TRAV_ID.value, Movement.COTR_ID.value).orderBy(Movement.TRAV_TIME.value)

        keep_fields = [
            Movement.UI.value, 
            Movement.TRAV_ID.value, 
            Movement.COTR_ID.value, 
            Movement.TD_MAX.value,
            Movement.TD_MIN.value,
            Movement.TD_MEAN.value, 
            Movement.TD_STD.value,
            Movement.DD_MAX.value, 
            Movement.DD_MIN.value,
            Movement.DD_MEAN.value,
            Movement.DD_STD.value,
            Movement.UI_CNT.value,
        ]

        df = input_dataframe.withColumn("row_number", row_number().over(window_time))\
                            .withColumn(Movement.TD_MAX.value, max(col(Movement.TD.value)).over(window))\
                            .withColumn(Movement.TD_MIN.value, min(col(Movement.TD.value)).over(window))\
                            .withColumn(Movement.TD_MEAN.value, mean(col(Movement.TD.value)).over(window))\
                            .withColumn(Movement.TD_STD.value, stddev(col(Movement.TD.value)).over(window))\
                            .withColumn(Movement.DD_MAX.value, max(col(Movement.DD.value)).over(window))\
                            .withColumn(Movement.DD_MIN.value, min(col(Movement.DD.value)).over(window))\
                            .withColumn(Movement.DD_MEAN.value, mean(col(Movement.DD.value)).over(window))\
                            .withColumn(Movement.DD_STD.value, stddev(col(Movement.DD.value)).over(window))\
                            .withColumn(Movement.UI_CNT.value, count(col(Movement.UI.value)).over(window))\
                            .where(col("row_number") == 1)\
                            .select(Movement.UI.value, 
                                    Movement.TRAV_ID.value, 
                                    Movement.COTR_ID.value, 
                                    Movement.TD_MAX.value,
                                    Movement.TD_MIN.value,
                                    Movement.TD_MEAN.value, 
                                    Movement.TD_STD.value,
                                    Movement.DD_MAX.value, 
                                    Movement.DD_MIN.value,
                                    Movement.DD_MEAN.value,
                                    Movement.DD_STD.value,
                                    Movement.UI_CNT.value)\
                            .orderBy(Movement.UI.value)\
                            .drop(*[f for f in input_dataframe.columns if f not in keep_fields])
        
        if arcpy.Describe(os.path.dirname(out_location)).workspaceType in ['LocalDatabase']: 
            df.write.layer(out_location)
        else:
            self.write_csv(input_dataframe=df, out_location=out_location)
        
        return out_location

    @general_error_logger
    def find_cotravelers(self) -> FindCotravelerResult:
        """Execution logic for find cotravelers.

        Returns:
            FindCotravelersResult: Data class containing results for Find Cotravelers.
        """
        try:

            # Initializes the spark connection.  Necessary for all follow on processing.
            self.initialize_spark()
            
            # Reads the _source_features input feature class into a Spark DataFrame.
            spark_input = self.read_layer(input_layer=self.source_features)

            if self.DEBUG: self.logger.debug(spark_input.columns)

            clean_df = self.drop_fields_on_load(input_dataframe=spark_input, 
                                                keep_fields=[
                                                    Movement.SHAPE.value,
                                                    Movement.TIME_START.value,
                                                    self.track_id,
                                                    self.time_field,
                                                    self.oid_field,
                                                    ])
            
            # Adds the XY data from the geometry column into two separate fields.  
            # This is used for calculating distance between the traveler and cotraveler after the various
            # joins have been completed.
            xy_df = add_track_xy_as_field(input_dataframe=clean_df, 
                                          track_id_field=self.track_id, 
                                          time_field=self.time_field)
            
            # Executes a self join on the input layer after the XY information has been added.
            first_join = self.self_join_features(input_layer=xy_df, id_field=self.track_id)
            
            # Drops unnecessary fields from the input dataframe.  This method also renames existing fields
            # that allows for unions of dataframes if multiple input features is selected.   
            dropped_df = self.drop_fields_from_self_join(input_dataframe=first_join, 
                                                        name_field=self.track_id,
                                                        time_field=self.time_field)
            
            # Checks if the user specified multiple inputs for identification of cotravelers.
            # If multiple inputs is selected, the tool will execute two self-joins of the input datasets
            # and one join between the two feature classes.  This allows for identification of cotravelers
            # inside of the individual datasets as well as cotravelers across multiple input feature classes.
            if self.input_type == Movement.TWO_FC.value:

                self.secondary_time_field = get_time_field_from_lyr(self.secondary_features)
                
                # Reads the second layer into a Spark DataFrame
                secondary_input = self.read_layer(input_layer=self.secondary_features)
                
                # Adds XY data from the geometry column into two separate fields.
                second_xy_df = add_track_xy_as_field(input_dataframe=secondary_input, 
                                                     track_id_field=self.secondary_id_field, 
                                                     time_field=self.secondary_time_field)
                
                # Executes a self-join on the secondary input feature class
                second_join = self.self_join_features(input_layer=second_xy_df, id_field=self.secondary_id_field)
                
                # Drops unnecessary fields from the second self-join.  Renames fields to allow for
                # the various Spark DataFrames to be unioned.
                second_dropped = self.drop_fields_from_self_join(input_dataframe=second_join, 
                                                                 name_field=self.secondary_id_field, 
                                                                 time_field=self.secondary_time_field)

                # Executes a join between the first and second input feature classes.
                multi_join = self.join_source_secondary_dataframe(input_layer=xy_df, 
                                                                  secondary_layer=second_xy_df, 
                                                                  input_field=self.track_id, 
                                                                  secondary_field=self.secondary_id_field)

                # Drops unnecessary fields from the join between the first and second input features.
                # Renames remaining fields to enable the necessary unions to occur.
                multi_dropped = self.drop_fields_from_multi_join(input_dataframe=multi_join, 
                                                                 name_field=self.track_id, 
                                                                 secondary_name_field=self.secondary_id_field,
                                                                 time_field=self.time_field,
                                                                 second_time_field=self.secondary_time_field)
                
                self.logger.debug(arcpy.GetIDMessage(190277))

                final_union = self.merge_dataframes([dropped_df, second_dropped, multi_dropped])
                
                self.logger.debug(arcpy.GetIDMessage(190258))
                time_df = self.calculate_time_difference(final_union, 
                                                        traveler_time_field=Movement.TRAV_TIME.value, 
                                                        cotraveler_time_field=Movement.COTR_TIME.value)
                
                self.logger.debug(arcpy.GetIDMessage(190275))
                unique_id_df = self.calculate_unique_pair_id(time_df)
                
                final_drop_df = self.final_drop_fields(input_dataframe=unique_id_df)

            else:
                
                self.logger.debug(arcpy.GetIDMessage(190258))

                time_df = self.calculate_time_difference(dropped_df.select(sorted(dropped_df.columns)), 
                                                        traveler_time_field=Movement.TRAV_TIME.value, 
                                                        cotraveler_time_field=Movement.COTR_TIME.value)
                
                self.logger.debug(arcpy.GetIDMessage(190275))
                unique_id_df = self.calculate_unique_pair_id(time_df)

                final_drop_df = self.final_drop_fields(input_dataframe=unique_id_df)

            final_count =final_drop_df.count()
            
            self.logger.debug(arcpy.GetIDMessage(190276))
            if self._include_min_time_cotraveling == 'true' or self._include_min_time_cotraveling == "MIN_COTRAVELING_DURATION":
                filtered_df = self.filter_by_track_duration(final_drop_df)
                
                filtered_df.write.layer(self.output_point_features)

                final_count = filtered_df.count()
            
            else:
                final_drop_df.write.layer(self.output_point_features)
                filtered_df = final_drop_df

            if final_count > 0:
                
                if self.create_summary_table == 'true' or self.create_summary_table == Movement.CREATE_SUMMARY_TABLE.value:
                    self.logger.debug(arcpy.GetIDMessage(190278))
                    summary_table = self._make_summary_table(input_dataframe=final_drop_df, 
                                                             out_location=self.out_summary_table)

                else:
                    summary_table = None

                self.logger.debug(arcpy.GetIDMessage(190257))
                if final_count > 5:
                    time_difference_list = list(filtered_df.select(Movement.TD.value).toPandas()[Movement.TD.value])
                    style = apply_cotravelers_symbology(time_difference_list=time_difference_list)

                result = FindCotravelerResult(features=self.output_point_features,
                                                apply_style=True,
                                                style=json.dumps(style),
                                                summary_table=summary_table)
                
                return result


            else:
                self.logger.warning(arcpy.GetIDMessage(117))
                result = FindCotravelerResult(features=self.output_point_features,
                                              apply_style=False,
                                              style=None,
                                              summary_table=None)
                
                
                return result
        except InvalidPortalTokenError:
            self.logger.error(arcpy.GetIDMessage(190297))
            exit()
