from __future__ import annotations

from abc import ABCMeta, abstractmethod
from typing import Dict, Any

class IParameterValidation(metaclass=ABCMeta):
    
    @abstractmethod
    def validate_output_name(self, name: str) -> str:
        ...

    @abstractmethod
    def validate_time_enablement(self, parameter: Dict[str, Any]) -> bool:
        ...

    @abstractmethod
    def validate_input_source(self, parameter: Dict[str, Any]) -> bool:
        ...

    @abstractmethod
    def validate_output_workspace(self, workspace: str) -> bool:
        ...

    @abstractmethod
    def validate_non_zero_value(self, parameter: str) -> bool:
        ...

