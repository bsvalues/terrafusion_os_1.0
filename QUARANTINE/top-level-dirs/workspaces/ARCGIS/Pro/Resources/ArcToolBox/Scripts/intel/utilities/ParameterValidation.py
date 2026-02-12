import arcpy
import os

from typing import Dict, Any
from intel.utilities.interfaces.IParameterValidation import IParameterValidation

class ParameterValidation(IParameterValidation):
    
    @staticmethod
    def create_unique_name_in_workspace(base_name: str, workspace: str) -> str:
        """ Creates a unique name in the specified workspace by appending a number
        to the base name. The number is increased until the name is unique. """

        unique_name = base_name
        i = 1
        while arcpy.Exists(os.path.join(workspace, unique_name)):
            unique_name = '{}_{}'.format(base_name, i)
            i = i + 1
        else:
            return unique_name

    def validate_output_name(self, name: str) -> str:
        dirname, filename = os.path.split(name)
        
        outname: str = arcpy.ValidateTableName(filename, dirname)

        unique_name = self.create_unique_name_in_workspace(base_name=outname, workspace=dirname)

        return unique_name

    def validate_time_enablement(self, parameter: Dict[str, Any]) -> bool:
        ...

    def validate_output_workspace(self, workspace: str) -> bool:
        ...

    def validate_non_zero_value(self, parameter: str) -> bool:
        ...

    def validate_input_source(self, parameter: Dict[str, Any]) -> bool:
        ...