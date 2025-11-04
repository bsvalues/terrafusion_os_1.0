#COPYRIGHT 2020 ESRI
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
"Geocodex Module"

__all__ = ["Locator", ]
from arcgisscripting import geocodingx as _geox

class Locator(_geox.Locator):
    __slots__ = ()
    def __init__(self, path):
        super().__init__(path)

