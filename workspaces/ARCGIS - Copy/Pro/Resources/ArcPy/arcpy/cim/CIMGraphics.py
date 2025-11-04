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

class CIMGraphic():
    """
      Represents a graphic.
    """
    def __init__(self, *args, **Kwargs):
        self.symbol = 'CIMSymbolReference'
        self.transparency = 0.0
        self.blendingMode = BlendingMode.Alpha
        self.masks = list()
        self.referenceScale = 0.0
        self.attributes = {}
        self.placement = Anchor.Unspecified
    
class CIMGraphicFrame():
    """
      Represents a graphic frame.
    """
    def __init__(self, *args, **Kwargs):
        self.backgroundSymbol = 'CIMSymbolReference'
        self.borderSymbol = 'CIMSymbolReference'
        self.shadowSymbol = 'CIMSymbolReference'
        self.backgroundGapX = 0
        self.backgroundGapY = 0
        self.backgroundCornerRounding = 0
        self.borderGapX = 0
        self.borderGapY = 0
        self.borderCornerRounding = 0
        self.shadowOffsetX = 0
        self.shadowOffsetY = 0
        self.shadowCornerRounding = 0
    
class CIMLeader():
    """
      Represents the generic base type for leaders.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMInkGraphic(CIMGraphic):
    """
      Represents an ink graphic.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.bounds = GetPythonClass('arcpy', 'Extent')
        self.inkData = str()
        self.roughSketch = GetPythonClass('arcpy', 'Polyline')
    
class CIMLeaderLine(CIMLeader):
    """
      Represents a leader line.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.line = GetPythonClass('arcpy', 'Polyline')
    
class CIMLeaderPoint(CIMLeader):
    """
      Represents a leader point.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.point = GetPythonClass('arcpy', 'Point')
    
class CIMPictureGraphic(CIMGraphic):
    """
      Represents a picture graphic.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.pictureURL = str()
        self.box = GetPythonClass('arcpy', 'Extent')
        self.frame = 'CIMGraphicFrame'
        self.sourceURL = str()
        self.referenceURI = str()
        self.shape = GetPythonClass('arcpy', 'Geometry')
    
class CIMShapeGraphic(CIMGraphic):
    """
      Represents a shape graphic, the generic base class for geometry 
      based graphics.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.name = str()
        self.popupHtmlText = str()
    
class CIMTextGraphicBase(CIMGraphic):
    """
      Represents a text graphic base class, the generic base class for 
      text based graphics.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.text = str()
        self.shape = GetPythonClass('arcpy', 'Geometry')
        self.leaders = []
    
class CIMLineGraphic(CIMShapeGraphic):
    """
      Represents a line graphic.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.line = GetPythonClass('arcpy', 'Polyline')
    
class CIMMultiPatchGraphic(CIMShapeGraphic):
    """
      Represents a shape graphic with a MultiPatch geometry.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.multiPatch = object()
    
class CIMMultipointGraphic(CIMShapeGraphic):
    """
      Represents a shape graphic with a Multipoint geometry.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.multipoint = GetPythonClass('arcpy', 'Multipoint')
    
class CIMParagraphTextGraphic(CIMTextGraphicBase):
    """
      Represents a paragraph text graphic.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.frame = 'CIMGraphicFrame'
        self.columnCount = 1
        self.columnGap = 5.0
        self.margin = 0.0
    
class CIMPointGraphic(CIMShapeGraphic):
    """
      Represents a point graphic.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.location = GetPythonClass('arcpy', 'Point')
        self.leaders = []
    
class CIMPolygonGraphic(CIMShapeGraphic):
    """
      Represents a polygon graphic.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.polygon = GetPythonClass('arcpy', 'Polygon')
    
class CIMTextGraphic(CIMTextGraphicBase):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
