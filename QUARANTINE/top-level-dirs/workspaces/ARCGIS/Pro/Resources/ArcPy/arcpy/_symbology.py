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
from arcpy.arcobjects._base import _ObjectWithoutInitCall, _ObjectWithoutInitCallWrapper, passthrough_attr, pass_parameterized_attr
from arcpy.geoprocessing._base import gp_fixargs
from arcpy.utils import ArgAdaptor
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from arcpy._renderer import UniqueValueRenderer, SimpleRenderer, Graduated_colors_renderer, Graduated_symbols_renderer, Unclassed_colors_renderer
from arcpy._colorizer import RasterClassifyColorizer, RasterUniqueValueColorizer, RasterStretchColorizer

class constants(ArgAdaptor):
    """Represents the constants that can be passed into various functions"""
    __args__ = {
            # For renderer selection.
            'renderer_name': {
                'SimpleRenderer': 'SIMPLERENDERER',
                'GraduatedColorsRenderer': 'GRADUATEDCOLORSRENDERER',
                'GraduatedSymbolsRenderer': 'GRADUATEDSYMBOLSRENDERER',
                'UniqueValueRenderer': 'UNIQUEVALUERENDERER',
                'UnclassedColorsRenderer': 'UNCLASSEDCOLORSRENDERER'
            },
            'colorizer_name': {
                'RasterClassifyColorizer': 'RASTERCLASSIFYCOLORIZER',
                'RasterUniqueValueColorizer': 'RASTERUNIQUEVALUECOLORIZER',
                'RasterStretchColorizer': 'RASTERSTRETCHCOLORIZER'
            }

            }

class Symbology(_ObjectWithoutInitCallWrapper):
    """It is through the Symbology class that you can gain access to a layer's renderer"""
    _rendererType = passthrough_attr('renderer')

    def __new__(cls, wrap_object):
        obj = super().__new__(cls)
        obj._arc_object = wrap_object
        obj._visualizer()
        if hasattr(obj, '_renderer'):
            obj.renderer = obj._getRenderer()
            obj.updateRenderer = obj._updateRenderer
        elif hasattr(obj, '_colorizer'):
            obj.colorizer = obj._getColorizer()
            obj.updateColorizer = obj._updateColorizer
        return obj

    def _getRenderer(self):
        if hasattr(self, '_renderer'):
            if self._rendererType == self._renderer:
                return self._renderer

        self._createRendererType(self._rendererType)
        return self._renderer

    def _getColorizer(self):
        if hasattr(self, '_colorizer'):
            if self._rendererType == self._colorizer:
                return self._colorizer

        self._createRendererType(self._rendererType)
        return self._colorizer

    def _visualizer(self):
        self._createRendererType(self._rendererType)

    def _createRendererType(self, val, invoke_init=False):
        if val == 'UniqueValueRenderer':
            self._create_unique_value(invoke_init)
        elif val == 'SimpleRenderer':
            self._create_single_symbol(invoke_init)
        elif val == 'GraduatedColorsRenderer':
            self._create_graduated_colors(invoke_init)
        elif val == 'GraduatedSymbolsRenderer':
            self._create_graduated_symbols(invoke_init)
        elif val == 'UnclassedColorsRenderer':
            self._create_unclassed_colors(invoke_init)
        elif val == 'RasterClassifyColorizer':
            self._create_classify_colorizer(invoke_init)
        elif val == 'RasterUniqueValueColorizer':
            self._create_unique_value_colorizer(invoke_init)
        elif val == 'RasterStretchColorizer':
            self._create_stretch_colorizer(invoke_init)

    @constants.maskargs
    def _updateRenderer(self, renderer_name):
        """The updateRenderer method is used to change the renderer of a layer.
        renderer_name{String}:
        The supported renderers are as follows:
            GraduatedColorsRenderer - A graduated colors renderer.
            GraduatedSymbolsRenderer - A graduated symbols renderer.
            UnclassedColorsRenderer - Unclassed colors renderer
            SimpleRenderer - A single symbol renderer.
            UniqueValueRenderer - A unique value renderer.
        """
        return_type =  convertArcObjectToPythonObject(self._arc_object.updateRenderer(*gp_fixargs((renderer_name,), True)))
        if self._rendererType != self._renderer:
            self.renderer = self._getRenderer()
        return return_type


    @constants.maskargs
    def _updateColorizer(self, colorizer_name):
        """The updateColorizer method is used to change the renderer of a layer.
        colorizer_name{String}:
        """
        return_type = convertArcObjectToPythonObject(self._arc_object.updateColorizer(*gp_fixargs((colorizer_name,), True)))
        if self._rendererType != self._colorizer:
            self.colorizer = self._getColorizer()
        return return_type

    def _create_unique_value(self, invoke_init=False):
        if invoke_init:
            setattr(self, '_rendererType', 'UniqueValueRenderer')
        setattr(self, '_renderer', UniqueValueRenderer(self))
        return self._renderer

    def _create_single_symbol(self, invoke_init=False):
        if invoke_init:
            setattr(self, '_rendererType', 'SimpleRenderer')
        setattr(self, '_renderer', SimpleRenderer(self))
        return self._renderer

    def _create_graduated_colors(self, invoke_init=False):
        if invoke_init:
            setattr(self, '_rendererType', 'GraduatedColorsRenderer')
        setattr(self, '_renderer', Graduated_colors_renderer(self))
        return self._renderer

    def _create_graduated_symbols(self, invoke_init=False):
        if invoke_init:
            setattr(self, '_rendererType', 'GraduatedSymbolsRenderer')
        setattr(self, '_renderer', Graduated_symbols_renderer(self))
        return self._renderer

    def _create_unclassed_colors(self, invoke_init=False):
        if invoke_init:
            setattr(self, '_rendererType', 'UnclassedColorsRenderer')
        setattr(self, '_renderer', Unclassed_colors_renderer(self))
        return self._renderer

    def _create_classify_colorizer(self, invoke_init=False):
        if invoke_init:
              setattr(self, '_rendererType', 'RasterClassifyColorizer')
        setattr(self, '_colorizer', RasterClassifyColorizer(self))
        return self._colorizer

    def _create_unique_value_colorizer(self, invoke_init=False):
        if invoke_init:
              setattr(self, '_rendererType', 'RasterUniqueValueColorizer')
        setattr(self, '_colorizer', RasterUniqueValueColorizer(self))
        return self._colorizer

    def _create_stretch_colorizer(self, invoke_init=False):
        if invoke_init:
              setattr(self, '_rendererType', 'RasterStretchColorizer')
        setattr(self, '_colorizer', RasterStretchColorizer(self))
        return self._colorizer

class Symbol(_ObjectWithoutInitCall):
    """The Symbol class provides access to basic symbol properties and methods."""
    name = passthrough_attr('name')
    color = passthrough_attr('color')
    angle = passthrough_attr('angle')
    outlineColor = passthrough_attr('outlineColor')
    outlineWidth = passthrough_attr('outlineWidth')
    useRealWorldUnits = passthrough_attr('useRealWorldUnits')
    size = passthrough_attr('size')

    def listSymbolsFromGallery(self, wildcard=None):
        """Symbol.listSymbolsFromGallery({wildcard})


        listSymbolsFromGallery provides a mechanism to return a list of symbols
        that exists in a system or project style gallery.


        wildcard{String}:
        A string  used to find symbols based on the symbol name or tag value.  A
        partial word search works. The default value is None.
        """
        import arcgisscripting
        return convertArcObjectToPythonObject(self._arc_object.listSymbolsFromGallery(*gp_fixargs((wildcard,), True)))

    def applySymbolFromGallery(self, wildcard, index=0):
        """Symbol.applySymbolFromGallery(wildcard, {index})


        applySymbolFromGallery provides a mechanism to set  a symbol to one that
        exists in a system or project style gallery.


        wildcard(String):
        A string  used to find symbols based on the symbol name or tag value.  A
        partial word search works. The default value is None.


        index{Integer}:
        A list index value based on the number of possible symbols that are
        returned with the same name. The default value is 0.
        """
        import arcgisscripting
        return convertArcObjectToPythonObject(
            self._arc_object.applySymbolFromGallery(*gp_fixargs((wildcard, index), True)))

class ColorRamp(_ObjectWithoutInitCall):
    """ColorRamp provides access to a color ramp that is available in a project.
    To reference a color ramp in a project, use the listColorRamps method on the arcpy.mp.ArcGISProject.
    """
    name = passthrough_attr('name')

    def __init__(self, color_ramp_name, index=0):
        """ColorRamp(color_ramp_name, {index})"""
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.ColorRamp(*gp_fixargs((color_ramp_name, index), True))

class ClassBreak(_ObjectWithoutInitCall):
    """The ClassBreak class represents a class break that is available to the GraduatedColorsRenderer
       and the GraduatedSymbolsRenderer classes.
    """
    symbol = passthrough_attr('symbol')
    upperBound = passthrough_attr('upperBound')
    label = passthrough_attr('label')
    description = passthrough_attr('description')

class RasterClassBreak(_ObjectWithoutInitCall):
    """The RasterClassBreak class represents a class break that is available to the RasterClassifyColorizer.
    """
    color = passthrough_attr('color')
    upperBound = passthrough_attr('upperBound')
    label = passthrough_attr('label')
    description = passthrough_attr('description')

class Item(_ObjectWithoutInitCall):
    """Item provides access to item level information for a UniqueValueRenderer."""
    symbol = passthrough_attr('symbol')
    label = passthrough_attr('label')
    description = passthrough_attr('description')
    values = passthrough_attr('values')

class RasterItem(_ObjectWithoutInitCall):
    """Item provides access to item level information for a RasterUniqueValueColorizer."""
    color = passthrough_attr('color')
    label = passthrough_attr('label')
    description = passthrough_attr('description')
    values = passthrough_attr('values')

class ItemGroup(_ObjectWithoutInitCall):
    """ItemGroup provides access to group level information for a UniqueValueRenderer."""
    heading = passthrough_attr('heading')
    items = passthrough_attr('items')
