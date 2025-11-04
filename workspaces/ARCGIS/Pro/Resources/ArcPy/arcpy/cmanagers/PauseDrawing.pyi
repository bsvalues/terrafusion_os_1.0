from enum import Flag
from types import TracebackType
from typing import Any

__all__ = [
    "PauseDrawing",
    "ViewContext",
]

class ViewContext(Flag):
    maps = ...
    layouts = ...
    maps_and_layouts = ...

class PauseDrawing:
    context: ViewContext
    maps: list[Any]
    layouts: list[Any]
    def __init__(self) -> None: ...
    def fall_back_method(self, context: Any) -> None: ...
    def redirect_call(self, method_name: str) -> Any: ...
    def __enter__(self) -> None: ...
    def __exit__(
        self,
        exc_type: type[BaseException],
        exc_val: BaseException,
        exc_tb: TracebackType | None,
    ) -> bool: ...
