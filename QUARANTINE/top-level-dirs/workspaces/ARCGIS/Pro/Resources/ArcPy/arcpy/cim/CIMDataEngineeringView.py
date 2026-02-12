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

class CIMDataEngineeringFieldStatistics():
    """
      Contains the field statistics.
    """
    def __init__(self, *args, **Kwargs):
        self.fieldName = str()
        self.treatFieldAs = DataEngineeringTreatFieldAsType.Numerical
        self.values = []
        self.previewChart = 'CIMDataEngineeringPreviewChart'
    
class CIMDataEngineeringPreviewChart():
    """
      Provide information of a preview chart.
    """
    def __init__(self, *args, **Kwargs):
        self.minimum = object()
        self.maximum = object()
        self.values = list()
    
class CIMDataEngineeringStatisticColumn():
    """
      Provide access to the statistic column.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.isFrozen = False
        self.isSorted = False
        self.isVisible = True
        self.sortDirection = SortOrderType.Ascending
    
class CIMDataEngineeringStatisticValue():
    """
      Contains a statistic value.
    """
    def __init__(self, *args, **Kwargs):
        self.statisticType = DataEngineeringStatType.Mean
        self.value = object()
    
from .CIMDocument import CIMView
class CIMDataEngineeringView(CIMView):
    """
      Represents a data engineering statistics view.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.mapURI = str()
        self.sourceFilter = DataEngineeringSourceFilterType.eNone
        self.useFieldAliases = False
        self.rowHeight = 21
        self.zoomPercent = 100
        self.layoutType = DataEngineeringViewLayoutType.FieldsAndStatistics
        self.columns = []
        self.fieldTypeFilter = []
        self.fieldTypeFilters = []
        self.fieldStatistics = []
        self.displayNumericStatistics = True
        self.displayDateTimeStatistics = True
        self.displayTextStatistics = True
    
