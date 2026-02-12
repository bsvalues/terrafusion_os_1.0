'''
------------------------------------------------------------------------------
Movement.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.7, Python 3.7
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2020-09-14 - jjones - original writeup
* 2020-12-03 - jjones - reorganized into intel Subfolders, fixed relative imports
------------------------------------------------------------------------------
'''
from __future__ import annotations
from dataclasses import dataclass

StyleJSON = str

@dataclass(frozen=True)
class FindMeetingLocationResult:
    """Class for simplifying the return object for the Find Meeting Locations Geoprocessing tool."""
    point_features: str | None
    area_features: str | None
    empty_output: bool
    point_style: StyleJSON | None
    area_style: StyleJSON | None

@dataclass
class FindCotravelerResult:
    features: str
    apply_style: bool
    style: StyleJSON
    summary_table: str
