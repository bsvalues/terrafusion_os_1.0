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

class CIMMediaInfo():
    """
      Represents media info.
    """
    def __init__(self, *args, **Kwargs):
        self.row = 0
        self.column = 0
        self.refreshRate = 0.0
        self.refreshRateUnit = esriTimeUnits.esriTimeUnitsSeconds
        self.rowSpan = 1
        self.columnSpan = 1
        self.isCarousel = False
    
class CIMPopupFieldDescription():
    """
      Represents a pop-up field description.
    """
    def __init__(self, *args, **Kwargs):
        self.alias = str()
        self.fieldName = str()
        self.numberFormat = 'CIMNumberFormat'
    
class CIMPopupInfo():
    """
      Represents pop-up info.
    """
    def __init__(self, *args, **Kwargs):
        self.title = str()
        self.expressionInfos = []
        self.mediaInfos = []
        self.relatedRecordSortOrder = []
        self.gridLayout = 'CIMPopupLayout'
        self.fieldDescriptions = []
    
class CIMPopupLayout():
    """
      Represents a grid layout for pop-up media infos.
    """
    def __init__(self, *args, **Kwargs):
        self.columnWidths = []
        self.borderWidth = 1
        self.borderColor = 'CIMColor'
    
class CIMAttachmentsMediaInfo(CIMMediaInfo):
    """
      Represents attachment media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.caption = str()
        self.title = str()
        self.contentType = str()
        self.displayType = AttachmentDisplayType.PreviewFirst
        self.sortField = str()
        self.sortOrder = SortOrderType.Descending
    
class CIMCarouselMediaInfo(CIMMediaInfo):
    """
      Represents carousel media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.caption = str()
        self.title = str()
        self.mediaInfos = []
    
class CIMChartMediaInfo(CIMMediaInfo):
    """
      Represents chart media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fields = []
        self.normalizeField = str()
        self.caption = str()
        self.title = str()
        self.maximumAxisValue = -1.0
        self.colorRamp = 'CIMFixedColorRamp'
    
class CIMColumnChartMediaInfo(CIMChartMediaInfo):
    """
      Represents column chart media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMExpressionMediaInfo(CIMMediaInfo):
    """
      Represents expression media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.expression = 'CIMExpressionInfo'
    
class CIMImageMediaInfo(CIMMediaInfo):
    """
      Represents image media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.sourceURL = str()
        self.linkURL = str()
        self.caption = str()
        self.title = str()
    
class CIMLineChartMediaInfo(CIMChartMediaInfo):
    """
      Represents line chart media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMPieChartMediaInfo(CIMChartMediaInfo):
    """
      Represents pie chart media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMRelationshipMediaInfo(CIMMediaInfo):
    """
      Represents relationship media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.caption = str()
        self.title = str()
        self.displayCount = 0
        self.relationshipName = str()
        self.relatedRecordSortOrder = []
    
class CIMTableMediaInfo(CIMMediaInfo):
    """
      Represents table media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fields = []
        self.useLayerFields = False
        self.caption = str()
        self.title = str()
    
class CIMTextMediaInfo(CIMMediaInfo):
    """
      Represents text media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.text = str()
    
class CIMBarChartMediaInfo(CIMChartMediaInfo):
    """
      Represents bar chart media info.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
