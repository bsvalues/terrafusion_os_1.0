from __future__ import annotations

from abc import ABCMeta, abstractclassmethod

class ILogger(metaclass=ABCMeta):

    @abstractclassmethod
    def create_logger(self, name: str) -> None:
        ...
    
    @classmethod
    @abstractclassmethod
    def debug(cls, msg: str) -> None:
        ...

    @classmethod
    @abstractclassmethod
    def warning(cls, msg: str) -> None:
        ...

    @classmethod
    @abstractclassmethod
    def error(cls, msg: str) -> None:
        ...