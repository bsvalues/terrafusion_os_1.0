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

class CIMCameraEffect():
    """
      Represents a camera effect definition to be applied to a 3D view.
    """
    def __init__(self, *args, **Kwargs):
        self.isActive = False
    
class CIMPostprocessingEffect():
    """
      Represents a post-processing effect definition to be applied to 
      a 3D view.
    """
    def __init__(self, *args, **Kwargs):
        self.isActive = False
    
class CIMVisualEffect():
    """
      Represents a visual effect definition for stylized rendering of 
      all the content in a map or scene.
    """
    def __init__(self, *args, **Kwargs):
        self.isActive = False
    
class CIMWeatherEffect():
    """
      Represents a weather effect to be applied to a scene.
    """
    def __init__(self, *args, **Kwargs):
        self.isActive = False
        self.seed = 0
    
class CIMBlackAndWhiteEffect(CIMVisualEffect):
    """
      Represents a visual effect for reshading the scene to black and 
      white.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMBloomPostprocessingEffect(CIMPostprocessingEffect):
    """
      Represents a post-processing technique that reshades the scene 
      with a glow effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.strength = 0.5
        self.threshold = 0.5
    
class CIMBlueprintEffect(CIMVisualEffect):
    """
      Represents a visual effect for reshading the scene with a blueprint 
      style.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.outlineStrength = 0.5
        self.gridSize = 50
        self.gridSubdivisions = 5
    
class CIMCloudyWeatherEffect(CIMWeatherEffect):
    """
      Represents a cloudy weather effect to be applied to a scene.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.cloudCover = 0.5
    
class CIMColorGradingPostprocessingEffect(CIMPostprocessingEffect):
    """
      Represents a post-processing technique that reshades the scene 
      with adjusted color and luminance.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.saturation = 0
        self.brightness = 0
        self.contrast = 0
    
class CIMCrossMosaicEffect(CIMVisualEffect):
    """
      Represents a visual effect for reshading the scene with a cross 
      mosaic texture.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.size = 4.0
    
class CIMDepthOfFieldEffect(CIMCameraEffect):
    """
      Represents the data for simulating camera depth of field effect 
      in 3D scenes.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.focusDistance = 100.0
        self.focusDepth = 25.0
        self.maxBlur = DepthOfFieldMaxBlur.Small
    
class CIMFoggyWeatherEffect(CIMWeatherEffect):
    """
      Represents a foggy weather effect to be applied to a scene.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fogStrength = 0.5
        self.fogColor = 'CIMColor'
    
class CIMGrainPostprocessingEffect(CIMPostprocessingEffect):
    """
      Represents a post-processing technique that reshades the scene 
      with a grain effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.strength = 0.5
        self.size = 1.0
    
class CIMHalftoneEffect(CIMVisualEffect):
    """
      Represents a visual effect for reshading the scene with halftone.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dotSize = 10
        self.dotStrength = 0.5
        self.invertTone = False
    
class CIMHexMosaicEffect(CIMVisualEffect):
    """
      Represents a visual effect for reshading the scene with a hexagonal 
      mosaic texture.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.size = 4.0
    
class CIMMonochromaticEffect(CIMVisualEffect):
    """
      Represents a visual effect for reshading the scene to monochromatic 
      tones.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.color = 'CIMColor'
    
class CIMOutlineEffect(CIMVisualEffect):
    """
      Represents a visual effect for reshading the scene with outlines.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.outlineStrength = 0.5
        self.outlineColor = 'CIMColor'
        self.backgroundColor = 'CIMColor'
    
class CIMPencilSketchEffect(CIMVisualEffect):
    """
      Represents a visual effect for reshading the scene with a pencil 
      sketch style.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.grayscale = False
        self.crosshatchStrength = 0.5
        self.crosshatchAngleCount = 4
    
class CIMPixelatedEffect(CIMVisualEffect):
    """
      Represents a visual effect for reshading the scene with a pixelated 
      style.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.pixelSize = 4
        self.colorFactor = 6
    
class CIMRainyWeatherEffect(CIMWeatherEffect):
    """
      Represents a rainy weather effect to be applied to a scene.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.cloudCover = 0.5
        self.precipitation = 0.5
    
class CIMSnowyWeatherEffect(CIMWeatherEffect):
    """
      Represents a snowy weather effect to be applied to a scene.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.cloudCover = 0.5
        self.precipitation = 0.5
        self.snowCover = False
    
class CIMSunnyWeatherEffect(CIMWeatherEffect):
    """
      Represents a sunny weather effect to be applied to a scene.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.cloudCover = 0.5
    
class CIMTiltShiftEffect(CIMCameraEffect):
    """
      Represents the data for simulating camera tilt-shift effect for 
      creating a miniaturization effect in 3D scenes.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.blurStrength = 1.0
        self.leftOffset = 10.0
        self.rightOffset = 10.0
        self.topOffset = 10.0
        self.bottomOffset = 10.0
    
class CIMToonEffect(CIMVisualEffect):
    """
      Represents a visual effect for reshading the scene with a cartoon 
      style.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.lineStrength = 0.15
    
class CIMVignettePostprocessingEffect(CIMPostprocessingEffect):
    """
      Represents a post-processing technique that reshades the scene 
      with a vignette effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.size = 0.5
        self.strength = 0.5
    
class CIMWatercolorEffect(CIMVisualEffect):
    """
      Represents a visual effect for reshading the scene with a watercolor 
      style.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.marginWidth = 0.1
        self.marginGradient = 0.5
        self.drawMarginOutlines = True
        self.backgroundColor = 'CIMColor'
    
