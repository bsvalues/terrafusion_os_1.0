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

class CIMColor():
    """
      Supports colors in the CIM model by providing low level access 
      to properties common amongst all color types.
    """
    def __init__(self, *args, **Kwargs):
        self.colorSpace = 'CIMColorSpace'
        self.values = []
    
class CIMColorRamp():
    """
      Supports color ramp schemes in the CIM model by providing low level 
      access to properties common amongst all color ramp types.
    """
    def __init__(self, *args, **Kwargs):
        self.colorSpace = 'CIMColorSpace'
    
class CIMColorSpace():
    """
      Supports colors spaces by providing a common base type for all 
      color spaces.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMCMYKColor(CIMColor):
    """
      Represents a color in the CMYK color model.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMContinuousColorRamp(CIMColorRamp):
    """
      Supports continuous color ramp schemes by providing low level access 
      to properties common amongst all continuous color ramp types.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fromColor = 'CIMColor'
        self.toColor = 'CIMColor'
        self.primitiveName = str()
    
class CIMFixedColorRamp(CIMColorRamp):
    """
      Represents a color scheme composed of discrete colors.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colors = []
        self.arrangement = FixedColorRampArrangementType.Default
    
class CIMGrayColor(CIMColor):
    """
      Represents a grayscale color defined by lightness.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMHSLColor(CIMColor):
    """
      Represents a color defined by hue, saturation, and lightness.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMHSVColor(CIMColor):
    """
      Represents a color defined by hue, saturation, and brightness (value).
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMICCColorSpace(CIMColorSpace):
    """
      Represents a color space defined by an International Color Consortium 
      (ICC) color profile.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.url = str()
    
class CIMLABColor(CIMColor):
    """
      Represents a color defined in the LAB color space.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMLinearContinuousColorRamp(CIMContinuousColorRamp):
    """
      Represents a linear continuous color ramp scheme.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMMultipartColorRamp(CIMColorRamp):
    """
      Represents a multipart color ramp scheme.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colorRamps = []
        self.weights = []
    
class CIMPolarContinuousColorRamp(CIMContinuousColorRamp):
    """
      Represents a polar continuous color ramp scheme.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.interpolationSpace = ColorSpaceType.HSV
        self.polarDirection = PolarDirection.Auto
    
class CIMRGBColor(CIMColor):
    """
      Represents a color in the RGB color model.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMRandomHSVColorRamp(CIMColorRamp):
    """
      Represents a random HSV color ramp scheme.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.minH = 0
        self.maxH = 0
        self.minS = 0
        self.maxS = 0
        self.minV = 0
        self.maxV = 0
        self.minAlpha = 0
        self.maxAlpha = 100
        self.seed = 0
    
class CIMSpotColor(CIMColor):
    """
      Represents a spot color.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.name = str()
    
class CIMSpotColorSpace(CIMColorSpace):
    """
      Represents a color space for spot colors.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.description = str()
        self.name = str()
        self.alternativeColor = 'CIMColor'
        self.bookColor = 'CIMColor'
        self.bookID = str()
        self.isReferencedColor = False
    
class CIMXYZColor(CIMColor):
    """
      Represents a color in the XYZ color model.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
