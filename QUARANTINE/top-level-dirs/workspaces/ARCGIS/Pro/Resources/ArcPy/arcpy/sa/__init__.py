# COPYRIGHT 2013-2023 ESRI
#
# TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
# Unpublished material - all rights reserved under the
# Copyright Laws of the United States.
#
# For additional information, contact:
# Environmental Systems Research Institute, Inc.
# Attn: Contracts Dept
# 380 New York Street
# Redlands, California, USA 92373
#
# email: contracts@esri.com

# import <package>
from arcpy import Extent, Point
from .Raster import Raster
from .Functions import *
from .ParameterClasses import *
from ..ia import (Anomaly, Apply, Foreach, Subset,  # NOT Aggregate
                  ArgStatistics, Arithmetic, BandArithmetic,
                  Convolution, ElevationVoidFill, ExtractBand,
                  Pansharpen, RasterCalculator, Remap, ShadedRelief,
                  Statistics, StatisticsHistogram, Stretch, TasseledCap,
                  TransposeBits, UnitConversion, VectorField,
                  VectorFieldRenderer, CIg, CIre, ClayMinerals, Colormap,
                  ColormapToRGB, ColorspaceConversion, Complex,
                  ContrastBrightness, EVI, Speckle, SpectralConversion,
                  CompositeBand, Mask, Resample, AspectSlope, HeatIndex,
                  WindChill, FerrousMinerals, GEMI, GNDVI, Grayscale, GVITM,
                  IronOxide, MSAVI, MTVI2, NDVI, NDVIre, NDWI, PVI, RTVICore,
                  SAVI, SRre, Sultan, Threshold, TSAVI, VARI, Classify,
                  LinearUnmixing, RegionGrow, SegMeanShift, RasterizeFeatures,
                  BAI, NBR, NDBI, NDMI, NDSI, ZonalRemap, Render)
from arcgisscripting import RasterCellIterator, RasterInfo

# from <package> import *
# Hide module names.
from . import Functions as __Functions
from . import ParameterClasses as __ParameterClasses

__all__ = []
__all__ += __Functions.__all__
__all__ += __ParameterClasses.__all__
__all__ += ["Extent", "Point", "Raster"]
__all__ += ["Subset", "Foreach", "Apply", "Anomaly", "ArgStatistics",
            "Arithmetic", "BandArithmetic", "Convolution", "ElevationVoidFill",
            "ExtractBand", "Pansharpen", "RasterCalculator", "Remap",
            "ShadedRelief", "Statistics", "StatisticsHistogram",
            "Stretch", "TasseledCap", "TransposeBits", "UnitConversion",
            "VectorField", "VectorFieldRenderer", "CIg", "CIre","ClayMinerals",
            "Colormap", "ColormapToRGB", "Complex", "ContrastBrightness",
            "EVI", "Speckle", "SpectralConversion", "CompositeBand", "Mask",
            "Resample", "AspectSlope", "HeatIndex", "WindChill",
            "FerrousMinerals", "GEMI", "GNDVI", "Grayscale", "GVITM",
            "IronOxide", "MSAVI", "MTVI2", "NDVI", "NDVIre", "NDWI", "PVI",
            "RTVICore", "SAVI", "SRre", "Sultan", "Threshold", "TSAVI", "VARI",
            "RasterCellIterator", "RasterInfo", "Classify", "LinearUnmixing",
            "RegionGrow", "SegMeanShift", "RasterizeFeatures", "BAI", "NBR",
            "NDBI", "NDMI", "NDSI", "ZonalRemap", "Render"]
