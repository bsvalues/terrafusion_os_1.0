'''
------------------------------------------------------------------------------
Conversion.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.8, Python 3.7
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2021-02-23 - jjones - original writeup
* 2024-05-30 - mfunk - add EasyRPFImport output dataclass
------------------------------------------------------------------------------
'''

from dataclasses import dataclass
from typing import Optional

@dataclass
class CreateLocationFileResult:
    location_file: Optional[str]
    empty_output: bool
    error: bool
    error_message: Optional[str]

@dataclass
class EasyRPFImportResult:
    output_mosaics: dict[str,str]
    error: bool
    error_message: Optional[str]
