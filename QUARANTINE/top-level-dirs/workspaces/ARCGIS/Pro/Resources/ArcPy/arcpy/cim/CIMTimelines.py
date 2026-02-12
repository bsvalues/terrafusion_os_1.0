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

class CIMTimelineLayer():
    """
      Represents a layer in a timeline.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = str()
        self.alias = str()
        self.layerURI = str()
        self.displayField = str()
        self.categoryField = str()
        self.visibility = True
    
class CIMTimelineSwimlane():
    """
      Represents a swimlane in a timeline.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = str()
        self.alias = str()
        self.visibility = True
        self.expanded = True
        self.swimlaneExpanded = False
        self.layers = []
    
from .CIMCore import CIMDefinition
class CIMTimeline(CIMDefinition):
    """
      Represents a timeline.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.units = esriTimeUnits.esriTimeUnitsDecades
        self.startTime = GetPythonClass('datetime', 'datetime')
        self.endTime = GetPythonClass('datetime', 'datetime')
        self.showSwimlanes = False
        self.showSwimlaneLabels = False
        self.honorTimeSlider = False
        self.expanded = True
        self.swimlanes = []
        self.honorSelection = False
        self.honorExtent = False
        self.honorRange = False
        self.viewType = TimelineViewType.DefaultView
        self.binningTimespan = esriTimeUnits.esriTimeUnitsDecades
        self.selectionSetURI = str()
    
