'''
------------------------------------------------------------------------------
CompareAreas.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.6, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2020-03-02 - jjones - original writeup
* 2020-05-01 - jjones - updated default output symbology for Find Cotravelers and Find Meeting Locations
* 2020-12-03 - jjones - renamed file to match class name
* 2021-02-01 - jjones - added __repr__, __str__, and __del__methods
* 2021-03-11 - jjones - updated due to changes in underlying geometry objects
------------------------------------------------------------------------------
'''
from __future__ import annotations
import arcpy

from intel.movement.MovementBaseClass import BaseMovementClass
from intel.movement.utils import empty_output
from intel.enumerations import Movement, CompareAreasEnum
from intel.utilities import Logger, DEBUG, LocaleValidate
from intel.errors import InvalidPortalTokenError

class Compare_Areas(BaseMovementClass):
    def __init__(self, 
                input_point_features: str, 
                input_area_features: str, 
                output_featureclass: str, 
                point_id_field: str,
                area_id_field: str, 
                relationship: str = 'Located in Both (Location Only)', 
                time_difference: str| None = None,
                time_relationship: str  = CompareAreasEnum.NEAR.value,
                time_statistics: str = CompareAreasEnum.NO_TIME_STATS.value):
        
        super().__init__()
        
        self._loc = LocaleValidate()

        self._input_point_features: str = input_point_features
        self._input_area_features: str = input_area_features
        self._output_featureclass: str = output_featureclass
        self._point_id_field: str = point_id_field
        self._area_id_field: str = area_id_field
        self._relationship: str = relationship
        self._time_difference: str | None = time_difference
        self._time_relationship: str = time_relationship
        self._time_statistics: str = time_statistics
        
        self.DEBUG = DEBUG
        self.logger = Logger()
        self.logger.create_logger(self.__class__.__name__)
        
        if self.DEBUG:
            self.logger.debug(f"Loggers: {self.logger.loggers}")
            self.logger.debug(f"Active handlers: {self.logger.active_handlers}")

        self.delete_items = []

    def __repr__(self) -> str:
        return f"CompareAreas<input point features: {self.input_point_features}, \n\
                              input area features: {self.input_area_features}, \n\
                              output feature clas: {self.output_featureclass}, \n\
                              point id field: {self.point_id_field}, \n\
                              area id field: {self.area_id_field}, \n\
                              relationship: {self.relationship}, \n\
                              time difference: {self.time_difference}>"

    def __str__(self) -> str:
        return self.__repr__()

    def __del__(self) -> None:
        del self.logger           
        for item in self.delete_items:
            if arcpy.Exists(item):
                arcpy.DeleteFeatures_management(item)

    @property
    def input_point_features(self) -> str:
        return self._input_point_features
    @input_point_features.setter
    def input_point_features(self, value: str) -> None:
        self._input_point_features = value
    
    @property
    def input_area_features(self) -> str:
        return self._input_area_features
    @input_area_features.setter
    def input_area_features(self, value: str):
        self._input_area_features = value
    
    @property
    def output_featureclass(self) -> str:
        return self._output_featureclass
    @output_featureclass.setter
    def output_featureclass(self, value: str):
        self._output_featureclass = value
    
    @property
    def point_id_field(self) -> str:
        return self._point_id_field
    @point_id_field.setter
    def point_id_field(self, value: str):
        self._point_id_field = value 
    
    @property
    def area_id_field(self) -> str:
        return self._area_id_field
    @area_id_field.setter
    def area_id_field(self, value: str):
        self._area_id_field = value
    
    @property
    def relationship(self) -> str:
        return self._relationship
    @relationship.setter
    def relationship(self, value: str):
        self._relationship = value
    
    @property
    def time_difference(self) -> str | None:
        if self._time_difference is None:
            return None
        value_unit = self._time_difference.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._time_difference)
        switched_time_difference = f"{value} {value_unit}"
        return switched_time_difference
    @time_difference.setter
    def time_difference(self, value: str | None):
        self._time_difference = value

    @property
    def time_relationship(self) -> str:
        relationships = {
            CompareAreasEnum.NEAR.value: "Near",
            CompareAreasEnum.NEAR_BEFORE.value: "NearBefore",
            CompareAreasEnum.NEAR_AFTER.value: "NearAfter",
        }

        return relationships[self._time_relationship]

    @property
    def time_statistics(self) -> str:
        return self._time_statistics

    def compare(self):
        """The source code of the tool."""

        try:   

            if self.DEBUG:
                self.logger.debug(msg="Inside of Compare Areas")
                self.logger.debug(msg=f"Logger Class: {repr(self.logger)}")
                self.logger.debug(msg=f"Logger location: {self.logger.get_class_address()}")
                self.logger.debug(f"Point Features: {self.input_point_features}")
                self.logger.debug(f"Point ID field: {self.point_id_field}")
                self.logger.debug(f"Area Features: {self.input_area_features}")
                self.logger.debug(f"Area ID field: {self.area_id_field}")
                self.logger.debug(f"Relationship: {self.relationship}")
                self.logger.debug(f"Time statistics: {self.time_statistics}")

            if self.relationship == 'LOCATION_TIME':
                time_split = self.time_difference.split(" ")
                time_operation = self.time_relationship
                time_distance = float(time_split[0])
                time_distance_unit = time_split[1]
            else:
                time_operation = None
                time_distance = None
                time_distance_unit = None

            if self.DEBUG:
                self.logger.debug(f"Time Operation: {time_operation}")
                self.logger.debug(f"Time Distance: {str(time_distance)}")
                self.logger.debug(f"Time Distance Unit: {time_distance_unit}")

            self.initialize_spark()

            from pyspark.sql.window import Window
            from pyspark.sql.functions import col, row_number, count 

            point_df = self.read_layer(self.input_point_features)
            area_df = self.read_layer(self.input_area_features)

            keep_fields = [
                Movement.SHAPE.value,
                Movement.TIME_START.value,
                CompareAreasEnum.AREA_ID.value,
                CompareAreasEnum.PT_ID.value,
            ]

            point = point_df.withColumnRenamed(self.point_id_field, CompareAreasEnum.PT_ID.value)\
                            .drop(*[f for f in point_df.columns if f not in keep_fields])
            area = area_df.withColumnRenamed(self.area_id_field, CompareAreasEnum.AREA_ID.value)\
                          .drop(*[f for f in area_df.columns if f not in keep_fields])

            arcpy.AddMessage(arcpy.GetIDMessage(190254))

            join_df = self.spark.ga.tools.join_features(target_layer=point, 
                                                        join_layer=area,
                                                        join_operation="JoinOneToMany",
                                                        join_fields=None,
                                                        summary_fields=None,
                                                        spatial_relationship="Intersects",
                                                        spatial_near_distance=None,
                                                        spatial_near_distance_unit=None,
                                                        temporal_relationship=time_operation, 
                                                        temporal_near_distance=time_distance,
                                                        temporal_near_distance_unit=time_distance_unit,
                                                        join_condition=None, 
                                                        attribute_relationship=None)

            window = Window.partitionBy(CompareAreasEnum.AREA_ID.value, CompareAreasEnum.PT_ID.value).orderBy(CompareAreasEnum.AREA_ID.value, CompareAreasEnum.PT_ID.value)

            if self.DEBUG:
                self.logger.debug(f"join_df Columns: {join_df.columns}")

            if self.time_statistics == CompareAreasEnum.TRUE.value or self.time_statistics == CompareAreasEnum.TIME_STATS.value:
                from pyspark.sql.functions import min, max
                from pyspark.sql.types import LongType
                
                agg_df = join_df.withColumn("row_number", row_number().over(window))\
                                .withColumn(CompareAreasEnum.COUNT.value, count(col(CompareAreasEnum.PT_ID.value)).over(window))\
                                .withColumn(CompareAreasEnum.TIME_ENTER.value, min(col(Movement.TIME_START.value)).over(window))\
                                .withColumn(CompareAreasEnum.TIME_EXIT.value, max(col(Movement.TIME_START.value)).over(window))\
                                .withColumn(CompareAreasEnum.DURATION.value, col(CompareAreasEnum.TIME_EXIT.value).cast(LongType()) - col(CompareAreasEnum.TIME_ENTER.value).cast(LongType()))\
                                .where(col("row_number") == 1)\
                                .select(
                                    f"join_{Movement.SHAPE.value}",
                                    CompareAreasEnum.AREA_ID.value,
                                    CompareAreasEnum.PT_ID.value,
                                    CompareAreasEnum.COUNT.value,
                                    CompareAreasEnum.DURATION.value,
                                    CompareAreasEnum.TIME_ENTER.value,
                                    CompareAreasEnum.TIME_EXIT.value
                                )

            else:
                agg_df = join_df.withColumn("row_number", row_number().over(window))\
                                .withColumn(CompareAreasEnum.COUNT.value, count(col(CompareAreasEnum.PT_ID.value)).over(window))\
                                .where(col("row_number") == 1)\
                                .select(
                                    f"join_{Movement.SHAPE.value}", 
                                    CompareAreasEnum.AREA_ID.value, 
                                    CompareAreasEnum.PT_ID.value, 
                                    CompareAreasEnum.COUNT.value
                                )

            agg_df.write.layer(self.output_featureclass)

            if empty_output(self.output_featureclass) == True:
                self.logger.warning(arcpy.GetIDMessage(117))

            if self.DEBUG:
                self.logger.debug(msg="Leaving Compare Areas") 
                
            return self.output_featureclass

        except InvalidPortalTokenError:
            self.logger.error(arcpy.GetIDMessage(190297))
            exit()
        
        except Exception as e:
            self.logger.error(arcpy.GetIDMessage(190391))
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