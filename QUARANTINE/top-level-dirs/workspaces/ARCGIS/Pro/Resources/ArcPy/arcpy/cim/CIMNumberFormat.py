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

class CIMNumberFormat():
    """
      Represents a number format.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMCurrencyFormat(CIMNumberFormat):
    """
      Represents a currency format.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMCustomNumberFormat(CIMNumberFormat):
    """
      Represents a custom number format.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.formatString = str()
    
class CIMDateFormat(CIMNumberFormat):
    """
      Represents a standard date and time format.
        /// https://docs.microsoft.com/en-us/dotnet/standard/base-types/standard-date-and-time-format-strings.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.format = str()
    
class CIMDirectionFormat(CIMNumberFormat):
    """
      Represents a direction format.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.decimalPlaces = 3
        self.format = DirectionFormatOption.DegreesMinutesSeconds
        self.directionType = DirectionType.NorthAzimuth
        self.units = DirectionUnits.Radians
        self.useNegativeAngles = False
    
class CIMFractionFormat(CIMNumberFormat):
    """
      Represents a fraction format.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.option = FractionOption.Digits
        self.factor = 1
    
class CIMNumericFormatBase(CIMNumberFormat):
    """
      Represents the numeric format base class.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.alignmentOption = esriNumericAlignmentEnum.esriAlignLeft
        self.alignmentWidth = 12
        self.roundingOption = esriRoundingOptionEnum.esriRoundNumberOfDecimals
        self.roundingValue = 6
        self.showPlusSign = False
        self.useSeparator = False
        self.zeroPad = False
    
class CIMPercentageFormat(CIMNumericFormatBase):
    """
      Represents a percentage format.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.adjustPercentage = False
    
class CIMRateFormat(CIMNumericFormatBase):
    """
      Represents a rate format.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.factor = 1.0
        self.label = str()
    
class CIMScientificNumberFormat(CIMNumberFormat):
    """
      Represents scientific number format.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.decimalPlaces = 2
    
class CIMAngleFormat(CIMNumericFormatBase):
    """
      Represents an angle format.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.angleInDegrees = True
        self.displayDegrees = True
    
class CIMLatLonFormat(CIMNumericFormatBase):
    """
      Represents a latitude and longitude format.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.showDirections = True
        self.isLatitude = False
        self.showZeroMinutes = False
        self.showZeroSeconds = False
    
class CIMNumericFormat(CIMNumericFormatBase):
    """
      Represents a numeric format.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.suffix = str()
    
