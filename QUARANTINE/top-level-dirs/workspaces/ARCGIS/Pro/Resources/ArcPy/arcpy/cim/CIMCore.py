"""
    COPYRIGHT 2013-2019 ESRI
    
    TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
    Unpublished material - all rights reserved under the
    Copyright Laws of the United States.
    
    For additional information, contact:
    Environmental Systems Research Institute, Inc.
    Attn: Contracts Dept
    380 New York Street
    Redlands, California, USA 92373
    
    email: contracts@esri.com
"""
#Cartographic Information Model generated file - do not modify
from .CIMEnum import *
from .CIMExternal import *
from .ArcpyHelper import GetPythonClass

class CIMDefinition():
    """
      Represents the base class for definitions.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.uRI = str()
        self.sourceURI = str()
        self.sourceModifiedTime = GetPythonClass('datetime', 'datetime')
        self.metadataURI = str()
        self.useSourceMetadata = True
        self.sourcePortalUrl = str()
    
class CIMPortalItem():
    """
      Represents a reference to a portal item.
    """
    def __init__(self, *args, **Kwargs):
        self.portalURL = str()
        self.itemID = str()
    
