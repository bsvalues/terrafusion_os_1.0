# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
MobilityUtilities.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2020-12-03 - jjones - split is_point_inside_surface to separate MobilityUtilities file to allow for testing of method.
------------------------------------------------------------------------------
'''

import arcpy

def is_point_inside_surface(points, surface) -> bool:
    """_is_point_inside_surface

    returns boolean of points are within raster extent (True)  or not (False)

    :param points: Input Point Feature Layer
    :type points: FeatureLayer
    :param surface: Input Raster layer
    :type surface: RasterLayer
    :return: Points contained in Raster
    :rtype: Boolean
    """
    is_inside = False
    point_list = [arcpy.Point(row[0], row[1]) for row in arcpy.da.SearchCursor(points, ["SHAPE@X", "SHAPE@Y"])]
    multipoint = arcpy.Multipoint(arcpy.Array(point_list))
    raster_ext = arcpy.Describe(surface).extent
    is_inside = raster_ext.contains(multipoint)
    return is_inside