'''
------------------------------------------------------------------------------
intelMovementBaseClass.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.9, Python 3.7
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2020-03-02 - jjones - original writeup
* 2020-05-01 - jjones - updated default output symbology for Find Cotravelers and Find Meeting Locations
* 2020-09-15 - jjones - split BaseMovementClass into separate file
------------------------------------------------------------------------------
'''
from __future__ import annotations

import arcpy
import json
import gautils

from typing import List

from intel.types import SparkDataFrame
from intel.enumerations import Movement
from intel.utilities import DEBUG, Logger, Capturing
from intel.errors import InvalidPortalTokenError

class BaseMovementClass(object):
    
    def __init__(self):
        self.DEBUG = DEBUG
        self._oid_field: str = ''
        self._time_field: str = ''

        self._source_sr: arcpy.SpatialReference | None = None
        self._updated_sr_factoryCode: int | None = None 

        self._cleanup: List[str] = []

        self.logger = Logger()
        self.logger.create_logger(self.__class__.__name__)
        if self.DEBUG:
            self.logger.debug(f"Loggers: {self.logger.loggers}")
            self.logger.debug(f"Active handlers: {self.logger.active_handlers}")

        return

    def __del__(self):
        for i in self.cleanup:
            try:
                del i
            except:
                pass
        
    @property
    def oid_field(self) -> str:
        return self._oid_field
    @oid_field.setter
    def oid_field(self, value: str) -> None:
        self._oid_field = value

    @property
    def time_field(self) -> str:
        return self._time_field
    @time_field.setter
    def time_field(self, value: str) -> None:
        self._time_field = value

    @property
    def source_spatial_reference(self) -> int:
        return self._source_sr.factoryCode

    @property
    def source_spatial_reference_type(self) -> str:
        return self._source_sr.type

    @property
    def updated_spatial_reference(self) -> int | None:
        return self._updated_sr_factoryCode
    @updated_spatial_reference.setter
    def updated_spatial_reference(self, value: int) -> None:
        self._updated_sr_factoryCode = value

    @property
    def cleanup(self) -> List[str]:
        return self._cleanup

    def initialize_spark(self) -> None:
        try:
            import ga_spark
            self.spark = ga_spark.get_or_create()
            from intel.movement.accessors.TrackDataFrame import TrackDataFrame

        except Exception as e:
            self.handle_movement_error(e)

    def read_layer(self, input_layer: str) -> SparkDataFrame:
        """Takes an input feature layer and returns a Spark DataFrame.
        This will work with a feature service but only if the feature
        service is coming from the active portal set in ArcGIS AllSource.

        Args:
            input_layer (str): The layer that will be read in as a Spark DataFrame.

        Returns:
            SparkDataFrame: a Spark DataFrame of the input layer.
        """

        try:
            from py4j.protocol import Py4JJavaError

            d = arcpy.Describe(input_layer)
            self._source_sr = d.spatialReference

            try:
                if not self.time_field:
                    self.time_field = d.startTimeField
                if self.DEBUG: self.logger.debug(f"Time Field: {self.time_field}")
            except Exception:
                if self.DEBUG:
                    self.logger.warning("No time field present.")

            if not self.oid_field:
                self.oid_field = d.OIDFieldName
            if self.DEBUG: self.logger.debug(f"OID Field: {self.oid_field}")

            if d.catalogPath.startswith('http'):
                if self.DEBUG: self.logger.debug(f"Feature Service path: {d.catalogPath}")
                
                desc = gautils.utilities.get_layer_description(input_layer)

                try:
                    desc['token'] = arcpy.GetSigninToken()['token']

                    if self.DEBUG: self.logger.debug(f"Token: {desc['token']}")

                    df = self.spark.read.format('layer')\
                                        .option("arcpy.layer.description", json.dumps(desc))\
                                        .option("inferGeometry", str('inferTime').lower())\
                                        .option("inferTime", str('inferTime').lower())\
                                        .load(d.catalogPath)

                    if self.DEBUG: self.logger.debug(df.columns)
                    
                    return df.withColumnRenamed('shape', Movement.SHAPE.value)
                except (KeyError, Py4JJavaError, TypeError):
                    raise InvalidPortalTokenError
            
            else:
                return self.spark.read.layer(input_layer)
        except Exception as e:
            self.handle_movement_error(e)

    def drop_fields_on_load(self, input_dataframe: SparkDataFrame,  
                                  keep_fields: List[str] | None = None) -> SparkDataFrame:
        """Drops all fields except for the geometry, time, id, and user-defined time field.  This is to eliminate any possible
        errors that may arise during processing.  

        Args:
            input_dataframe (SparkDataFrame): A Spark DataFrame with at least 4 columns.
            id_field (str): The field that is used to organize points into tracks.
            time_field (str): The field that time was set on in the initial feature layer.

        Returns:
            SparkDataFrame: A minimized Spark DataFrame reduced to four fields.  
        """
       
        if keep_fields is None:
            keep_fields = [Movement.SHAPE.value,
                            Movement.TIME_START.value,
                            self._track_id_field,
                            self.time_field,
                            self.oid_field,
                        ]
        
        drop_fields: List[str] = [f for f in input_dataframe.columns if f not in keep_fields]

        out: SparkDataFrame = input_dataframe.drop(*drop_fields)
        
        return out

    def write_csv(self, input_dataframe: SparkDataFrame, out_location: str) -> str | None:
        try:
            import os
            import shutil
            import pandas as pd

            input_dataframe.write.option("header", True)\
                                .options(delimiter=',')\
                                .csv(out_location)

            if os.path.isdir(out_location):
                csv_in_dir = [os.path.join(out_location, f) for f in os.listdir(out_location) 
                                if os.path.isfile(os.path.join(out_location, f)) and f.endswith(".csv")]

                combined_csv = pd.concat([pd.read_csv(f) for f in csv_in_dir])

                shutil.rmtree(out_location)

                if combined_csv.shape[0] == 0:
                    arcpy.AddWarning(arcpy.GetIDMessage(117))

                combined_csv.to_csv(out_location, index=False)
        except Exception as e:
            self.handle_movement_error(e, id_message=190382)

    def validate_time_enablement(self, input_dataframe: SparkDataFrame) -> SparkDataFrame:
        
        #TODO: This needs updated with new st method for setting time. 
        
        from pyspark.sql.functions import col, struct
        if 'start_time' not in input_dataframe.columns:
            time_metadata = {'time': {"type": "interval"}} 
            def time_maker(start):
                return struct(start.alias('start')).alias('$time', metadata=time_metadata)
            
            return input_dataframe.withColumn(Movement.TIME_START.value, col(self.__time_field).alias(Movement.TIME_START.value, metadata=time_metadata))\
                                  .withColumn(Movement.TIME_ALT.value, time_maker(col(self.__time_field)))
        else:
            return input_dataframe

    def handle_movement_error(self, exception: Exception, id_message: int | None = None, msg: str | None = None) -> None:
        if id_message:
            self.logger.error(arcpy.GetIDMessage(id_message)) 
        if msg:
            self.logger.error(msg)
            
        if self.DEBUG:
            import sys
            import traceback
            from py4j.protocol import Py4JJavaError
            
            if type(exception) is Py4JJavaError:
                exc_type, exc_obj, exc_tb = sys.exc_info()
                
                self.logger.error(str(exc_type))
                self.logger.error(str(exc_obj))
                self.logger.error(f"Py4JJavaError Line Number:  {str(exc_tb.tb_lineno)}")
                self.logger.error(arcpy.GetMessages(2))
            else:
                tb = sys.exc_info()[2]
                tbinfo = traceback.format_tb(tb)[0]
                
                self.logger.error(tbinfo)
                self.logger.error(str(sys.exc_info()[1]))
                self.logger.error(exception.__class__.__name__)
                self.logger.error(arcpy.GetMessages(2))
            exit()

    def generate_debug_messages(self, dataframe: SparkDataFrame, dataframe_name: str) -> None:
            self.logger.debug(f"{dataframe_name} logical plan")

            with Capturing() as output:
                dataframe.explain()

            for row in output:
                self.logger.debug(f"{row}")

            dataframe_partitions = dataframe.rdd.getNumPartitions()
            self.logger.debug(f"{dataframe_name} dataframe has {str(dataframe_partitions)} partitions")

    def merge_dataframes(self, dataframes: List[SparkDataFrame]) -> SparkDataFrame:
        from functools import reduce
        from pyspark.sql import DataFrame

        df: SparkDataFrame = reduce(DataFrame.unionAll, dataframes)

        return df

    def convert_projection(self, input_dataframe: SparkDataFrame) -> SparkDataFrame:
        if self.source_spatial_reference_type == "Geographic":
            from ga_spark.sql import functions as ST
            
            assert self.source_spatial_reference           
            self.updated_spatial_reference = 54032

            return input_dataframe.withColumn(Movement.SHAPE.value, ST.transform(Movement.SHAPE.value, self.updated_spatial_reference))

        else:
            return input_dataframe
