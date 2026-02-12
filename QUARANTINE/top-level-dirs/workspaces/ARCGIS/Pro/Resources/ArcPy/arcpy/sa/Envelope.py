#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

"""
Contains the implementation of the Envelope class.
"""

import arcpy


__all__ = ["Envelope", "Extent", "Rectangle"]


class Extent(arcpy.Extent):
    """Extent(XMin, YMin, XMax, YMax)

    Create an Extent object.
    Derives from arcpy.Extent.


    Arguments:
    XMin -- Minimum x coordinate
    YMin -- Minimum y coordinate
    XMax -- Maximum x coordinate
    YMax -- Maximum y coordinate
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::", "Double:::"]

    def __init__(self, XMin, YMin, XMax, YMax):
        arcpy.Extent.__init__(self, XMin, YMin, XMax, YMax)


Rectangle = Extent
Envelope = Extent
