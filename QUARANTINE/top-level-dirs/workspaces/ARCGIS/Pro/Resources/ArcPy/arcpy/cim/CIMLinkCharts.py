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

class CIMLinkChartEntity():
    """
      Represents a link chart entity.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = str()
        self.name = str()
        self.layerURI = str()
        self.labelFieldName = str()
        self.nonSpatial = False
        self.drawingInfo = 'CIMLinkChartNodeDrawingInfo'
        self.labelingInfo = 'CIMLinkChartNodeLabelingInfo'
        self.expanded = False
        self.keyFieldNames = []
    
class CIMLinkChartFilter():
    """
      Represents the link chart filter information.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = str()
        self.name = str()
        self.description = str()
        self.enabled = True
        self.isExclusion = False
        self.filterStage = LinkChartFilterStage.Unknown
        self.filterType = LinkChartFilterType.Unknown
        self.filterScope = LinkChartFilterScope.Both
        self.targetIds = []
        self.valueSetURI = str()
    
class CIMLinkChartFilterGroup():
    """
      Represents a group of link chart filters.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = str()
        self.name = str()
        self.description = str()
        self.enabled = True
        self.filters = []
    
class CIMLinkChartLabelingInfo():
    """
      Represents the link chart labeling information.
    """
    def __init__(self, *args, **Kwargs):
        self.showLabels = False
        self.labelFontFamilyName = str()
        self.labelFontStyleName = str()
        self.labelFontType = FontType.Unspecified
        self.labelFontSize = 16
        self.labelFontColor = 'CIMColor'
        self.labelBackgroundColor = 'CIMColor'
    
class CIMLinkChartLinkDrawingInfo():
    """
      Represents the link chart link drawing information.
    """
    def __init__(self, *args, **Kwargs):
        self.linkColor = 'CIMColor'
        self.linkWidth = 4
        self.linkDashStyle = LinkChartLinkDashStyle.Solid
        self.showDirection = True
    
class CIMLinkChartNodeDrawingInfo():
    """
      Represents the link chart node drawing information.
    """
    def __init__(self, *args, **Kwargs):
        self.collapseDuplicates = True
        self.nodeSymbology = LinkChartSymbolizationSource.MapSymbology
        self.overrideSymbol = 'CIMSymbolReference'
        self.overrideOverviewSymbolColor = False
        self.overviewSymbolColor = 'CIMColor'
        self.showNodeFrames = False
    
class CIMLinkChartRelationship():
    """
      Represents a link chart relationship.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = str()
        self.name = str()
        self.sourceEntityId = str()
        self.sourceEntityBackingField = str()
        self.targetEntityId = str()
        self.targetEntityBackingField = str()
        self.drawingInfo = 'CIMLinkChartLinkDrawingInfo'
        self.labelingInfo = 'CIMLinkChartLinkLabelingInfo'
        self.expanded = False
        self.keyType = LinkChartRelationshipKeyType.eNone
        self.mapMemberURI = str()
        self.sourceEntityKeyField = str()
        self.targetEntityKeyField = str()
    
class CIMLinkChartViewport():
    """
      Represents the link chart viewport.
    """
    def __init__(self, *args, **Kwargs):
        self.centerX = 0.0
        self.centerY = 0.0
        self.zoomLevel = 1.0
    
from .CIMCore import CIMDefinition
class CIMLinkChartBase(CIMDefinition):
    """
      Represents the base definition of a link chart.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMLinkChart(CIMLinkChartBase):
    """
      Represents a link chart.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.entities = []
        self.relationships = []
        self.layout = LinkChartLayoutAlgorithm.Clustered
        self.graphMLURI = str()
        self.expanded = False
        self.locked = False
        self.interactiveLayoutMode = True
        self.viewport = 'CIMLinkChartViewport'
        self.filterByMinLinks = False
        self.minLinks = 0
        self.filterGroups = []
    
class CIMLinkChartFieldFilter(CIMLinkChartFilter):
    """
      Represents additional settings used by a Link chart field filter.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.field = str()
        self.fieldType = esriFieldType.esriFieldTypeString
    
class CIMLinkChartLinkLabelingInfo(CIMLinkChartLabelingInfo):
    """
      Represents the link chart link labeling information.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.labelPlacement = LinkChartLinkLabelPlacement.Parallel
        self.defaultLabel = str()
    
class CIMLinkChartNodeLabelingInfo(CIMLinkChartLabelingInfo):
    """
      Represents the link chart node labeling information.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMLinkChartPropertyFilter(CIMLinkChartFilter):
    """
      Represents additional settings used by a Link chart property filter.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataType = LinkChartFilterPropertyDataType.EntityKeyValue
    
