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

class CIMAspectRatio():
    """
      Represents an aspect ratio.
    """
    def __init__(self, *args, **Kwargs):
        self.width = 16.0
        self.height = 9.0
    
class CIMPresentationLayerOverrideSet():
    """
      Represents a presentation layer property override set.
    """
    def __init__(self, *args, **Kwargs):
        self.layerURI = str()
        self.visibility = True
    
class CIMPresentationMapRestingState():
    """
      Presentation map resting state.
    """
    def __init__(self, *args, **Kwargs):
        self.startDelay = 3
        self.enabled = True
        self.viewpoint = 'CIMViewCamera'
    
class CIMPresentationMapView():
    """
      Represents a map view in a map presentation page.
    """
    def __init__(self, *args, **Kwargs):
        self.mapView = 'CIMMapView'
        self.layerOverrides = []
    
class CIMPresentationPage():
    """
      Represents a presentation page.
    """
    def __init__(self, *args, **Kwargs):
        self.transition = 'CIMPresentationTransition'
        self.holdTime = 10
        self.isAutomaticAdvancement = False
        self.backgroundColor = 'CIMColor'
        self.showBackgroundBorder = True
        self.margin = 'CIMMargin'
        self.elementStorageURI = str()
        self.extent = GetPythonClass('arcpy', 'Extent')
        self.thumbnailURI = str()
        self.visibility = True
        self.locked = False
        self.colorVisionDeficiencyMode = ColorVisionDeficiencyType.eNone
    
class CIMPresentationTransition():
    """
      Represents a transition.
    """
    def __init__(self, *args, **Kwargs):
        self.duration = 0
        self.transitionType = PresentationTransitionType.eNone
        self.swipeDirection = SwipeDirection.Right
    
from .CIMCore import CIMDefinition
class CIMPresentation(CIMDefinition):
    """
      Represents a presentation.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.pageSettings = 'CIMPage'
        self.pages = []
        self.aspectRatio = 'CIMAspectRatio'
        self.colorModel = ColorModel.RGB
        self.rGBColorProfile = str()
        self.cMYKColorProfile = str()
    
class CIMImagePresentationPage(CIMPresentationPage):
    """
      Represents an image media presentation page.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.imageURI = str()
        self.sourceURL = str()
        self.fitType = PresentationMediaContentFitType.eNone
    
class CIMMapPresentationPage(CIMPresentationPage):
    """
      Represents a map presentation page.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.mapView = 'CIMPresentationMapView'
        self.restingState = 'CIMPresentationMapRestingState'
        self.autoPlayAnimationName = str()
    
class CIMPresentationGravityWellRestingState(CIMPresentationMapRestingState):
    """
      Presentation map gravity well resting state.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.travelTime = 6
    
class CIMPresentationRotateRestingState(CIMPresentationMapRestingState):
    """
      Presentation map rotate resting state.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.rotationRate = 60
    
class CIMVideoPresentationPage(CIMPresentationPage):
    """
      Represents an video media presentation page.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.videoSource = 'CIMVideoDataConnection'
        self.fitType = PresentationMediaContentFitType.eNone
        self.startTime = 0
        self.endTime = float('inf')
        self.loop = True
    
