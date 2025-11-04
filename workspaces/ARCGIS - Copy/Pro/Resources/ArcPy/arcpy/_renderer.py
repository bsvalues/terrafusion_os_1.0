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

class Base_renderer(Arc_base):
    pass

class UniqueValueRenderer(Base_renderer):
    """The UniqueValueRenderer class represents a unique value renderer."""
    colorRamp = passthrough_attr('colorRamp')
    groups = passthrough_attr('itemGroups')
    fields = passthrough_attr('fields')
    defaultSymbol = passthrough_attr('defaultSymbol')
    useDefaultSymbol = passthrough_attr('useDefaultSymbol')

    @property
    def type(self):
        return 'UniqueValueRenderer'

    def listMissingValues(self):
        return convertArcObjectToPythonObject(
            self._arc_object.listMissingValues(*gp_fixargs((), True)))

    def removeValues(self, values_or_items):
        """UniqueValueRenderer.removeValues(values_or_items)


        removeValues provides a mechanism to remove values in a unique value
        renderer.


        values_or_items(Dictionary):
        A dictionary based on a key that matches the group heading name and a
        value that represents a list of values as strings or a list of items to
        be added to the group.
        For example: removeValues({"group name" : ["str1", "str2", "str3"]}) The
        default value is None.
        """
        return convertArcObjectToPythonObject(
            self._arc_object.removeValues(*gp_fixargs((values_or_items,), True)))

    def addValues(self, values_or_items):
        return convertArcObjectToPythonObject(
            self._arc_object.addValues(*gp_fixargs((values_or_items,), True)))

    def __eq__(self, other):
        return other == 'UniqueValueRenderer'

class SimpleRenderer(Base_renderer):
    """The SimpleRenderer class represents a simple renderer that draws all features in a layer with a common symbol.
    """
    label = passthrough_attr('label')
    description = passthrough_attr('description')
    symbol = passthrough_attr('symbol')

    @property
    def type(self):
        return 'SimpleRenderer'

    def __eq__(self, other):
        return other == 'SimpleRenderer'

class Graduated_colors_renderer(Base_renderer):
    """The GraduatedColorsRenderer class represents the graduated color renderer definition that shows qualitative
    differences in feature values using a range of color.
    """
    classificationField = passthrough_attr('field')
    normalizationField = passthrough_attr('normalizationField')
    normalizationType = passthrough_attr('normalizationMethod')
    classificationMethod = passthrough_attr('classification')
    breakCount = passthrough_attr('breakCount')
    classBreaks = passthrough_attr('breaks')
    colorRamp = passthrough_attr('colorRamp')
    intervalSize = passthrough_attr('definedIntervalSize')
    deviationInterval = passthrough_attr('deviationInterval')
    lowerBound = passthrough_attr('lowerBound')

    @property
    def type(self):
        return 'GraduatedColorsRenderer'

    def __repr__(self):
        return '<graduated_colors_renderer object>'

    def __eq__(self, other):
        return other == 'GraduatedColorsRenderer'

class Graduated_symbols_renderer(Base_renderer):
    """The GraduatedSymbolsRenderer class represents the graduated symbols renderer definition that shows qualitative
    differences in feature values using a range of symbol sizes.
    """
    classificationField = passthrough_attr('field')
    normalizationField = passthrough_attr('normalizationField')
    normalizationType = passthrough_attr('normalizationMethod')
    classificationMethod = passthrough_attr('classification')
    breakCount = passthrough_attr('breakCount')
    classBreaks = passthrough_attr('breaks')
    minimumSymbolSize = passthrough_attr('minimumSymbolSize')
    maximumSymbolSize = passthrough_attr('maximumSymbolSize')
    symbolTemplate = passthrough_attr('symbolTemplate')
    backgroundSymbol = passthrough_attr('backgroundSymbol')
    colorRamp = passthrough_attr('colorRamp')
    intervalSize = passthrough_attr('definedIntervalSize')
    deviationInterval = passthrough_attr('deviationInterval')
    lowerBound = passthrough_attr('lowerBound')

    def updateSymbolTemplate(self, symbol_template):
        """GraduatedSymbolsRenderer.updateSymbolTemplate ({symbol_template})

              Provides a mechanism to change the renderer's symbol template.
              symbol_template{Object}:
                  A reference to a symbol.
                  The default value is None.
        """
        return convertArcObjectToPythonObject(
            self._arc_object.updateSymbolTemplate(*gp_fixargs((symbol_template,), True)))

    @property
    def type(self):
        return 'GraduatedSymbolsRenderer'

    def __repr__(self):
        return '<graduated_symbols_renderer object>'

    def __eq__(self, other):
        return other == 'GraduatedSymbolsRenderer'

class Unclassed_colors_renderer(Base_renderer):
    """Unclassed colors symbology is similar to graduated colors symbology
    in that it's used to make choropleth maps. While graduated colors symbology
    distributes data into discrete classes with unique symbols, unclassed colors
    symbology distributes a color scheme evenly across features.
    """
    field = passthrough_attr('UnclassedColorField')
    expression = passthrough_attr('expression')
    normalizationField = passthrough_attr('UnclassedColorNormalizationField')
    colorRamp = passthrough_attr('colorRamp')
    upperLabel = passthrough_attr('upperLabel')
    lowerLabel = passthrough_attr('lowerLabel')
    symbolTemplate = passthrough_attr('UnclassedColorSymbolTemplate')

    def updateSymbolTemplate(self, symbol_template):
        """UnclassedColorsRenderer.updateSymbolTemplate ({symbol_template})

              Provides a mechanism to change the renderer's symbol template.
              symbol_template{Object}:
                  A reference to a symbol.
                  The default value is None.
        """
        return convertArcObjectToPythonObject(
            self._arc_object.updateSymbolTemplate(*gp_fixargs((symbol_template,), True)))

    @property
    def type(self):
        return 'UnclassedColorsRenderer'

    def __repr__(self):
        return '<unclassed_colors_renderer object>'

    def __eq__(self, other):
        return other == 'UnclassedColorsRenderer'
