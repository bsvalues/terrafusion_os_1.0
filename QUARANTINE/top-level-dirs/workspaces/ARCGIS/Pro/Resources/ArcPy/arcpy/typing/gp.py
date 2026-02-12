from arcpy.arcobjects import Result
from typing import Generic, TypeVar, Literal, overload, Any

__all__ = [
    "Result",
    "Result1",
    "Result2",
    "Result3",
]

T = TypeVar("T")
U = TypeVar("U")
V = TypeVar("V")


class Result1(Result, Generic[T]):
    @overload  # type: ignore[override]
    def __getitem__(self, key: Literal[0, -1]) -> T:
        ...

    @overload
    def __getitem__(self, key: str) -> T:
        ...

    def __getitem__(self, key: int | str | slice) -> Any:
        ...


class Result2(Result, Generic[T, U]):
    @overload  # type: ignore[override]
    def __getitem__(self, key: Literal[0, -2]) -> T:
        ...

    @overload
    def __getitem__(self, key: Literal[1, -1]) -> U:
        ...

    @overload
    def __getitem__(self, key: str) -> T | U:
        ...

    def __getitem__(self, key: int | str | slice) -> Any:
        ...


class Result3(Result, Generic[T, U, V]):
    @overload  # type: ignore[override]
    def __getitem__(self, key: Literal[0, -3]) -> T:
        ...

    @overload
    def __getitem__(self, key: Literal[1, -2]) -> U:
        ...

    @overload
    def __getitem__(self, key: Literal[2, -1]) -> V:
        ...

    @overload
    def __getitem__(self, key: str) -> T | U | V:
        ...

    def __getitem__(self, key: int | str | slice) -> Any:
        ...
