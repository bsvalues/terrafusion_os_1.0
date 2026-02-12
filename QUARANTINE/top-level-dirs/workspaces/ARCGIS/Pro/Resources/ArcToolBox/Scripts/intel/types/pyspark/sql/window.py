# Stubs for pyspark.sql.window (Python 3.5)
#
from __future__ import annotations

JavaObject: str
SQLContext: str

ColumnOrName: Column | str

class Column:
    pass

class Window:
    unboundedPreceding: int
    unboundedFollowing: int
    currentRow: int
    @staticmethod
    def partitionBy(*cols: ColumnOrName) -> WindowSpec: ...
    @staticmethod
    def orderBy(*cols: ColumnOrName) -> WindowSpec: ...
    @staticmethod
    def rowsBetween(start: int, end: int) -> WindowSpec: ...
    @staticmethod
    def rangeBetween(start: int, end: int) -> WindowSpec: ...

class WindowSpec:
    def __init__(self, jspec: JavaObject) -> None: ...
    def partitionBy(self, *cols: ColumnOrName) -> WindowSpec: ...
    def orderBy(self, *cols: ColumnOrName) -> WindowSpec: ...
    def rowsBetween(self, start: int, end: int) -> WindowSpec: ...
    def rangeBetween(self, start: int, end: int) -> WindowSpec: ...
