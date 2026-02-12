# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
intelUtilities.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 9/3/2015   - mfunk - Created utilities.py to centralize common tool functions
* 9/14/2017  - mfunk - Update for resetLayerPaths
* 10/18/2018 - elinz - Copied module from Military Tools for ArcGIS; changed
                       function names and variable names based on PEP 8
                       style guide.
* 2019-05-14 - mfunk - hide Collapse Features tool -- comment out entire file
* 2019-09-06 - mfunk - change module name to IntelUtilities.py for Pro Integration
* 2020-01-13 - mfunk - module name change for 'intel'
* 2020-01-28 - jjones - added additional Class Intel Utilities with the following methods: validate_geometry, validate_workspace_type, and addToMap
* 2022-10-14 - mfunk - update for AllSource
------------------------------------------------------------------------------
'''

import sys
import arcpy
import traceback
import uuid

from typing import List

from intel.enumerations import ArcGISProLicenseEnum

PLATFORM_ALLSOURCE = 'ARCGIS_ALLSOURCE'
PLATFORM_PRO = 'ARCGIS_PRO'
PLATFORM_DESKTOP = 'ARCMAP'
PLATFORM_OTHER = 'OTHER'
PLATFORM_NOT_SET = 'NOT_SET'

platform = None
app_found = PLATFORM_NOT_SET

# Mobility Least Cost Path properties
handle_zeros_list = ['SMALL_POSITIVE', 'NO_DATA']

# Common spatial references
SR_GCS_WGS_1984 = arcpy.SpatialReference(4326)  # Geographic - WGS 1984
SR_WEB_MERCATOR = arcpy.SpatialReference(102100)  # Projected - Web Mercator Auxilary Sphere
SR_W_AZ_ED = arcpy.SpatialReference(54032)  # Projected - World Azimuthal Equidistant

# Returns Pro or ArcMap only
def get_platform():

    global platform

    if platform is None:

        platform = PLATFORM_NOT_SET

        install_info = arcpy.GetInstallInfo()
        if install_info['ProductName'] == 'ArcGISPro':
            platform = PLATFORM_PRO
        if install_info['ProductName'] == 'ArcGISAllSource':
            platform = PLATFORM_ALLSOURCE

    return platform


# Returns Pro or ArcMap if running in application (where arcpy.mapping or arcpy.mp present)
# and Other if in stand-alone arcpy
def get_application():
    '''Return app environment as: ARCMAP, ARCGIS_PRO, OTHER'''

    global app_found
    if app_found != PLATFORM_NOT_SET:
        return app_found

    try:
        from arcpy import mp
    except ImportError:
        try:
            from arcpy import mapping
            mxd = arcpy.mapping.MapDocument('CURRENT')
            app_found = PLATFORM_DESKTOP
            return app_found
        except Exception:
            app_found = PLATFORM_OTHER
            return app_found
    try:
        aprx = arcpy.mp.ArcGISProject('CURRENT')
        # Intel 3219: both AllSource and Pro will use arcpy.mp so default to
        # get_platform to figure out which one
        app_found = get_platform()
        return app_found
    except Exception:
        app_found = PLATFORM_OTHER
        return app_found


def getLicenseLevel():
    """getLicenseLevel Return license level of running Pro environment

    Return the ArcGISProLicenseEnum value of the current running ArcGIS
    Pro environment.

    :return: license level enumeration
    :rtype: ArcGISProLicenseEnum
    """
    ll = arcpy.GetInstallInfo()['LicenseLevel']
    if ll == ArcGISProLicenseEnum.Standard.value:
        return ArcGISProLicenseEnum.Standard
    elif ll == ArcGISProLicenseEnum.Advanced.value:
        return ArcGISProLicenseEnum.Advanced
    else:
        return ArcGISProLicenseEnum.Basic


def create_scratch_geodatabase():
    '''
    Create a temporary file geodatabase for scratch work.

    The resulting geodatabase and it's parent folder must be deleted.
    These will not be removed automatically.

    returns:
    out_path (string) - path to created file geodatabase
    '''

    from tempfile import mkdtemp
    parent_directory = mkdtemp()
    geodatabase_name = f"{uuid.uuid4()}.gdb"
    out_path = arcpy.CreateFileGDB_management(out_folder_path=parent_directory,
                                              out_name=geodatabase_name,
                                              out_version="CURRENT")
    return out_path.getOutput(0)


def selectUTMZone(longitude, latitude):
    '''
    return UTM/UPS Zone spatial reference based on longitude and latitude
    * Datum is GCS_WGS_1984

    Melita Kennedy (mkennedy) & whuber (whuber) "Answer to question 'Computing UTM Zone from lat/long point?'"
    https://gis.stackexchange.com/a/13292. August 9 2011. Accessed 2017-01-24

    Inputs:
    longitude: latitude (assume GCS WGS 1984) of UTM zone
    latitude: longitude (assume GCS WGS 1984) of UTM zone
    Output:
    targetSpatialReference: Spatial Reference object of UTM zone of input lon/lat.
    '''
    import math
    try:
        targetSpatialReference = None
        if latitude > 84.0:
            # arcpy.AddMessage("Area above 84.0 degrees within North polar zone. Using Universal Polar Stereographic North projection.")
            arcpy.AddMessage(arcpy.GetIDMessage(190030))
            srName = "UPS North"
        elif latitude < -80.0:
            # arcpy.AddMessage("Area below -80.0 degrees within South polar zone. Using Universal Polar Stereographic South projection.")
            arcpy.AddMessage(arcpy.GetIDMessage(190031))
            srName = "UPS South"
        else:
            z = None
            hemisphere = "N"
            if latitude < 0.0:
                hemisphere = "S"
            if (latitude >= 56.0 and latitude < 64.0 and longitude >= 3.0 and longitude < 12.0):
                z = 32
            elif (latitude >= 72.0 and latitude < 84.0):
                if (longitude >= 0.0 and longitude < 9.0):
                    z = 31
                elif (longitude >= 9.0 and longitude < 21.0):
                    z = 33
                elif (longitude >= 21.0 and longitude < 33.0):
                    z = 35
                elif (longitude >= 33.0 and longitude < 42.0):
                    z = 37
            else:
                z = int(math.floor((longitude + 180.0)/6.0) + 1)
            if longitude < -126:
                srName = "WGS 1984 UTM Zone {0:2}{1}".format(z, hemisphere)
            else:
                srName = srName = "WGS 1984 UTM Zone {0}{1}".format(z, hemisphere)

        # arcpy.AddMessage("Using {0} for {1},{2}.".format(srName, longitude, latitude))
        arcpy.AddMessage(arcpy.GetIDMessage(190032).format(srName, longitude, latitude))
        targetSpatialReference = arcpy.SpatialReference(srName)
        return targetSpatialReference
    except Exception:
        tb = sys.exc_info()[2]
        tbinfo = traceback.format_tb(tb)[0]
        pymsg = "{}:\n{}\n{}".format(tbinfo,
                                        str(sys.exc_info()[1]),
                                        arcpy.GetMessages(2))
        arcpy.AddError(pymsg)


def generateCenteredWorldAzimuthalEquidistant(center_longitude: float,
                                              center_latitude: float) -> arcpy.SpatialReference:
    """generateCenteredWorldAzimuthalEquidistant Generate localized World Azimuthal Equidistant (WAZED)

    Generate a localized World Azimuthal Equidistant coordinate system based on a
    center latitude and longitude. This is a good option for large area datasets that
    are too big for UTM and may cover several UTM zones.

    - Wikipedia Azimuthal Equidistant Projection: https://en.wikipedia.org/wiki/Azimuthal_equidistant_projection
    - ArcGIS Desktop Azimuthal equidistant: https://desktop.arcgis.com/en/arcmap/latest/map/projections/azimuthal-equidistant.htm

    :param center_longitude: longitude of center
    :type center_longitude: float
    :param center_latitude: latitude of center
    :type center_latitude: float
    :return: Localized World Azimuthal Equidistant
    :rtype: arcpy.SpatialReference
    """
    import re

    modified_WAZED: arcpy.SpatialReference = arcpy.SpatialReference()

    # get World Azimuthal Equidistant def as string
    strAZED = arcpy.SpatialReference(54032).exportToString()

    # at Pro 2.8 I am unable to modify WAZED's Latitude of Origin.
    # Leaving this mod and text equivalent until resolution from GP.

    # modify parameters
    # strAZED = re.sub('PARAMETER\[\'Central_Meridian\'\,.+?]',
    #                  'PARAMETER[\'Central_Meridian\',{0}]'.format(str(center_longitude)),
    #                  strAZED)
    # strAZED = re.sub('PARAMETER\[\'Latitude_Of_Origin\'\,.+?]',
    #                  'PARAMETER[\'Latitude_Of_Origin\',{0}]'.format(str(center_latitude)),
    #                  strAZED)

    if strAZED.find(',PARAMETER["Central_Meridian",0.0],') != -1:
        strAZED = strAZED.replace(r',PARAMETER["Central_Meridian",0.0],',
                                  f',PARAMETER["Central_Meridian",{center_longitude}],')

    if strAZED.find(',PARAMETER["Latitude_Of_Origin",0.0],') != -1:
        strAZED = strAZED.replace(r',PARAMETER["Latitude_Of_Origin",0.0],',
                                  f',PARAMETER["Latitude_Of_Origin",{center_latitude}],')

    modified_WAZED.loadFromString(strAZED)
    return modified_WAZED


def validate_geometry(feature_class: str | None = None) -> str:
    """Describes the geometry of the input feature class and returns the value as a string.

    Keyword Arguments:
        feature_class {str} -- The path to the input feature class the determine geometry.

    Returns:
        Shape Type {str} -- String value representing the geometry type of the input feature class.
    """

    try:
        desc = arcpy.Describe(feature_class)
        return desc.shapeType
    except Exception:
        # Error handling, returns necessary error information for debugging/troubleshooting
        tb = sys.exc_info()[2]
        tbinfo = traceback.format_tb(tb)[0]
        pymsg = "{}:\n{}\n{}".format(tbinfo,
                                        str(sys.exc_info()[1]),
                                        arcpy.GetMessages(2))
        arcpy.AddError(pymsg)


def addToMap(features=None, theMap=None):
    """Method to add features to the map

    Keyword Arguments:
        features {ArcGIS feature layer} -- an ArcGIS Feature Layer that needs to be added to the displayed map
        theMap {ArcGIS Pro map} -- an ArcGIS Pro map the the features input will be added
    """
    try:
        # Adds data to map
        theMap.addDataFromPath(features)

    except Exception:
        # Error handling, returns necessary error information for debugging/troubleshooting
        tb = sys.exc_info()[2]
        tbinfo = traceback.format_tb(tb)[0]
        pymsg = "{}:\n{}\n{}".format(tbinfo,
                                        str(sys.exc_info()[1]),
                                        arcpy.GetMessages(2))
        arcpy.AddError(pymsg)


def create_temp_table_name(workspace: str=None) -> str:
    """Takes an input workspace and generates a valid table name.  Returns a valid fully qualified path for the table.

    Keyword Arguments:
        workspace {str} -- The output workspace that the user would like to create the table.

    Returns:
        {String} -- The fully qualified path (when possible) of the table.
    """
    import os

    # Creates a UUID based on the host ID and current time.
    # Converts the UUID to a string
    base_name = str(uuid.uuid1())

    # Validates the table name against the user defined workspace.
    out_fc = arcpy.ValidateTableName(base_name, workspace)

    # Build fully qualified path (when possible)
    if workspace is not None:
        out_full_path = os.path.join(workspace, out_fc)
    else:
        if arcpy.env.workspace is not None:
            out_full_path = os.path.join(arcpy.env.workspace, out_fc)
        else:
            out_full_path = out_fc

    # Returns that valid fully qualified path for the output feature class or table.
    return out_full_path


def create_temp_workspace() -> str:
    """Creates a temporary workspace with a validated temporary feature class.

    Returns:
        [str]: Fully qualified path of the temporary workspace.
    """

    import tempfile
    import os

    tempdir = tempfile.TemporaryDirectory()
    workspace_name = str(uuid.uuid1())

    arcpy.CreateFileGDB_management(tempdir, workspace_name)

    return os.path.join(tempdir, workspace_name)


def get_active_map_spatial_reference(self):
    """get_active_map_spatial_reference

    Gets the spatial reference of the active map in the current project.
    Returns None and shows warning if no active map or project.

    NOTE: spatial reference could be Unknown

    :return: Returns an arcpy SpatialReference or None
    :rtype: SpatialReference object or None
    """
    aprx = arcpy.mp.ArcGISProject(r"CURRENT")
    if aprx:
        activeMap = aprx.activeMap
        if activeMap:
            return activeMap.defaultCamera.extent.spatial_reference
        else:
            # No active map. Cannot get spatial reference.
            arcpy.AddWarning(arcpy.GetIDMessage(190033))
            return None
    else:
        # No active Project.
        arcpy.AddWarning(arcpy.GetIDMessage(190034))
        return None


def order_oid_list(input_list: List[int]) -> List[int]:
    list_of_sorted_lists = [sorted(item) for item in input_list]
    ordered_list = sorted([sorted(item) for n,item in enumerate(list_of_sorted_lists) if item not in list_of_sorted_lists[:n]])
    return ordered_list