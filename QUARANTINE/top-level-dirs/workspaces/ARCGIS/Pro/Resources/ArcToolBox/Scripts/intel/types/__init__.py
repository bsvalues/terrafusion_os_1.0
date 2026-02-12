from pandas import DataFrame as PandasDataFrame

from typing import Dict, List

from intel.types.pyspark.sql.dataframes import DataFrame as SparkDataFrame
from intel.types.pyspark.sql.column import Column
from intel.types.pyspark.context import SparkContext
from intel.types.pyspark.sql.window import Window as SparkWindow
from intel.types.pyspark.sql.types import StructType

TimeDifferenceList = List[float]
StyleJSON = Dict[str, float]
ConditionsResult = str
PySparkSchema = str
CoordinateColumnDict = Dict[str, Dict[str, str]]

class TrackDataFrame(SparkDataFrame):
    pass

