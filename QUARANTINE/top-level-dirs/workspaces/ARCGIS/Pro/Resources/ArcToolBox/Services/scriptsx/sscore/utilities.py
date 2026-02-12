"""---------------------------------------------------------------------------
Name:              utilities.py
Purpose:           Store all the utilities functions for Spatial Stats tool
Author:            Esri Inc.
Created:           6/9/2022
Copyright:   (c)   Esri, Inc. 2022
---------------------------------------------------------------------------"""
from typing import Union
import arcpy as ARCPY
from common import AOLUtils, MsgCategory


DISTANCE_UNIT_INFO = {
    "METER": ("Meters", 1.0),
    "METERS": ("Meters", 1.0),
    "FOOT": ("Feet", 0.3048),
    "FEET": ("Feet", 0.3048),
    "FOOT_US": ("US_Feet", 0.3048006096012192),
    "US_FOOT": ("US_Feet", 0.3048006096012192),
    "US_FEET": ("US_Feet", 0.3048006096012192),
    "MILE_US": ("US Miles", 1609.347218694438),
    "US_MILES": ("US Miles", 1609.347218694438),
    "US_MILE": ("US Miles", 1609.347218694438),
    "MILES": ("Miles", 1609.347218694438),
    "MILE": ("Miles", 1609.347218694438),
    "KILOMETER": ("Kilometers", 1000.0),
    "KILOMETERS": ("Kilometers", 1000.0)
}

SUPPORTED_NUMERIC_TYPES = ["Integer", "Double", "Single", "SmallInteger", "BigInteger"]


def duplicate_reserved_fields(dataset, fields_to_check):
    """
    When copy in the AGOL environment, the reserved field will be removed. This function will check those essential
    Fields and duplicate them in the output.
    :param dataset: str, the input dataset
    :param fields_to_check: list, the list of fields to check
    :return: dict, the duplicated fields
    """
    RESERVED_FIELDS = ["SHAPE_LENGTH", "SHAPE__LENGTH", "SHAPE_AREA", "SHAPE__AREA"]
    FNMAP = {
        "SHAPE__LENGTH": "SHAPE_LENGTH",
        "SHAPE__AREA": "SHAPE_AREA",
    }

    info = AOLUtils.describe(dataset)
    duplicated_field = {}
    for f in fields_to_check:
        if f.upper() in RESERVED_FIELDS and f.upper() not in duplicated_field:
            fn = f + "_"
            duplicated_field[f.upper()] = fn

            tar_field = None
            for field in info.fields:
                if field.name.upper() == f.upper():
                    tar_field = field
                    break
            if not tar_field and f.upper() in FNMAP:
                for field in info.fields:
                    if field.name.upper() == FNMAP[f.upper()]:
                        tar_field = field
                        break
            if tar_field:
                ARCPY.AddField_management(dataset, fn, tar_field.type, field_alias=tar_field.aliasName)
                ARCPY.CalculateField_management(dataset, fn, f"!{tar_field.name}!", "PYTHON_9.3")
    
    for f in fields_to_check:
        if f.upper() not in duplicated_field:
            duplicated_field[f.upper()] = f

    return duplicated_field


def densify_features(feature_class: Union[str, ARCPY.FeatureSet, ARCPY.RecordSet], workspace: str):
    """
    Adds vertices along line or polygon features and replaces curve segments
    (Bezier, circular arcs, and elliptical arcs) with line segments.
    :param feature_class: input feature class
    :param workspace: the output workspace
    :return:
    """
    out_densify = ARCPY.CreateScratchName('densify_', workspace=workspace)
    ARCPY.CopyFeatures_management(feature_class, out_densify)
    ARCPY.Densify_edit(out_densify, "DISTANCE", "10 Kilometers")
    return out_densify
