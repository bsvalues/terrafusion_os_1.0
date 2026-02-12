# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
intelValidation.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.7, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2020-07-28 - jjones - Initial creation
------------------------------------------------------------------------------
'''

import arcpy
import json
import os
import re

from intel.errors import TimeEnablementError

def validate_input_geometry(input_feature_class: str, shape_type: str) -> bool:
    """Validates the input feature class geometry type.  This allows for a quick check
    prior to main code execution.

    Args:
        input_feature_class (str, optional): The feature class of which geometry will be checked. Defaults to None.
        shape_type (str, optional): The desired geometry to be checked against. Defaults to None.

    Raises:
        TypeError: Invalid geometry presented.

    Returns:
        bool: Returns True if geometries match
    """

    geometry = arcpy.Describe(input_feature_class).shapeType

    if geometry == shape_type:
        return True

    else:
        raise TypeError

def validate_input_coordinate(input_coordinate_type: str,
                                input_coordinate_string: str) -> bool:
    regex = ''
    if input_coordinate_type == "MGRS" or input_coordinate_type == "USNG":
        regex = r"^\s*(?P<gzd>\d{1,2}[c-hj-np-xC-HJ-NP-X])[-,;:\s]*(?P<gs1>[a-hj-np-zA-HJ-NP-Z]{1})(?P<gs2>[a-hj-np-vA-HJ-NP-V]{1})[-,;:\s]*(?P<numlocation>\d{0,10})[-,;:\s]*(?P<numlocation2>\d{0,10})\s*"
    elif input_coordinate_type == "DD(long/lat)":
        regex = r"^((?P<firstPrefix>[EeWw\+-])?(?P<longitude>[0]?\d?\d([.]\d*)?|1[0-7]\d([.]\d*)?|180([.]0*)?)([°˚º^~*]*)(?P<firstSuffix>[EeWw\+-])?)([,:;\s|\/\\]+)((?P<lastPrefix>[NnSs\+-])?(?P<latitude>[0-8]?\d([.]\d*)?|90([.]0*)?)([°˚º^~*]*)(?P<lastSuffix>[NnSs\+-])?[\s]*)$"
    elif input_coordinate_type == "DD(lat/long)":
        regex = r"^((?P<firstPrefix>[NnSs\+-])?(?P<latitude>[0-8]?\d([.]\d*)?|90([.]0*)?)([°˚º^~*]*)(?P<firstSuffix>[NnSs\+-])?)([,:;\s|\/\\]+)((?P<lastPrefix>[EeWw\+-])?(?P<longitude>[0]?\d?\d([.]\d*)?|1[0-7]\d([.]\d*)?|180([.]0*)?)([°˚º^~*]*)(?P<lastSuffix>[EeWw\+-])?[\s]*)$"
    elif input_coordinate_type == "DMS(long/lat)":
        regex = r"^((?P<firstPrefix>[\+\-EeWw])?(?P<longitudeD>[0]?\d?\d|1[0-7]\d|180)[°˚º^~*\s\-_]+(?P<longitudeM>[0-5]\d|\d)['′\s\-_]+(?P<longitudeS>([0-5]?\d|\d)([.,:]\d*)?)[\u0022\u00A8\u02DD\s_]*(?P<firstSuffix>[\+\-EeWw])?)([,:;\s|\/\\]+)((?P<lastPrefix>[\+\-NnSs])?(?P<latitudeD>[0-8]\d?)[°˚º^~*\s\-_]+(?P<latitudeM>[0-5]?\d|\d)['′\s\-_]+(?P<latitudeS>([0-5]?\d|\d)([.,:]\d*)?)[\u0022\u00A8\u02DD\s_]*(?P<lastSuffix>[\+\-NnSs])?)[\s]*$"
    elif input_coordinate_type == "DMS(lat/long)":
        regex = r"^((?P<firstPrefix>[\+\-NnSs])?(?P<latitudeD>[0-8]?\d|90)[°˚º^~*\s\-_]+(?P<latitudeM>[0-5]?\d|\d)['′\s\-_]+(?P<latitudeS>([0-5]?\d|\d)([.,:]\d*)?)[\u0022\u00A8\u02DD\s_]*(?P<firstSuffix>[\+\-NnSs])?)([,:;\s|\/\\]+)((?P<lastPrefix>[\+\-EeWw])?(?P<longitudeD>[0]?\d?\d|1[0-7]\d|180)[°˚º^~*\s\-_]+(?P<longitudeM>[0-5]\d|\d)['′\s\-_]+(?P<longitudeS>([0-5]?\d|\d)([.,:]\d*)?)[\u0022\u00A8\u02DD\s_]*(?P<lastSuffix>[\+\-EeWw])?)[\s]*$"
    elif input_coordinate_type == "DDM(long/lat)":
        regex = r"^((?P<firstPrefix>[\+\-EeWw])?(?P<longitudeD>[0]?\d?\d|1[0-7]\d|180)[°˚º^~*\s\-_]+(?P<longitudeM>([0-5]\d|\d)([.]\d*)?)['′\s_]*(?P<firstSuffix>[\+\-EeWw])?)([:;,\s|\/\\]+)((?P<lastPrefix>[\+\-NnSs])?(?P<latitudeD>[0-8]?\d|90)[°˚º^~*\s\-_]+(?P<latitudeM>([0-5]?\d|\d)([.]\d*)?)['′\s_]*(?P<lastSuffix>[\+\-NnSs])?)[\s]*$"
    elif input_coordinate_type == "DDM(lat/long)":
        regex = r"^((?P<firstPrefix>[\+\-NnSs])?(?P<latitudeD>[0-8]?\d|90)[°˚º^~*\s\-_]+(?P<latitudeM>([0-5]?\d|\d)([.,:]\d*)?)['′\s_]*(?P<firstSuffix>[\+\-NnSs])?)([,:;\s|\/\\]+)((?P<lastPrefix>[\+\-EeWw])?(?P<longitudeD>[0]?\d?\d|1[0-7]\d|180)[°˚º^~*\s\-_]+(?P<longitudeM>([0-5]\d|\d)([.,:]\d*)?)['′\s_]*(?P<lastSuffix>[\+\-EeWw])?)[\s]*$"
    elif input_coordinate_type == "UTM":
        regex = r"^\s*(?P<zone>\d{1,2})(?P<band>[A-HJ-NP-Z]?)[\s]*(?P<easting>\d{1,9})[\s]*(?P<northing>\d{1,9})[\s]*"
    expression = re.compile(regex)

    m = expression.fullmatch(input_coordinate_string)
    if m is None:
        raise ValueError
    else:
        return True

def validate_time_enablement(input_feature_class: str) -> bool:
    desc = arcpy.Describe(input_feature_class)
    if not hasattr(desc, "startTimeField") and desc.dataType != 'BDFeatureClass':
        raise TimeEnablementError

    if desc.dataType != 'BDFeatureClass':
        time_field = desc.startTimeField

        if len(time_field) < 1:
            raise TimeEnablementError
        else:
            return True
    else:
        bdc_path = os.path.split(input_feature_class)
        with open(bdc_path[0], 'r') as bdcfile:
            bdc_properties = json.loads(bdcfile.read())
            dataset = [ds for ds in bdc_properties["datasets"] if ds["alias"] == bdc_path[1]]
            try:
                dataset[0]["time"]["fields"][0]["name"]
            except:
                raise TimeEnablementError