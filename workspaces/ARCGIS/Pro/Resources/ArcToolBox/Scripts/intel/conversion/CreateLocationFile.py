'''
------------------------------------------------------------------------------
CreateLocationFileToolClasses.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.8, Python 3.7
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2021-02-22 - jjones - Initial write-up
* 2021-07-06 - jjones - Fixed bug with setting spatial reference.
* 2022-08-09 - mfunk  - Fixed Intel #3035 schema error
------------------------------------------------------------------------------
'''
from __future__ import annotations

import arcpy
import os
import pandas as pd
import shutil

from typing import Dict, List

from intel.types import CoordinateColumnDict, SparkDataFrame, PySparkSchema
from intel.enumerations import Gazetteer, Movement
from intel.movement import BaseMovementClass
from intel.data_classes import CreateLocationFileResult
from intel.utilities import DEBUG, Logger

class LocationFile(BaseMovementClass):
    def __init__(self,
                 in_placenames_file: str,
                 data_source: str,
                 out_location_file: str,
                 include_features: str | None = None,
                 in_rois: str | None = None):
        
        super().__init__()
        
        self._in_geonames_file = in_placenames_file
        self._data_source = data_source
        self._out_location_file = out_location_file
        self._include_features = include_features
        self._in_rois = in_rois

        self.DEBUG = DEBUG
        self.logger = Logger()
        self.logger.create_logger(self.__class__.__name__)
        
        self.coordinate_columns: CoordinateColumnDict = {
            Gazetteer.GEONAMES.value: {"x":"longitude", "y":"latitude"},
            Gazetteer.NGA_GNS.value: {"x":"long_dd", "y":"lat_dd"},
            Gazetteer.USGS_GNIS.value: {"x":"PRIM_LONG_DEC", "y":"PRIM_LAT_DEC"},
            Gazetteer.USGS_ANT.value: {"x":"PRIMARY_LONGITUDE_DEC", "y":"PRIMARY_LATITUDE_DEC"},
        }

        self.name_column: Dict[str, str] = {
            Gazetteer.GEONAMES.value: 'name',
            Gazetteer.NGA_GNS.value: 'full_name',
            Gazetteer.USGS_GNIS.value: 'FEATURE_NAME',
            Gazetteer.USGS_ANT.value: 'FEATURE_NAME',
        }

        self.feature_codes: Dict[str, str] = {
            Gazetteer.ADMIN.value: "A",
            Gazetteer.HYDRO.value: "H",
            Gazetteer.GEN.value: "L",
            Gazetteer.POP.value: "P",
            Gazetteer.TRANS.value: "R",
            Gazetteer.PT.value: "S",
            Gazetteer.TERR.value: "T",
            Gazetteer.SEA.value: "U",
            Gazetteer.VEG.value: "V"
        }
            
        self.feature_code_column: Dict[str, str] = {
            Gazetteer.GEONAMES.value: 'feature class',
            Gazetteer.NGA_GNS.value: 'FC',
            Gazetteer.USGS_GNIS.value: 'FEATURE_CLASS',
            Gazetteer.USGS_ANT.value: 'FEATURE_CLASS'
        }

        self.usgs_feature_codes: Dict[str, List[str]] = {
            Gazetteer.ADMIN.value: [
                'Census',
                'Civil',
                'Park'
                ],
            Gazetteer.HYDRO.value: [
                'Arroyo',
                'Bay',
                'Beach',
                'Bend',
                'Canal',
                'Channel',
                'Dam',
                'Falls',
                'Gut',
                'Harbor',
                'Lake',
                'Levee',
                'Rapids',
                'Reservoir',
                'Sea',
                'Spring',
                'Stream',
                'Swamp',
                ],
            Gazetteer.GEN.value: [
                'Area',
                'Cemetary',
                'Locale',
                'Military',
                'Oilfield',
                'Reserve',
                'Unknown',
                ],
            Gazetteer.POP.value: [
                'Populated Place'
                ],
            Gazetteer.TRANS.value: [
                'Airport',
                'Bridge',
                'Crossing',
                'Trail',
                'Tunnel',
                ],
            Gazetteer.PT.value: [
                'Building',
                'Church',
                'Hospital',
                'Mine',
                'Post Office', 
                'School',
                'Tower',
                'Well',
                ],
            Gazetteer.TERR.value: [
                'Arch',
                'Basin',
                'Bench',
                'Cape',
                'Cave',
                'Cliff',
                'Crater',
                'Flat',
                'Gap',
                'Glacier',
                'Island',
                'Isthmus',
                'Lava',
                'Pillar',
                'Plain',
                'Range',
                'Ridge',
                'Slope',
                'Summit',
                'Valley',
                ],
            Gazetteer.SEA.value: [
                'Bar',
                ],
            Gazetteer.VEG.value: [
                'Forest',
                'Woods',
                ]
        }

    @property
    def geonames_file(self) -> str:
        return self._in_geonames_file

    @property
    def data_source(self) -> str:
        return self._data_source

    @property
    def out_location_file(self) -> str:
        return self._out_location_file

    @property
    def include_features(self) -> str | None:
        return self._include_features

    @property
    def rois(self) -> str | None:
        return self._in_rois

    @property
    def oid_field(self) -> str:
        return self._oid_field
    @oid_field.setter
    def oid_field(self, value: str) -> None:
        self._oid_field = value

    def _generate_schema(self, data_source: str) -> PySparkSchema:
        from pyspark.sql.types import DoubleType, StringType, IntegerType, StructType
        
        if data_source == Gazetteer.GEONAMES.value:
            return StructType()\
                .add('geonameid', StringType(), True)\
                .add('name', StringType(), True)\
                .add('asciiname', StringType(), True)\
                .add('alternatenames', StringType(), True)\
                .add('latitude', DoubleType(), True)\
                .add('longitude', DoubleType(), True)\
                .add('feature class', StringType(), True)\
                .add('feature code', StringType(), True)\
                .add('country code', StringType(), True)\
                .add('cc2', StringType(), True)\
                .add('admin1 code', StringType(), True)\
                .add('admin2 code', StringType(), True)\
                .add('admin3 code', StringType(), True)\
                .add('admin4 code', StringType(), True)\
                .add('population', IntegerType(), True)\
                .add('elevation', DoubleType(), True)\
                .add('dem', StringType(), True)\
                .add('timezone', StringType(), True)\
                .add('modification date', StringType(), True)
        else:
            raise ValueError

    def _filter_dataframe(self, input_dataframe: SparkDataFrame) -> SparkDataFrame:
        from pyspark.sql.functions import col

        assert self.include_features is not None
        
        if self.data_source == Gazetteer.USGS_GNIS.value or self.data_source == Gazetteer.USGS_ANT.value:
            query = []
            for feature in self.include_features:
                code = self.usgs_feature_codes[feature]
                for element in code:
                    query.append(element)
        else:
            query = [self.feature_codes[feature] for feature in self.include_features]
        
        return input_dataframe.where(col(self.feature_code_column[self._data_source]).isin(query))

    def create(self) -> CreateLocationFileResult | None:
        """The source code of the tool."""
        try:
            if self.DEBUG:
                self.logger.debug(f"Geonames File: {self.geonames_file}")
                self.logger.debug(f"Data Source: {self.data_source}")
                self.logger.debug(f"Output Location File: {self.out_location_file}")
                self.logger.debug(f"Include Features: {self.include_features}")
                self.logger.debug(f"Regions Of Interest: {self.rois}")

            self.initialize_spark()

            from pyspark.sql.functions import lit, col
            from ga_spark.sql import functions as ST

            arcpy.AddMessage(arcpy.GetIDMessage(190370))

            if self.data_source == Gazetteer.GEONAMES.value:
                schema = self._generate_schema(data_source=self.data_source)
                df = self.spark.read.format('csv')\
                                    .options(delimiter='\t')\
                                    .schema(schema)\
                                    .load(self.geonames_file)
            elif self.data_source == Gazetteer.NGA_GNS.value:
                df = self.spark.read.format('csv')\
                                    .options(delimiter='\t')\
                                    .option("header",True)\
                                    .option("inferSchema",True)\
                                    .load(self.geonames_file)

                if 'full_name' not in df.columns:
                    raise ValueError
            else:
                df = self.spark.read.format('csv')\
                                    .options(delimiter='|')\
                                    .option("header",True)\
                                    .option("inferSchema",True)\
                                    .load(self.geonames_file)

                if self.data_source == Gazetteer.USGS_ANT.value and 'ANTARCTICA_FEATURE_ID' not in df.columns:
                    raise ValueError

                elif self.data_source == Gazetteer.USGS_GNIS.value and 'FEATURE_ID' not in df.columns:
                    raise ValueError

                else:
                    pass

            if self.include_features:
                filtered_df = self._filter_dataframe(input_dataframe=df)
            else:
                filtered_df = df

            if self.rois:
                assert len(self.rois) > 0, arcpy.GetIDMessage(190373)
                roi_ = self.read_layer(input_layer=self.rois)
                roi_df = roi_.withColumnRenamed(Movement.SHAPE.value, Movement.SHAPE_JOIN.value)

                points = filtered_df.withColumn(Movement.SHAPE.value, ST.point(col(self.coordinate_columns[self.data_source]['x']), 
                                                                               col(self.coordinate_columns[self.data_source]['y'])))\
                                    .withColumn(Movement.SHAPE.value, ST.srid(Movement.SHAPE.value, 4326))\
                                    .withColumnRenamed(self.name_column[self.data_source], Gazetteer.NAME.value)
            

                drop_df = points.join(roi_df, ST.intersects(points[Movement.SHAPE.value], 
                                                            roi_df[Movement.SHAPE_JOIN.value]))\
                                  .select(Gazetteer.NAME.value, 
                                          self.coordinate_columns[self.data_source]['y'],
                                          self.coordinate_columns[self.data_source]['x'])

                arcpy.AddMessage(arcpy.GetIDMessage(190269))

            else:
                drop_df = filtered_df.select(self.name_column[self.data_source], 
                                             self.coordinate_columns[self.data_source]['y'],
                                             self.coordinate_columns[self.data_source]['x'])
                arcpy.AddMessage(arcpy.GetIDMessage(190269))

            gaz_df = drop_df.withColumn(Gazetteer.PRECISION.value, lit("0"))\
                            .withColumn(Gazetteer.ORIG_COORD.value, lit(""))\
                            .withColumn(Gazetteer.CASE_SENSITIVE.value, lit("TRUE"))\
                            .withColumn(Gazetteer.ERRORS_ALLOWED.value, lit("0"))\
                            .withColumn(Gazetteer.EFEL.value, lit("TRUE"))\
                            .withColumn(Gazetteer.SR.value, lit(""))

            arcpy.AddMessage(arcpy.GetIDMessage(190371))
            gaz_df.write.options(header=True, delimiter=',')\
                        .csv(self.out_location_file)
            
            if os.path.isdir(self.out_location_file):
                csv_in_dir = [os.path.join(self.out_location_file, f) for f in os.listdir(self.out_location_file) 
                                if os.path.isfile(os.path.join(self.out_location_file, f)) and f.endswith(".csv")]

                combined_csv = pd.concat([pd.read_csv(f) for f in csv_in_dir])

                shutil.rmtree(self.out_location_file)

                if combined_csv.shape[0] == 0:
                    arcpy.AddWarning(arcpy.GetIDMessage(117))

                combined_csv.to_csv(self.out_location_file, index=False)

                return CreateLocationFileResult(self.out_location_file, False, False, None)
            
            else:
                return CreateLocationFileResult(None, True, False, None)

        except ValueError:
            
            return CreateLocationFileResult(None, True, True, arcpy.GetIDMessage(190372))
        
        except Exception as e:
            self.handle_movement_error(exception=e)