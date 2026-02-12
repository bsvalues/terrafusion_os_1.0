from __future__ import annotations

import arcpy

from typing import TypeVar

from ga_spark.extensions import _accessors
from ga_spark.sql import functions as ST

from intel.types import PandasDataFrame, SparkDataFrame, Column
from intel.movement.accessors.TrackBaseClass import TrackBaseClass
from intel.movement.utils import get_objectid_field, get_time_field_from_lyr
from intel.enumerations import Movement

@_accessors.register_dataframe_accessor('mv')
class TrackDataFrame:
    def __init__(self, df: SparkDataFrame):
        from pyspark.sql import SparkSession
        self._df = df
        self.tdf = TrackBaseClass()
        self.tdf.spark = self._df.sparkSession
    
    def to_pandas_sdf(self, geometry_field: Column | None = None) -> PandasDataFrame:
        """Converts the current Spark DataFrame into a Pandas Spatially Enabled DataFrame.  

        Args:
            geometry_field (Column, optional): Field to set as geometry on spatial dataframe. 
                                               If not specified, the first valid geometry 
                                               field seen will be used. Defaults to None.

        Returns:
            PandasDataFrame: A Spatially Enabeld Pandas DataFrame (SeDF) with the geometry and attributes
                             of the source Spark DataFrame.
        """

        from arcgis.features import GeoAccessor, GeoSeriesAccessor
        
        df = self._df.drop(*[
            Movement.PREV_GEO.value,
            Movement.NEXT_GEO.value,
            Movement.PREV_TIME.value,
            Movement.FWD_TIME.value,
        ])
        
        if not geometry_field:
            candidates = [field.name for field in self._df.schema.fields if field.dataType.simpleString() in ["geometry", "point", "linestring", "polygon", "multipoint"]]
            geometry_field = candidates[0]
        sdf = df.withColumn("__shape_import__", ST.as_esri_json(geometry_field)).drop(geometry_field).toPandas() 
        
        sdf[geometry_field] = sdf.__shape_import__.apply(lambda x: arcpy.AsShape(x, True))
        sdf.spatial.set_geometry(geometry_field)
        sdf: PandasDataFrame = sdf.drop(columns=["__shape_import__"])
        return sdf

    def add_track_fields(self, source_layer: str, 
                               track_id_field: str, 
                               output_distance_units: str | None = None) -> SparkDataFrame:
        """Takes an input Spark DataFrame, with necessary source layer information and
           the field to be used as the track identifier and adds fields to enable track
           calculations.  The fields that will be added include the previous and next geometry
           objects of the current point in the track, speed, distance difference between the previous 
           point in the track, and the time difference between the current point and the previous point.

        Args:
            source_layer (str): The source feature layer that was used to create the Spark DataFrame. The source
                                feature layer is needed to derive the time field that was used to create the DataFrame,
                                the Object ID field, and a few other components necessary to calculate track metrics.
            track_id_field (str): The field that will be used to organize the data into tracks.
            output_distance_units (str, optional): The output units that will be used as a default for calculations. 
                                                   The parameter only accepts Feet, Meters, Miles, Nautical Miles, 
                                                   Kilometers, and None. Defaults to None.

        Raises:
            AttributeError: Output unit type not supported.  Only Feet, Meters, Kilometers, Miles, Nautical Miles are supported.
            Warning: Conversion of output distance units is only supported on a dataframe with a geographic projection.

        Returns:
            Spark DataFrame: A Spark DataFrame with the necessary fields needed to calculate various track metrics.
        """
        
        self.tdf.input_dataframe = self._df
        
        self.tdf.id_field = track_id_field

        self.tdf.time_field = get_time_field_from_lyr(source_layer)
        self.tdf.oid_field = get_objectid_field(source_layer)
        
        sr_type: str = arcpy.Describe(source_layer).spatialReference.type

        if output_distance_units not in ["Feet", "Meters", "Miles", "Nautical Miles", "Kilometers", None]:
            raise AttributeError("Output unit type not supported.  Only Feet, Meters, Kilometers, Miles, Nautical Miles are supported.")
        
        if output_distance_units and sr_type == 'Geographic':
            self.tdf.convert_linear_unit = True
            self.tdf.dist_unit = output_distance_units
        elif output_distance_units and sr_type != 'Geographic':
            self.tdf.convert_linear_unit = False
            raise Warning("Conversion of output distance units is only supported on a dataframe with a geographic projection.")
        else:
            self.tdf.convert_linear_unit = False
        
        return self.tdf.add_track_field()

    def partition_tracks(self, time_split: str, distance_difference: str) -> SparkDataFrame:
        """Takes the output of the add_track_fields and partitions the track DataFrame 
           based on the time_split and distance_difference parameters.  This operation
           then assigns a unique track identifier to each partitioned track.

        Args:
            time_split (str): The amount of time between two points in a track that will cause the 
                              track to be split.  Values less than this parameter value will be 
                              considered part of the same track, values greater will be split into a 
                              separate track.  
            distance_difference (str): The distance between two points in a track that will cause the 
                              track to be split.  Values less than this parameter value will be 
                              considered part of the same track, values greater will be split into a 
                              separate track.

        Raises:
            AttributeError: DataFrame is not a track dataframe.  Run df.mv.add_track_fields prior to partitioning tracks.

        Returns:
            Spark DataFrame: A Spark DataFrame partitioned according to the time_split and distance_difference with a new field
                            added for the unique track identifier.
        """
        self.tdf.dataframe = self._df
        
        if Movement.TRACK_ID.value not in self._df.columns:
            raise AttributeError("DataFrame is not a track dataframe.  Run df.mv.add_track_fields prior to partitioning tracks.")
        
        self.tdf.id_field = Movement.TRACK_ID.value
        
        return self.tdf.partition_tracks(time_difference=time_split, 
                                         distance_difference=distance_difference)

    def calculate_speed(self, linear_unit: str | None = None) -> SparkDataFrame:
        """Calculates the speed of the Movement Events in both Miles/Hour (MPH) and Kilometers/Hour (KMPH).
        The formula used to calculate the speed was:
                Velocity = Distance / Time
        For the distance, the value used was the distance differnce calculated by the calculate_distance_difference method.
        For the time, the value used was the time difference calculated by the calculate_time_difference method.

        Args:
            linear_unit (str, optional): The linear unit used in the Projected Coordinate System. This parameter only accepts
            Meter, Foot, or None as an input. Defaults to None.

        Raises:
            AttributeError: DataFrame is not a track dataframe.  Run df.mv.add_track_fields prior to calculating speed.
            ValueError: Linear unit must be either Meter or Foot.

        Returns:
            Spark DataFrame: A new Spark DataFrame that contains the speed columns for Miles/Hour and Kilometers/Hour.
        """

        if Movement.TD.value not in self._df.columns or Movement.DD.value not in self._df.columns:
            raise AttributeError("DataFrame is not a track dataframe.  Run df.mv.add_track_fields prior to calculating speed.")
        if linear_unit not in ['Meter', 'Foot']:
            raise ValueError("Linear unit must be either Meter or Foot.")
        
        if Movement.TRACK_ID.value not in self._df.columns:
            raise AttributeError("DataFrame is not a track dataframe.  Run df.mv.add_track_fields prior to partitioning tracks.")
        
        self.tdf.id_field = Movement.TRACK_ID.value
        
        self.tdf.dataframe = self._df

        return self.tdf.calculate_speed(linear_unit=linear_unit)

    def calculate_bearing(self) -> SparkDataFrame:
        """Calculates the bearing in the input dataframe. The tool adds the "from_bearing"
        and "to_bearing" fields to the output.  The method used to calculate bearing was obtained
        from the following website:
            https://www.analytics-link.com/post/2018/08/21/calculating-the-compass-direction-between-two-points-in-python

        Raises:
            AttributeError: DataFrame is not a track dataframe.  Run df.mv.add_track_fields prior to calculating bearing.

        Returns:
            SparkDataFrame: A Spark DataFrame that will have the to bearing and from bearing calculated.
        """

        if Movement.PREV_GEO.value not in self._df.columns or Movement.NEXT_GEO.value not in self._df.columns:
            raise AttributeError("DataFrame is not a track dataframe.  Run df.mv.add_track_fields prior to calculating bearing.")

        self.tdf.dataframe = self._df
        return self.tdf.calculate_bearing()

    def find_acceleration_deceleration(self) -> SparkDataFrame:
        """Identifies periods of acceleration and deceleration.  Annotates when 
           those events start, end, stop, and travel.  

        Raises:
            AttributeError: Speed column not present in DataFrame. Ensure you run df.mv.calculate_speed prior to running this method.

        Returns:
            Spark DataFrame: a new Spark DataFrame that contains the Brake Event column.  
        """
        if "Speed" not in self._df.columns:
            raise AttributeError("Speed column not present in DataFrame. Ensure you run df.mv.calculate_speed prior to running this method.")
        
        self.tdf.dataframe = self._df
        self.tdf.id_field = Movement.TRACK_ID.value
        self.tdf.time_field = Movement.TIME_START.value
        return self.tdf.find_acceleration_deceleration()

    def calculate_turn_events(self, minimum_curvature: float = 15, records_window: int = 1) -> SparkDataFrame:
        """Takes an input Spark DataFrame that is the output of the find_accleration_deceleration method
        and identifies any possible locations where the track is conducting a turn event.  The method used
        to calculate the turn events is based off of a bearing differential between the current point and
        the previous point in the track and the current point and the next point in the track.  

        Args:
            minimum_curvature (float, optional): The minimum bearing differential needed to be classified 
                                                 as a turn event. Defaults to 15.
            records_window (int, optional): The number of points before and after the current point to 
                                            evaluate if a turn event is occurring. Defaults to 1.

        Raises:
            AttributeError: DataFrame is not a track dataframe.  Run df.mv.add_track_fields prior to calculating turn events.
            AttributeError: acc_event Column not present in DataFrame.  Ensure you run df.mv.find_acceleration_deceleration prior to calculating turn events.

        Returns:
            Spark DataFrame: A Spark DataFrame with a new column added for turn events.
        """
        if records_window == 1 and (Movement.PREV_GEO.value not in self._df.columns or Movement.NEXT_GEO.value not in self._df.columns):
            raise AttributeError("DataFrame is not a track dataframe.  Run df.mv.add_track_fields prior to calculating turn events.")
        if Movement.BE.value not in self._df.columns:
            raise AttributeError("acc_event Column not present in DataFrame.  Ensure you run df.mv.find_acceleration_deceleration prior to calculating turn events.")
        
        self.tdf.dataframe = self._df
        self.tdf.id_field = Movement.TRACK_ID.value
        self.tdf.time_field = Movement.TIME_START.value
        return self.tdf.calculate_direction(minimum_curvature=minimum_curvature, records_window=records_window)