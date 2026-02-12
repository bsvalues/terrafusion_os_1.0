from __future__ import annotations

from typing import (
    Any,
    List,
    Optional,
    Tuple,
    TypeVar,
    Union,
)
from typing_extensions import Protocol

import datetime
import decimal

from intel.types.pyspark._typing import PrimitiveType
import intel.types.pyspark.sql.column
import intel.types.pyspark.sql.types
from intel.types.pyspark.sql.column import Column


class DataFrameLike:
    pass

class SeriesLike:
    pass

class AtomicType:
    pass

class Row:
    pass

import pandas.core.frame  # type: ignore[import]
import pandas.core.series  # type: ignore[import]

ColumnOrName: Union[Column, str]
DecimalLiteral: decimal.Decimal
DateTimeLiteral: Union[datetime.datetime, datetime.date]
LiteralType: str | int | float
AtomicDataTypeOrString: Union[AtomicType, str]
DataTypeOrString: Union[intel.types.pyspark.sql.types.DataType, str]
OptionalPrimitiveType: Optional[PrimitiveType]

RowLike = TypeVar("RowLike", List[Any], Tuple[Any, ...], Row)

class SupportsOpen(Protocol):
    def open(self, partition_id: int, epoch_id: int) -> bool: ...

class SupportsProcess(Protocol):
    def process(self, row: intel.types.pyspark.sql.types.Row) -> None: ...

class SupportsClose(Protocol):
    def close(self, error: Exception) -> None: ...

class UserDefinedFunctionLike(Protocol):
    def __call__(self, *_: ColumnOrName) -> Column: ...