'''
------------------------------------------------------------------------------
FindMeetingLocations.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.8, Python 3.7
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2020-03-02 - jjones - original writeup
* 2020-05-01 - jjones - updated default output symbology for Find Cotravelers and Find Meeting Locations
* 2020-09-14 - jjones - split Find Meeting Locations into separate file
* 2020-12-03 - jjones - renamed file to match class name
* 2021-02-01 - jjones - added __repr__, __str__, and __del__methods
------------------------------------------------------------------------------
'''
from __future__ import annotations
import arcpy
import json
import numpy as np
import os

from typing import Tuple, List, Dict

from intel.movement.MovementBaseClass import BaseMovementClass
from intel.movement.utils import empty_output
from intel.enumerations import Movement, FindMeetingLocationsEnum
from intel.data_classes.Movement import FindMeetingLocationResult
from intel.utilities import create_temp_table_name, Logger, DEBUG, LocaleValidate
from intel.movement.styles.FindMeetingLocationsStyle import area_style, point_style
from intel.types import SparkDataFrame, SparkWindow
from intel.errors import InvalidPortalTokenError

class MeetingLocations(BaseMovementClass):

    def __init__(self, 
                input_features: str, 
                output_area_features: str, 
                output_point_features: str, 
                in_unique_id: str, 
                search_distance: str = '100 Meters', 
                time_difference: str = '10 Minutes',
                temporal_relationship: str = Movement.OVERLAPS.value,
                min_meeting_duration: str | None = None,
                max_meeting_duration: str | None = None):

        super().__init__()
        
        self._loc = LocaleValidate()

        self._input_features: str = input_features
        self._output_area_features: str = output_area_features
        self._output_point_features: str = output_point_features
        self._in_unique_id: str = in_unique_id
        self._search_distance: str = search_distance
        self._time_difference: str = time_difference
        self._delete_features: List[str] = []
        self._temporal_relationship: str = temporal_relationship
        self._min_meeting_duration: str | None = min_meeting_duration
        self._max_meeting_duration: str | None = max_meeting_duration

        self._meeting_duration_array: np.ndarray
        self._meeting_count_array: np.ndarray

        self.DEBUG = DEBUG
        self.logger = Logger()
        self.logger.create_logger(self.__class__.__name__)
        
        if self.DEBUG:
            self.logger.debug(f"Loggers: {self.logger.loggers}")
            self.logger.debug(f"Active handlers: {self.logger.active_handlers}")

    def __repr__(self) -> str:
        return f"FindMeetingLocations<input features: {self.input_features}, \n\
                                      output area features: {self.output_area_features}, \n\
                                      output point features: {self.output_point_features}, \n\
                                      unique identifier: {self.unique_id}, \n\
                                      search distance: {self.search_distance}, \n\
                                      time difference: {self.time_difference}>"

    def __str__(self) -> str:
        return self.__repr__()

    def __del__(self) -> None:
        for item in self._delete_features:
            if arcpy.Exists(item):
                arcpy.Delete_management(item)

    @property
    def input_features(self):
        return self._input_features
    @input_features.setter
    def input_features(self, value: str) -> None:
        self._input_features = value
    
    @property
    def output_area_features(self):
        return self._output_area_features
    @output_area_features.setter
    def output_area_features(self, value: str) -> None:
        self._output_area_features = value
    
    @property
    def output_point_features(self):
        return self._output_point_features
    @output_point_features.setter
    def output_point_features(self, value: str) -> None:
        self._output_point_features = value
    
    @property
    def unique_id(self):
        return self._in_unique_id
    @unique_id.setter
    def unique_id(self, value: str) -> None:
        self._in_unique_id = value
    
    @property
    def search_distance(self):
        value_unit = self._search_distance.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._search_distance)
        switched_distance = f"{value} {value_unit}"
        return switched_distance
    @search_distance.setter
    def search_distance(self, value: str) -> None:
        self._search_distance = value
    
    @property
    def time_difference(self):
        value_unit = self._time_difference.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._time_difference)
        switched_time = f"{value} {value_unit}"
        return switched_time
    @time_difference.setter
    def time_difference(self, value: str) -> None:
        self._time_difference = value

    @property
    def delete_features(self):
        return self._delete_features
    @delete_features.setter
    def delete_features(self, value: List[str]):
        self._delete_features = value

    @property
    def temporal_relationship(self) -> str:
        relationships = {
            Movement.OVERLAPS.value: "Overlaps",
            Movement.INTERSECTS.value: "Intersects"
        }
        
        return relationships[self._temporal_relationship]

    @property
    def min_meeting_duration(self) -> str | None:
        if self._min_meeting_duration is None:
            return None
        value_unit = self._min_meeting_duration.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._min_meeting_duration)
        switched_min_duration = f"{value} {value_unit}"
        return switched_min_duration
    @property
    def max_meeting_duration(self) -> str | None:
        if self._max_meeting_duration is None:
            return None
        value_unit = self._max_meeting_duration.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._max_meeting_duration)
        switched_max_duration = f"{value} {value_unit}"
        return switched_max_duration

    @property
    def meeting_duration_array(self) -> np.ndarray:
        return self._meeting_duration_array
    @meeting_duration_array.setter
    def meeting_duration_array(self, value: np.ndarray) -> None:
        self._meeting_duration_array = value

    @property
    def meeting_count_array(self) -> np.ndarray:
        return self._meeting_count_array
    @meeting_count_array.setter
    def meeting_count_array(self, value: np.ndarray) -> None:
        self._meeting_count_array = value
    
    def _create_output_features(self) -> Tuple[str, str]:
        """Modifies the output point and area features to get these features in their final state.
        Adds two new fields to the output point features, a meeting identifier that is unique to each 
        individual meeting and a meeting area identifier that is derived from the output areas feature class
        and attached via the Join Attributes From Polygon geoprocessing tool. 

        Validates that the output point and area features exist prior to executing code, if not raises an
        AssertionError.

        This method also populates the self._meeting_duration_array and self._meeting_count_array, both of which
        are used to help define output symbology in the _set_output_style method.

        The tool sets output field names for the output area feature class.  Sets them to a standard name and 
        gives them a field alias.

        Returns:
            Tuple[str, str]: Returns a tuple containing the fully qualified path to the output point and area 
            feature classes.
        """
        try:

            assert arcpy.Exists(self.output_area_features), arcpy.GetIDMessage(190295)
            assert arcpy.Exists(self.output_point_features), arcpy.GetIDMessage(190296)

            # Drops orig_fid from output points layer
            arcpy.DeleteField_management(self.output_point_features, drop_field='orig_fid')

            # Appends meeting area id to the output point feature class.
            arcpy.ca.JoinAttributesFromPolygon(self.output_point_features, self.output_area_features, ['meeting_area_id'])
            
            return self.output_point_features, self.output_area_features
        except Exception as e:
            self.logger.error(arcpy.GetIDMessage(190383))
            if self.DEBUG:
                import sys
                import traceback
                
                tb = sys.exc_info()[2]
                tbinfo = traceback.format_tb(tb)[0]
                pymsg = '{}\n{}\n{}'.format(tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
                
                self.logger.error(e.__class__.__name__)
                self.logger.error(pymsg)
            exit()

    def _generate_empty_output(self) -> Tuple[str, str]:
        """In the event that no meetings are identified, method generates output
        feature classes with the correct schema.  

        Returns:
            Tuple[str, str]: [description]
        """

        area_feature_workspace = os.path.dirname(self.output_area_features)
        area_feature_name = os.path.basename(self.output_area_features)

        point_feature_workspace = os.path.dirname(self.output_point_features)
        point_feature_name = os.path.basename(self.output_point_features)

        output_area_features = arcpy.CreateFeatureclass_management(area_feature_workspace, 
                                                                   area_feature_name, 
                                                                   "POLYGON", 
                                                                   None, 
                                                                   "DISABLED", 
                                                                   "DISABLED")
        
        
        output_point_features = arcpy.CreateFeatureclass_management(point_feature_workspace, 
                                                                    point_feature_name, 
                                                                    "POINT", 
                                                                    None, 
                                                                    "DISABLED", 
                                                                    "DISABLED")

        area_fields = [
            [FindMeetingLocationsEnum.TUID.value, "LONG", FindMeetingLocationsEnum.TUID_ALIAS.value],
            [FindMeetingLocationsEnum.TM.value, "LONG", FindMeetingLocationsEnum.TM_ALIAS.value],
            [FindMeetingLocationsEnum.MN_MD.value, "LONG", FindMeetingLocationsEnum.MN_MD_ALIAS.value],
            [FindMeetingLocationsEnum.MIN_MD.value, "LONG", FindMeetingLocationsEnum.MIN_MD_ALIAS.value],
            [FindMeetingLocationsEnum.MAX_MD.value, "LONG", FindMeetingLocationsEnum.MAX_MD_ALIAS.value],
            [FindMeetingLocationsEnum.FSD.value, "DATE", FindMeetingLocationsEnum.FSD_ALIAS.value],
            [FindMeetingLocationsEnum.LSD.value, "DATE", FindMeetingLocationsEnum.LSD_ALIAS.value],
            ['meeting_area_id', "TEXT", 'Meeting Area Identifier', 255],
        ]

        point_fields = [
            [FindMeetingLocationsEnum.P1.value, "TEXT", FindMeetingLocationsEnum.P1_ALIAS.value, 255],
            [FindMeetingLocationsEnum.P2.value, "TEXT", FindMeetingLocationsEnum.P2_ALIAS.value, 255],
            [FindMeetingLocationsEnum.MS.value, "DATE", FindMeetingLocationsEnum.MS_ALIAS.value],
            [FindMeetingLocationsEnum.ME.value, "DATE", FindMeetingLocationsEnum.ME_ALIAS.value],
            [FindMeetingLocationsEnum.MD.value, "LONG", FindMeetingLocationsEnum.MD_ALIAS.value],
            ['meeting_area_id', "TEXT", 'Meeting Area Identifier', 255],
            ['meeting_id', "TEXT", 'Meeting Identifier', 255],
        ]
        
        arcpy.management.AddFields(output_area_features, area_fields)
        arcpy.management.AddFields(output_point_features, point_fields)
        
        return output_point_features, output_area_features

    def convert_duration_to_seconds(self, value: float, unit: str) -> int:
        """Converts the input value and unit into an integer representing the time
        in seconds.  This is used by the apply_meeting_duration_filter method on the
        meeting_duration field which is in seconds.  This allows the user to select 
        a time unit that is more understandable (minutes or hours) to be used as the input
        parameter.

        Args:
            value (float): The amount of time that will need to be converted.
            unit (str): The unit of time for the value, used to find the conversion factor to seconds

        Returns:
            int: The value in seconds of the input value and unit
        """
        
        assert unit in ["Seconds", "Minutes", "Hours"], self.logger.error(arcpy.GetIDMessage(190389))

        time_to_seconds: Dict[str, float] = {
                "Seconds": 1,
                "Minutes": 60,
                "Hours": 3600,
            }

        return int(value * time_to_seconds[unit])

    def apply_meeting_duration_filter(self, dataframe: SparkDataFrame) -> SparkDataFrame:
        """Filters the input dataframe based on the max_meeting_duration and/or min_meeting_duration
        properties.  If either value is set to None, only one filter will be applied.

        Args:
            dataframe (SparkDataFrame): The dataframe that will be filtered.

        Returns:
            SparkDataFrame: A dataframe that has been filtered to meet the min_meeting_duration and
            max_meeting_duration parameters.
        """
        
        from pyspark.sql.functions import col
        assert FindMeetingLocationsEnum.MD.value in dataframe.columns, self.logger.error(arcpy.GetIDMessage(190392))

        if self.DEBUG:
            self.logger.debug(f"Dataframe columns:  {dataframe.columns}")
            
        if self.min_meeting_duration and self.max_meeting_duration:
            max_value, max_unit = self.max_meeting_duration.split(" ")
            min_value, min_unit = self.min_meeting_duration.split(" ")
            min_seconds = self.convert_duration_to_seconds(float(min_value), min_unit)
            max_seconds = self.convert_duration_to_seconds(float(max_value), max_unit)

            if self.DEBUG:
                self.logger.debug(f"Min seconds: {str(min_seconds)}")
                self.logger.debug(f"Max seconds: {str(max_seconds)}")

            return dataframe.filter((col('meeting_duration') > min_seconds)
                                  & (col('meeting_duration') < max_seconds))
        elif self.min_meeting_duration and not self.max_meeting_duration:
            min_value, min_unit = self.min_meeting_duration.split(" ")
            min_seconds = self.convert_duration_to_seconds(float(min_value), min_unit)

            if self.DEBUG:
                self.logger.debug(f"Min seconds: {str(min_seconds)}")

            return dataframe.filter(col('meeting_duration') > min_seconds)
        
        elif self.max_meeting_duration and not self.min_meeting_duration:
            max_value, max_unit = self.max_meeting_duration.split(" ")
            max_seconds = self.convert_duration_to_seconds(float(max_value), max_unit)

            if self.DEBUG:
                self.logger.debug(f"Max seconds: {str(max_seconds)}")

            return dataframe.filter(col('meeting_duration') < max_seconds)
        
        else:
            return dataframe

    def join_features(self, dataframe: SparkDataFrame) -> SparkDataFrame:
        from pyspark.sql.functions import col, row_number, max, min, mean
        from pyspark.sql.types import LongType
        
        _join_condition = f"$join['{self.unique_id}'] != $target['{self.unique_id}']"

        self.logger.debug(arcpy.GetIDMessage(190264))

        join = self.spark.ga.tools.join_features(target_layer=dataframe, 
                                                    join_layer=dataframe,
                                                    join_operation="JoinOneToMany",
                                                    join_fields=None,
                                                    summary_fields=None,
                                                    spatial_relationship="Intersects",
                                                    spatial_near_distance=None,
                                                    spatial_near_distance_unit=None,
                                                    temporal_relationship=self.temporal_relationship, 
                                                    temporal_near_distance=None,
                                                    temporal_near_distance_unit=None,
                                                    join_condition=_join_condition, 
                                                    attribute_relationship=None)

        join.checkpoint()

        if self.DEBUG:
            self.logger.debug(f"Total features in join: {str(join.count())}")

        df = join.withColumn("meeting_duration", col(Movement.TIME_END.value).cast(LongType()) - col(Movement.TIME_START.value).cast(LongType()))\
                        .withColumn('MEETING_START', col(Movement.TIME_START.value))\
                        .withColumn('MEETING_END', col(Movement.TIME_END.value))\
                        .withColumnRenamed(self.unique_id, 'participant_1')\
                        .withColumnRenamed('join_' + self.unique_id, 'participant_2')\
                        .select('meeting_duration', 
                                'MEETING_END', 
                                'MEETING_START', 
                                'participant_1', 
                                'participant_2',
                                Movement.SHAPE.value,)

        if self.DEBUG:
            self.logger.debug(f"Total features in join_df: {str(df.count())}")

        return df

    def find_dwell_locations(self, dataframe: SparkDataFrame) -> SparkDataFrame:
        self.logger.debug(arcpy.GetIDMessage(190259))

        distance = self.search_distance.split(" ")

        distance_value = float(distance[0])
        distance_unit = distance[1]

        _time = self.time_difference.split(" ")

        time_value = float(_time[0])
        time_unit = _time[1]

        # summary stats to empty array
        dwells = self.spark.ga.tools.find_dwell_locations(dataframe, 
                                                          track_fields=[self.unique_id], 
                                                          distance_tolerance=distance_value, 
                                                          distance_tolerance_unit=distance_unit, 
                                                          time_tolerance=time_value, 
                                                          time_tolerance_unit=time_unit, 
                                                          output_type='DwellConvexHulls')

        dwells.cache()

        keep_fields = [
            self.unique_id,
            'DwellID',
            Movement.SHAPE.value,
            Movement.TIME_START.value,
            Movement.TIME_END.value,
        ]

        return dwells.drop(*[f for f in dwells.columns if f not in keep_fields])

    def find(self) -> FindMeetingLocationResult:
        """Executes the logic to identify meeting locations.

        Returns:
            [FindMeetingLocationsResult] -- Dataclass containing the fully qualified path to point and area features and associated styles.
        """
        try:

            if self.DEBUG:
                self.logger.debug(msg="Inside of Find Meeting Locations")
                self.logger.debug(msg=f"Logger Class: {repr(self.logger)}")
                self.logger.debug(msg=f"Logger class location: {self.logger.get_class_address()}")
                self.logger.debug(f"input features: {self.input_features}")
                self.logger.debug(f"output area features: {self.output_area_features}")
                self.logger.debug(f"output point features: {self.output_point_features}")
                self.logger.debug(f"unique identifier: {self.unique_id}")
                self.logger.debug(f"search distance: {self.search_distance}")
                self.logger.debug(f"time difference: {self.time_difference}")
                self.logger.debug(f"time relationship: {self.temporal_relationship}")
                self.logger.debug(f"min meeting duration: {self._min_meeting_duration}")
                self.logger.debug(f"max meeting duration: {self._max_meeting_duration}")
            
            self.initialize_spark()

            df = self.read_layer(self.input_features)

            time_df = self.validate_time_enablement(input_dataframe=df)

            from pyspark.sql.functions import col, row_number, max, min, mean, monotonically_increasing_id
            from pyspark.sql.window import Window
            from ga_spark.sql import functions as ST

            dwells_df = self.find_dwell_locations(time_df)

            join_df = self.join_features(dataframe=dwells_df)
            
            filtered_df = self.apply_meeting_duration_filter(join_df)

            if self.DEBUG:
                self.logger.debug(f"Total features in filtered_df: {str(filtered_df.count())}")

            meeting_locs_temp = create_temp_table_name(arcpy.env.scratchGDB)
            self.delete_features.append(meeting_locs_temp)

            out_join = filtered_df.drop(*[
                Movement.TIME_START.value, 
                Movement.TIME_END.value,
                Movement.DATE_START.value,
                Movement.DATE_END.value,
                ])\
                    .withColumn(FindMeetingLocationsEnum.MID.value, monotonically_increasing_id())\
                    .withColumnRenamed('MEETING_END', FindMeetingLocationsEnum.ME.value)\
                    .withColumnRenamed("MEETING_START", FindMeetingLocationsEnum.MS.value)\
                    .withColumnRenamed('participant_1', FindMeetingLocationsEnum.P1.value)\
                    .withColumnRenamed('participant_2', FindMeetingLocationsEnum.P2.value)\
                    .withColumnRenamed('meeting_duration', FindMeetingLocationsEnum.MD.value)
            
            
            out_join.write.layer(meeting_locs_temp)

            if empty_output(meeting_locs_temp):
                self.output_point_features, self.output_area_features = self._generate_empty_output()
                
                self.logger.warning(arcpy.GetIDMessage(117))
                
                result = FindMeetingLocationResult(point_features=self.output_point_features,
                                                    area_features=self.output_area_features,
                                                    empty_output=True,
                                                    point_style=None,
                                                    area_style=None)

                return result

            try:
                arcpy.DeleteField_management(meeting_locs_temp, 
                                            [
                                                Movement.TIME_START.value, 
                                                Movement.TIME_END.value, 
                                                Movement.DATE_START.value,
                                                Movement.DATE_END.value,
                                                ])
            except Exception:
                pass 

            arcpy.management.FeatureToPoint(meeting_locs_temp, 
                                            self.output_point_features, 
                                            "INSIDE")

            dissolved_dwells = self.spark.ga.tools.dissolve_boundaries(dwells_df, dissolve_fields=[self.unique_id], multipart=True)
            dissolved_areas = self.spark.ga.tools.dissolve_boundaries(filtered_df, dissolve_fields=[], multipart=False)
                                                 

            dissolved_dwells.cache()
            dissolved_areas.cache()

            dd_select = dissolved_dwells.select(Movement.SHAPE.value, self.unique_id)\
                                        .withColumnRenamed(Movement.SHAPE.value, Movement.SHAPE_JOIN.value)
            da_select = dissolved_areas.select(Movement.SHAPE.value, "MEAN_meeting_duration")

            window: SparkWindow = Window.orderBy(col("MEAN_meeting_duration"))

            join_row = da_select.withColumn("row", row_number().over(window))\
                                .select(Movement.SHAPE.value, 'row')

            meetings_unique_users = join_row.join(dd_select, ST.intersects(join_row[Movement.SHAPE.value], 
                                                                           dd_select[Movement.SHAPE_JOIN.value]))

            meetings_unique_users.checkpoint()

            window_count: SparkWindow = Window.partitionBy('row').orderBy(col(self.unique_id))
            window_max: SparkWindow = Window.partitionBy('row')

            meetings = meetings_unique_users.withColumn("window_row", row_number().over(window_count))\
                                            .withColumn(FindMeetingLocationsEnum.TUID.value, max(col('window_row')).over(window_max))\
                                            .select(Movement.SHAPE.value, 'row', 'window_row')

            meetings_reduced = meetings.withColumn(FindMeetingLocationsEnum.TUID.value, max(col('window_row')).over(window_max))\
                                       .orderBy(col('row'))\
                                       .select(Movement.SHAPE.value, 'row', FindMeetingLocationsEnum.TUID.value)\
                                       .where(col('window_row') == 1)

            filtered_df_renamed = filtered_df.withColumnRenamed(Movement.SHAPE.value, Movement.SHAPE_JOIN.value)
            
            meetings_agg = meetings_reduced.join(filtered_df_renamed, ST.intersects(meetings_reduced[Movement.SHAPE.value], 
                                                                                    filtered_df_renamed[Movement.SHAPE_JOIN.value]))

            meetings_agg.checkpoint()            

            meetings_window: SparkWindow = Window.partitionBy('row').orderBy('participant_1')
            out_window: SparkWindow = Window.partitionBy('row')

            final_meetings = meetings_agg.withColumn(FindMeetingLocationsEnum.MAX_MD.value, max(col('meeting_duration')).over(out_window))\
                                         .withColumn(FindMeetingLocationsEnum.MIN_MD.value, min(col('meeting_duration')).over(out_window))\
                                         .withColumn(FindMeetingLocationsEnum.MN_MD.value, mean(col('meeting_duration')).over(meetings_window))\
                                         .withColumn(FindMeetingLocationsEnum.FSD.value, min(col('MEETING_START')).over(out_window))\
                                         .withColumn(FindMeetingLocationsEnum.LSD.value, max(col('MEETING_END')).over(out_window))\
                                         .withColumn('window_row', row_number().over(meetings_window))\
                                         .withColumn(FindMeetingLocationsEnum.TM.value, max(col('window_row')).over(out_window))\
                                         .withColumn(FindMeetingLocationsEnum.MAID.value, monotonically_increasing_id())\
                                         .select(Movement.SHAPE.value,
                                                 FindMeetingLocationsEnum.TUID.value,
                                                 FindMeetingLocationsEnum.TM.value,
                                                 FindMeetingLocationsEnum.MAX_MD.value,
                                                 FindMeetingLocationsEnum.MIN_MD.value,
                                                 FindMeetingLocationsEnum.MN_MD.value,
                                                 FindMeetingLocationsEnum.FSD.value,
                                                 FindMeetingLocationsEnum.LSD.value,
                                                 FindMeetingLocationsEnum.MAID.value)\
                                         .orderBy('row')\
                                         .where(col('window_row') == 1)
            
            self.logger.debug(arcpy.GetIDMessage(190257))
            
            final_meetings.write.layer(self.output_area_features)
            
            try:
                points, areas = self._create_output_features()

                pt_fields = [FindMeetingLocationsEnum.MD.value]
                poly_fields = [FindMeetingLocationsEnum.TM.value]
                
                self.meeting_duration_array = np.array([row[0] for row in arcpy.da.SearchCursor(self.output_point_features, pt_fields)])
                self.meeting_count_array = np.array([row[0] for row in arcpy.da.SearchCursor(self.output_area_features, poly_fields)])
                    
                point_style_dict = point_style(self.meeting_duration_array)
                area_style_dict = area_style(self.meeting_count_array) 
            
                result = FindMeetingLocationResult(point_features=points,
                                                    area_features=areas,
                                                    empty_output=False,
                                                    point_style=json.dumps(point_style_dict),
                                                    area_style=json.dumps(area_style_dict))
                
            
                self.logger.debug(msg="Leaving Find Meeting Locations") 
                return result
            except AssertionError:
                self.logger.error(arcpy.GetMessages(2))

        except InvalidPortalTokenError:
            self.logger.error(arcpy.GetIDMessage(190297))
            exit()
        
        except Exception as e:
            self.logger.error(arcpy.GetIDMessage(190393))
            
            if self.DEBUG:
                import sys
                import traceback
                
                tb = sys.exc_info()[2]
                tbinfo = traceback.format_tb(tb)[0]
                pymsg = '{}\n{}\n{}'.format(tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
                
                self.logger.error(e.__class__.__name__)
                self.logger.error(pymsg)
            exit()