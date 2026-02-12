#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

from arcpy.arcobjects._base import _ObjectWithoutInitCall, passthrough_attr, pass_parameterized_attr
from arcpy.geoprocessing._base import gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

class Arc_base:
    def __init__(self, parent):
        self._parent = parent
        self._arc_object = parent._arc_object

class Base_raster(Arc_base):
    pass

class RasterClassifyColorizer(Base_raster):
    breakCount = passthrough_attr('breakCount')
    classBreaks = passthrough_attr('breaks')
    colorRamp = passthrough_attr('colorRamp')
    noDataColor = passthrough_attr('noDataColor')
    classificationField = passthrough_attr('field')
    classificationMethod = passthrough_attr('classification')
    lowerBound = passthrough_attr('lowerBound')

    @property
    def type(self):
        return 'RasterClassifyColorizer'

    def __eq__(self, other):
        return other == 'RasterClassifyColorizer'

class RasterUniqueValueColorizer(Base_raster):
    colorRamp = passthrough_attr('colorRamp')
    useDefaultSymbol = passthrough_attr('useDefaultSymbol')
    field = passthrough_attr('field')
    groups = passthrough_attr('itemGroups')
    noDataColor = passthrough_attr('noDataColor')

    @property
    def type(self):
        return 'RasterUniqueValueColorizer'

    def __eq__(self, other):
        return other == 'RasterUniqueValueColorizer'

class RasterStretchColorizer(Base_raster):
    colorRamp = passthrough_attr('colorRamp')
    band = passthrough_attr('bandIndex')
    gamma = passthrough_attr('gamma')
    invertColorRamp = passthrough_attr('invertColorRamp')
    stretchType = passthrough_attr('stretchType')
    minPercent = passthrough_attr('minPercent')
    maxPercent = passthrough_attr('maxPercent')
    standardDeviation = passthrough_attr('standardDeviation')
    minLabel = passthrough_attr('minLabel')
    maxLabel = passthrough_attr('maxLabel')

    @property
    def type(self):
        return 'RasterStretchColorizer'

    def __eq__(self, other):
        return other == 'RasterStretchColorizer'

