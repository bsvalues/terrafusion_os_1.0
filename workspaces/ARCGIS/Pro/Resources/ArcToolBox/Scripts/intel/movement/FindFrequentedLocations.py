from __future__ import annotations

import arcpy

from typing import List
from itertools import chain

from intel.movement import BaseMovementClass
from intel.types import SparkDataFrame, SparkWindow
from intel.enumerations import Movement, FindFrequentedLocationsEnum
from intel.utilities import DEBUG, Logger, LocaleValidate
from intel.errors import InvalidPortalTokenError

from intel.movement.utils import add_day_of_week

class FrequentedLocations(BaseMovementClass):

    def __init__(self, features: str, 
                       unique_id_field: str, 
                       out_features: str, 
                       search_distance: str,
                       loiter_time: str, 
                       boundary: str,
                       min_dwells: int,
                       norm_daily_dist: str,
                       expression: str | None = None,
                       summary_fields: List[str] | None = None):
        super().__init__()

        self._loc = LocaleValidate()

        self._features = features
        self._unique_id = unique_id_field
        self._out_features = out_features
        self._search_distance = search_distance
        self._loiter_time = loiter_time
        self._time_boundary = boundary
        self._summary_fields = summary_fields
        self._expression = expression
        self._min_dwells = min_dwells
        self._norm_daily_dist = norm_daily_dist

        self.DEBUG = DEBUG

        self.logger = Logger()
        self.logger.create_logger(name=self.__class__.__name__)

    @property
    def in_features(self) -> str:
        return self._features

    @property
    def track_id(self) -> str:
        return self._unique_id

    @property
    def out_feature(self) -> str:
        return self._out_features

    @property
    def search_distance(self) -> str:
        value_unit = self._search_distance.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._search_distance)
        switched_distance = f"{value} {value_unit}"
        return switched_distance

    @property
    def loiter_time(self) -> str:
        value_unit = self._loiter_time.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._loiter_time)
        switched_loiter_time = f"{value} {value_unit}"
        return switched_loiter_time

    @property
    def time_boundary(self) -> str:
        value_unit = self._time_boundary.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._time_boundary)
        switched_time_boundary = f"{value} {value_unit}"
        return switched_time_boundary
        
    @property
    def summary_fields(self) -> List[str] | None:
        return self._summary_fields

    @property
    def min_dwells(self) -> int:
        return self._min_dwells

    @property
    def norm_daily_dist(self) -> str:
        return self._norm_daily_dist

    @property
    def expression(self) -> str | None:
        return self._expression
    @expression.setter
    def expression(self, value: str) -> None:
        self._expression = value

    def filter_input_dataframe(self, dataframe: SparkDataFrame) -> SparkDataFrame:
        """Filters the input dataframe based on the expression property.  Adds necessary information
        to the existing expression to make it work in Spark SQL.  If the expression property is set to None,
        returns the input dataframe with no filter applied.

        Args:
            dataframe (SparkDataFrame): The DataFrame to be filtered.

        Returns:
            SparkDataFrame: The DataFrame filtered by the value in expression.  If no expression is provided, this is the input DataFrame.
        """
        if self.expression:
            self.expression =  f"SELECT * FROM df WHERE {self.expression};"

            if self.DEBUG: self.logger.debug(f"Expression: {self.expression}")

            dataframe.registerTempTable("df")

            df = self.spark.sql(self.expression)

            return df

        else:
            return dataframe

    def fill_missing_days(self, dataframe: SparkDataFrame) -> SparkDataFrame:
        """Adds the missing days of the week to the input DataFrame. 

        Args:
            dataframe (SparkDataFrame): The Spark DataFrame that has had the daily distribution calculated.

        Returns:
            SparkDataFrame: A Spark DataFrame with the days of the week that were not identified by the calculate_daily_distribution
            method added and set to 0. 
        """
        
        from pyspark.sql.functions import lit
        
        days_to_add = []
        if FindFrequentedLocationsEnum.MON.value not in dataframe.columns:
            days_to_add.append(FindFrequentedLocationsEnum.MON.value)
        if FindFrequentedLocationsEnum.TUE.value not in dataframe.columns:
            days_to_add.append(FindFrequentedLocationsEnum.TUE.value)
        if FindFrequentedLocationsEnum.WED.value not in dataframe.columns:
            days_to_add.append(FindFrequentedLocationsEnum.WED.value)
        if FindFrequentedLocationsEnum.THU.value not in dataframe.columns:
            days_to_add.append(FindFrequentedLocationsEnum.THU.value)
        if FindFrequentedLocationsEnum.FRI.value not in dataframe.columns:
            days_to_add.append(FindFrequentedLocationsEnum.FRI.value)
        if FindFrequentedLocationsEnum.SAT.value not in dataframe.columns:
            days_to_add.append(FindFrequentedLocationsEnum.SAT.value)
        if FindFrequentedLocationsEnum.SUN.value not in dataframe.columns:
            days_to_add.append(FindFrequentedLocationsEnum.SUN.value)

        dataframes = []

        if len(days_to_add) > 0:
            for i,day in enumerate(days_to_add):
                if len(dataframes) == 0:
                    df_name = dataframe.withColumn(day, lit(0))
                    dataframes.append(df_name)
                else:
                    df_to_use: SparkDataFrame = dataframes[len(dataframes) - 1]
                    df_name = df_to_use.withColumn(day, lit(0))
                    dataframes.append(df_name)

            return dataframes[len(dataframes) - 1]
        else:
            return dataframe

    def drop_unused_stat_fields(self, dataframe: SparkDataFrame) -> SparkDataFrame:
        """Drops the statistics fields that were not specified for inclusion by the user in the output.

        Args:
            dataframe (SparkDataFrame): The Spark DataFrame that includes the necessary statistic fields

        Returns:
            SparkDataFrame: A Spark DataFrame containing only the user specified statistic fields.
        """
        
        keep_fields = {
            FindFrequentedLocationsEnum.DD.value: {
                'MAX': FindFrequentedLocationsEnum.DDMAX.value,
                'MIN': FindFrequentedLocationsEnum.DDMIN.value,
                'MEAN': FindFrequentedLocationsEnum.DDMEAN.value,
                'STD': FindFrequentedLocationsEnum.DDSTD.value,
            },
            Movement.TIME_START.value.upper(): {
                'MAX': FindFrequentedLocationsEnum.STARTMAX.value,
                'MIN': FindFrequentedLocationsEnum.STARTMIN.value,
                'MEAN': FindFrequentedLocationsEnum.STARTMEAN.value,
                'STD': FindFrequentedLocationsEnum.STARTSTD.value,
            },
            Movement.TIME_END.value.upper(): {
                'MAX': FindFrequentedLocationsEnum.ENDMAX.value,
                'MIN': FindFrequentedLocationsEnum.ENDMIN.value,
                'MEAN': FindFrequentedLocationsEnum.ENDMEAN.value,
                'STD': FindFrequentedLocationsEnum.ENDSTD.value
            }
        }

        keep_list = [
            Movement.SHAPE.value,
            FindFrequentedLocationsEnum.TRACK_ID.value,
            FindFrequentedLocationsEnum.AREA_ID.value,
            FindFrequentedLocationsEnum.TD.value,
            FindFrequentedLocationsEnum.TT.value,
            FindFrequentedLocationsEnum.START.value,
            FindFrequentedLocationsEnum.END.value,
            FindFrequentedLocationsEnum.MON_OUT.value,
            FindFrequentedLocationsEnum.TUE_OUT.value,
            FindFrequentedLocationsEnum.WED_OUT.value,
            FindFrequentedLocationsEnum.THU_OUT.value,
            FindFrequentedLocationsEnum.FRI_OUT.value,
            FindFrequentedLocationsEnum.SAT_OUT.value,
            FindFrequentedLocationsEnum.SUN_OUT.value,
        ]

        if self.summary_fields:
            for i,j in enumerate(self.summary_fields):
                keep_list.append(keep_fields[j[0]][j[1]])

        if self.DEBUG: arcpy.AddMessage(f"Keep list: {keep_list}")

        return dataframe.drop(*[f for f in dataframe.columns if f not in keep_list])

    def filter_total_dwells(self, dataframe: SparkDataFrame) -> SparkDataFrame:
        """Filters the input dataframe by the minimum number of dwells specified in the min_dwells property.

        Args:
            dataframe (SparkDataFrame): The dataframe to be filtered by number of dwells.

        Returns:
            SparkDataFrame: A Spark DataFrame containing only the features that are greater than or equal to the min_dwells property.
        """
        
        if self.min_dwells:
            from pyspark.sql.functions import col
            
            return dataframe.where(col(FindFrequentedLocationsEnum.TD.value) >= self.min_dwells)

        else:
            return dataframe

    def calculate_daily_distribution(self, dataframe: SparkDataFrame) -> SparkDataFrame:
        """Calculates the breakdown of dwell locations by day of week.  If the norm_daily_distribution
        property is set to NORMALIZE or true, the values represent a percentage of the total dwell time at the location.
        Otherwise the value returned represents the real value of dwells that have occurred at that location on the given day of week.

        Args:
            dataframe (SparkDataFrame): A Spark DataFrame containing the necessary fields to calculate distribution based on day of week.

        Returns:
            SparkDataFrame: A Spark DataFrame that contains distribution of dwells by day of the week. 
        """


        from pyspark.sql.functions import col, lit, coalesce

        levels = [x for x in chain(*dataframe.select("day_of_week").distinct().collect())]

        pivoted = dataframe.groupBy(FindFrequentedLocationsEnum.AREA_ID.value)\
                           .pivot("day_of_week", levels).count()

        if self.norm_daily_dist == FindFrequentedLocationsEnum.NORM.value or self.norm_daily_dist == Movement.TRUE.value:
            row_count = sum(coalesce(col(x), lit(0)) for x in levels)
            adjusted = [(col(c) / row_count).alias(c) for c in levels]
        else:
            adjusted = [(col(c) * 1).alias(c) for c in levels]

        dow_sum: SparkDataFrame = pivoted.na.fill(value=0)\
                                            .select(col(FindFrequentedLocationsEnum.AREA_ID.value), *adjusted)\
                                            .withColumnRenamed(FindFrequentedLocationsEnum.AREA_ID.value, "join_area_id")

        dow_filled = self.fill_missing_days(dow_sum)

        return dow_filled

    def find(self):
        try:
            if self.DEBUG:
                self.logger.debug(f"Input Feature Class: {self.in_features}")
                self.logger.debug(f"Track ID field: {self.track_id}")
                self.logger.debug(f"Output Feature Class: {self.out_feature}")
                self.logger.debug(f"Search Distance: {self.search_distance}")
                self.logger.debug(f"Loiter Time: {self.loiter_time}")
                self.logger.debug(f"Time Boundary: {self.time_boundary}")
                self.logger.debug(f"Summary Fields {self.summary_fields}")
                self.logger.debug(f"Expression: {self.expression}")
                self.logger.debug(f"Normalize Daily Distributions: {self.norm_daily_dist}")

            self.initialize_spark()

            from pyspark.sql.types import LongType, IntegerType
            from pyspark.sql.functions import col, monotonically_increasing_id, hour, row_number, max, min, mean, stddev, sum
            from pyspark.sql.window import Window

            if self.DEBUG: self.logger.debug(f"Summary Fields: {self.summary_fields}")
            
            in_df = self.read_layer(self.in_features)

            df = self.filter_input_dataframe(in_df)

            distance = self.search_distance.split(" ")
            time = self.loiter_time.split(" ")
            boundary = self.time_boundary.split(" ")

            time_value = float(time[0])
            time_unit = time[1]

            boundary_value = float(boundary[0])
            boundary_unit = boundary[1]

            distance_value = float(distance[0])
            distance_unit = distance[1]

            arcpy.AddMessage(arcpy.GetIDMessage(190259))

            # summary stats to empty array
            dwells = self.spark.ga.tools.find_dwell_locations(input_layer=df,
                                                            track_fields=[self.track_id],
                                                            distance_tolerance=distance_value,
                                                            distance_tolerance_unit=distance_unit,
                                                            time_tolerance=time_value,
                                                            time_tolerance_unit=time_unit,
                                                            time_boundary_split=boundary_value,
                                                            time_boundary_split_unit=boundary_unit,
                                                            summary_fields=[],
                                                            output_type='DwellConvexHulls')

            dwells.cache()

            dwells_dow = add_day_of_week(dwells)
            
            arcpy.AddMessage(arcpy.GetIDMessage(190266))

            dissolved_areas = self.spark.ga.tools.dissolve_boundaries(dwells, 
                                                                    dissolve_fields=[self.track_id], 
                                                                    multipart=False)\
                                                .withColumn(FindFrequentedLocationsEnum.AREA_ID.value, monotonically_increasing_id())

            keep_fields = [
                self.track_id,
                'DwellID',
                Movement.SHAPE.value,
                Movement.TIME_START.value,
                Movement.TIME_END.value,
                "day_of_week",
                FindFrequentedLocationsEnum.DD.value,
                FindFrequentedLocationsEnum.HOUR_START.value,
                FindFrequentedLocationsEnum.HOUR_END.value,
            ]

            dwells_drop = dwells_dow.drop(*[f for f in dwells.columns if f not in keep_fields])

            _join_condition = f"$join['{self.track_id}'] == $target['{self.track_id}']"

            arcpy.AddMessage(arcpy.GetIDMessage(190254))

            join = self.spark.ga.tools.join_features(target_layer=dissolved_areas, 
                                                    join_layer=dwells_drop,
                                                    join_operation="JoinOneToMany",
                                                    join_fields=None,
                                                    summary_fields=None,
                                                    spatial_relationship="Intersects",
                                                    spatial_near_distance=None,
                                                    spatial_near_distance_unit=None,
                                                    temporal_relationship=None, 
                                                    temporal_near_distance=None,
                                                    temporal_near_distance_unit=None,
                                                    join_condition=_join_condition, 
                                                    attribute_relationship=None)\
                                    .withColumn(FindFrequentedLocationsEnum.DD.value, (col(Movement.TIME_END.value).cast(LongType()) - col(Movement.TIME_START.value).cast(LongType())))\
                                    .withColumn(FindFrequentedLocationsEnum.HOUR_START.value, hour(col(Movement.TIME_START.value)))\
                                    .withColumn(FindFrequentedLocationsEnum.HOUR_END.value, hour(col(Movement.TIME_END.value)))\
                                    .select(self.track_id, 
                                            Movement.SHAPE.value, 
                                            Movement.TIME_START.value, 
                                            Movement.TIME_END.value, 
                                            FindFrequentedLocationsEnum.AREA_ID.value, 
                                            "day_of_week", 
                                            FindFrequentedLocationsEnum.DD.value,
                                            FindFrequentedLocationsEnum.HOUR_START.value,
                                            FindFrequentedLocationsEnum.HOUR_END.value)

            join.checkpoint()

            dow_filled = self.calculate_daily_distribution(dataframe=join)

            window_time: SparkWindow = Window.partitionBy(FindFrequentedLocationsEnum.AREA_ID.value).orderBy(Movement.TIME_START.value)
            window: SparkWindow = Window.partitionBy(FindFrequentedLocationsEnum.AREA_ID.value)

            arcpy.AddMessage(arcpy.GetIDMessage(190300))

            agg = join.withColumn('window_row', row_number().over(window_time))\
                    .withColumn(FindFrequentedLocationsEnum.TT.value, sum(col(FindFrequentedLocationsEnum.DD.value)).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.START.value, min(Movement.TIME_START.value).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.END.value, max(Movement.TIME_END.value).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.DDMAX.value, max(col(FindFrequentedLocationsEnum.DD.value)).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.DDMIN.value, min(col(FindFrequentedLocationsEnum.DD.value)).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.DDMEAN.value, mean(col(FindFrequentedLocationsEnum.DD.value)).over(window).cast(IntegerType()))\
                    .withColumn(FindFrequentedLocationsEnum.DDSTD.value, stddev(col(FindFrequentedLocationsEnum.DD.value)).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.STARTMIN.value, min(col(FindFrequentedLocationsEnum.HOUR_START.value)).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.STARTMAX.value, max(col(FindFrequentedLocationsEnum.HOUR_START.value)).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.STARTMEAN.value, mean(col(FindFrequentedLocationsEnum.HOUR_START.value)).over(window).cast(IntegerType()))\
                    .withColumn(FindFrequentedLocationsEnum.STARTSTD.value, stddev(col(FindFrequentedLocationsEnum.HOUR_START.value)).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.ENDMIN.value, min(col(FindFrequentedLocationsEnum.HOUR_END.value)).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.ENDMAX.value, max(col(FindFrequentedLocationsEnum.HOUR_END.value)).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.ENDMEAN.value, mean(col(FindFrequentedLocationsEnum.HOUR_END.value)).over(window).cast(IntegerType()))\
                    .withColumn(FindFrequentedLocationsEnum.ENDSTD.value, stddev(col(FindFrequentedLocationsEnum.HOUR_END.value)).over(window))\
                    .withColumn(FindFrequentedLocationsEnum.TD.value, max(col('window_row')).over(window))\
                    .withColumnRenamed(self.track_id, FindFrequentedLocationsEnum.TRACK_ID.value)\
                    .join(dow_filled, join.area_id == dow_filled.join_area_id, "inner")\
                    .withColumnRenamed(FindFrequentedLocationsEnum.MON.value, FindFrequentedLocationsEnum.MON_OUT.value)\
                    .withColumnRenamed(FindFrequentedLocationsEnum.TUE.value, FindFrequentedLocationsEnum.TUE_OUT.value)\
                    .withColumnRenamed(FindFrequentedLocationsEnum.WED.value, FindFrequentedLocationsEnum.WED_OUT.value)\
                    .withColumnRenamed(FindFrequentedLocationsEnum.THU.value, FindFrequentedLocationsEnum.THU_OUT.value)\
                    .withColumnRenamed(FindFrequentedLocationsEnum.FRI.value, FindFrequentedLocationsEnum.FRI_OUT.value)\
                    .withColumnRenamed(FindFrequentedLocationsEnum.SAT.value, FindFrequentedLocationsEnum.SAT_OUT.value)\
                    .withColumnRenamed(FindFrequentedLocationsEnum.SUN.value, FindFrequentedLocationsEnum.SUN_OUT.value)\
                    .where(col('window_row') == 1)\
                    .select(Movement.SHAPE.value,
                            FindFrequentedLocationsEnum.TRACK_ID.value,
                            FindFrequentedLocationsEnum.AREA_ID.value,
                            FindFrequentedLocationsEnum.TD.value,
                            FindFrequentedLocationsEnum.TT.value,
                            FindFrequentedLocationsEnum.START.value,
                            FindFrequentedLocationsEnum.END.value,
                            FindFrequentedLocationsEnum.SUN_OUT.value,
                            FindFrequentedLocationsEnum.MON_OUT.value,
                            FindFrequentedLocationsEnum.TUE_OUT.value,
                            FindFrequentedLocationsEnum.WED_OUT.value,
                            FindFrequentedLocationsEnum.THU_OUT.value,
                            FindFrequentedLocationsEnum.FRI_OUT.value,
                            FindFrequentedLocationsEnum.SAT_OUT.value,
                            FindFrequentedLocationsEnum.DDMIN.value,
                            FindFrequentedLocationsEnum.DDMAX.value,
                            FindFrequentedLocationsEnum.DDMEAN.value,
                            FindFrequentedLocationsEnum.DDSTD.value,
                            FindFrequentedLocationsEnum.STARTMIN.value,
                            FindFrequentedLocationsEnum.STARTMAX.value,
                            FindFrequentedLocationsEnum.STARTMEAN.value,
                            FindFrequentedLocationsEnum.STARTSTD.value,
                            FindFrequentedLocationsEnum.ENDMIN.value,
                            FindFrequentedLocationsEnum.ENDMAX.value,
                            FindFrequentedLocationsEnum.ENDMEAN.value,
                            FindFrequentedLocationsEnum.ENDSTD.value,
                    )

            if self.DEBUG: arcpy.AddMessage(f"agg columns: {agg.columns}")

            arcpy.AddMessage(arcpy.GetIDMessage(190257))

            agg_drop = self.drop_unused_stat_fields(agg)

            filter_df = self.filter_total_dwells(agg_drop)
            
            filter_df.write.layer(self.out_feature)

            return self.out_feature

        except InvalidPortalTokenError:
            self.logger.error(arcpy.GetIDMessage(190297))
            exit()
        
        except Exception as e:
            self.handle_movement_error(e, id_message=190393)