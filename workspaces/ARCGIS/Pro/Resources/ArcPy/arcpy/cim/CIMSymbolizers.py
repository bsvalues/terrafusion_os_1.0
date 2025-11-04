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

class CIMBivariateFieldInfo():
    """
      Contains a collection of properties that describe a bivariate attribute 
      field.
    """
    """
      Contains a collection of properties that describe a bivariate attribute 
      field.
    """
    def __init__(self, *args, **Kwargs):
        self.normalizationField = str()
        self.normalizationTotal = 0.0
        self.normalizationType = DataNormalizationMethod.Nothing
        self.classificationMethod = ClassificationMethod.NaturalBreaks
        self.field = str()
        self.valueExpressionInfo = 'CIMExpressionInfo'
        self.defaultLabel = str()
        self.minimumBreak = 0
        self.upperBounds = []
    
class CIMClassBreak():
    """
      Represents a class break.
    """
    def __init__(self, *args, **Kwargs):
        self.criticalBreak = False
        self.description = str()
        self.label = str()
        self.patch = PatchShape.Default
        self.symbol = 'CIMSymbolReference'
        self.upperBound = 0
        self.alternateSymbols = []
        self.customPatch = 'CIMLegendPatch'
    
class CIMExpressionInfo():
    """
      Represents the properties required for authoring an Arcade expression.
    """
    def __init__(self, *args, **Kwargs):
        self.title = str()
        self.expression = str()
        self.name = str()
        self.returnType = ExpressionReturnType.Default
    
class CIMLegendPatch():
    """
      Represents a custom legend patch, the small lines or rectangles 
      used to display legend classes.
    """
    def __init__(self, *args, **Kwargs):
        self.geometryURI = str()
    
class CIMPrimitiveOverride():
    """
      Represents a primitive override.
    """
    def __init__(self, *args, **Kwargs):
        self.primitiveName = str()
        self.propertyName = str()
        self.expression = str()
        self.valueExpressionInfo = 'CIMExpressionInfo'
    
class CIMProportionalPieSizeOptions():
    """
      Represents proportional pie size options.
    """
    def __init__(self, *args, **Kwargs):
        self.flanneryCompensation = True
        self.minimumSize = 12.0
        self.minimumValue = 0
        self.maximumSize = 0
        self.maximumValue = 0
        self.proportionalBySum = True
        self.proportionalFieldName = str()
        self.proportionalExpressionInfo = 'CIMExpressionInfo'
    
class CIMRenderer():
    """
      Represents a renderer.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMRendererAuthoringInfo():
    """
      Represents additional authoring properties used by a renderer.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMRuleSymbolLayerNames():
    """
      Represents rule symbol layer names.
    """
    def __init__(self, *args, **Kwargs):
        self.ruleID = 0
        self.symbolLayerNames = []
    
class CIMScaleDependentSizeVariation():
    """
      Represents the scale dependent size variations for a symbol reference.
    """
    def __init__(self, *args, **Kwargs):
        self.scale = 0.0
        self.size = 4.0
    
class CIMStringMap():
    """
      Represents a string map of key value pairs.
    """
    def __init__(self, *args, **Kwargs):
        self.key = str()
        self.value = str()
    
class CIMSymbolReference():
    """
      Represents a symbol reference.
    """
    def __init__(self, *args, **Kwargs):
        self.primitiveOverrides = []
        self.stylePath = str()
        self.symbol = 'CIMSymbol'
        self.symbolName = str()
        self.minScale = 0.0
        self.maxScale = 0.0
        self.scaleDependentSizeVariation = []
        self.minDistance = 0.0
        self.maxDistance = 0.0
    
class CIMSymbolizationRule():
    """
      Represents a symbolization rule.
    """
    def __init__(self, *args, **Kwargs):
        self.minScale = 0.0
        self.maxScale = 0.0
        self.filter = str()
        self.symbol = 'CIMSymbolReference'
        self.label = str()
        self.description = str()
    
class CIMUniqueValue():
    """
      Represents a unique value.
    """
    def __init__(self, *args, **Kwargs):
        self.fieldValues = []
    
class CIMUniqueValueClass():
    """
      Represents a unique value class.
    """
    def __init__(self, *args, **Kwargs):
        self.description = str()
        self.editable = False
        self.label = str()
        self.patch = PatchShape.Default
        self.symbol = 'CIMSymbolReference'
        self.values = []
        self.visible = True
        self.alternateSymbols = []
        self.customPatch = 'CIMLegendPatch'
    
class CIMUniqueValueGroup():
    """
      Represents a unique value group.
    """
    def __init__(self, *args, **Kwargs):
        self.classes = []
        self.heading = str()
    
class CIMUnitSymbolization():
    """
      Represents unit symbolization.
    """
    def __init__(self, *args, **Kwargs):
        self.valueRepresentation = ValueRepresentations.Radius
        self.valueUnit = str()
        self.symbolShape = SymbolShapes.Circle
    
class CIMVisualVariable():
    """
      Represents a visual variable.
    """
    def __init__(self, *args, **Kwargs):
        self.authoringInfo = 'CIMVisualVariableAuthoringInfo'
    
class CIMVisualVariableAuthoringInfo():
    """
      Represents visual variable metadata used for authoring.
    """
    def __init__(self, *args, **Kwargs):
        self.minSliderValue = 0.0
        self.maxSliderValue = 0.0
        self.theme = str()
        self.showLegend = False
        self.heading = str()
    
class CIMVisualVariableInfo():
    """
      Represents visual variable info.
    """
    def __init__(self, *args, **Kwargs):
        self.expression = str()
        self.randomMax = 1.0
        self.randomMin = 0.0
        self.visualVariableInfoType = VisualVariableInfoType.eNone
        self.valueExpressionInfo = 'CIMExpressionInfo'
    
class CIMVisualVariableLevel():
    """
      Represents a level-of-detail for a multilevel visual variable.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = -1
        self.minValue = 0.0
        self.maxValue = 1.0
        self.mean = 0.0
        self.standardDeviation = 0.0
    
class CIMAreaLegendPatch(CIMLegendPatch):
    """
      Represents an area legend patch, small rectangles used to display 
      legend classes.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMChartRenderer(CIMRenderer):
    """
      Represents chart renderer which contains properties common to all 
      symbolizers that depict some feature value as a chart drawn on 
      top of the feature itself.
    """
    """
      Represents chart renderer which contains properties common to all 
      symbolizers that depict some feature value as a chart drawn on 
      top of the feature itself.
    """
    """
      Represents chart renderer which contains properties common to all 
      symbolizers that depict some feature value as a chart drawn on 
      top of the feature itself.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.normalizationField = str()
        self.normalizationTotal = 0.0
        self.normalizationType = DataNormalizationMethod.Nothing
        self.barrierWeight = BarrierWeight.High
        self.baseSymbol = 'CIMSymbolReference'
        self.chartSymbol = 'CIMSymbolReference'
        self.fieldNames = []
        self.fieldTotals = []
        self.label = str()
        self.maxValue = 0
        self.preventChartOverlap = True
        self.proportionalPieSizeOptions = 'CIMProportionalPieSizeOptions'
        self.colorRamp = 'CIMColorRamp'
        self.fieldLabels = []
        self.showSizeLegend = True
        self.sizeLegendOutlineColor = 'CIMColor'
        self.sizeLegendLeaderlineColor = 'CIMColor'
        self.drawChartSymbolsAboveAllLayers = True
        self.exclusionClause = str()
        self.exclusionDescription = str()
        self.exclusionLabel = str()
        self.exclusionSymbol = 'CIMSymbolReference'
        self.useExclusionSymbol = True
        self.exclusionSymbolPatch = PatchShape.Default
        self.exclusionSymbolCustomPatch = 'CIMLegendPatch'
    
class CIMClassBreaksRendererBase(CIMRenderer):
    """
      The base class for class breaks renderer types.
    """
    """
      The base class for class breaks renderer types.
    """
    """
      The base class for class breaks renderer types.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.sampleSize = 10000
        self.classificationMethod = ClassificationMethod.NaturalBreaks
        self.breaks = []
        self.minimumBreak = 0.0
        self.showClassGaps = False
        self.showInAscendingOrder = True
        self.useDefaultSymbol = False
        self.defaultSymbolPatch = PatchShape.Default
        self.defaultSymbol = 'CIMSymbolReference'
        self.defaultLabel = str()
        self.defaultDescription = str()
        self.numberFormat = 'CIMNumberFormat'
        self.defaultSymbolCustomPatch = 'CIMLegendPatch'
        self.alwaysUpdateClassLabels = True
        self.backgroundSymbol = 'CIMSymbolReference'
        self.barrierWeight = BarrierWeight.High
        self.classBreakType = ClassBreakType.GraduatedColor
        self.colorRamp = 'CIMColorRamp'
        self.field = str()
        self.heading = str()
        self.minimumLabel = str()
        self.valueExpressionInfo = 'CIMExpressionInfo'
        self.polygonSymbolColorTarget = PolygonSymbolColorTarget.Fill
        self.drawGraduatedSymbolsAboveAllLayers = True
    
class CIMColorVisualVariable(CIMVisualVariable):
    """
      Represents a color visual variable.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.expression = str()
        self.minValue = 0.0
        self.maxValue = 1.0
        self.colorRamp = 'CIMColorRamp'
        self.normalizationField = str()
        self.normalizationType = DataNormalizationMethod.Nothing
        self.valueExpressionInfo = 'CIMExpressionInfo'
        self.polygonSymbolColorTarget = PolygonSymbolColorTarget.Fill
    
class CIMDictionaryRenderer(CIMRenderer):
    """
      Represents a dictionary renderer where symbols are drawn from a 
      symbol dictionary.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dictionaryName = str()
        self.fieldMap = []
        self.scalingExpressionInfo = 'CIMExpressionInfo'
    
class CIMDotDensityRenderer(CIMRenderer):
    """
      Represents a dot density renderer.
    """
    """
      Represents a dot density renderer.
    """
    """
      Represents a dot density renderer.
    """
    """
      Represents a dot density renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.sampleSize = 10000
        self.visualVariables = []
        self.exclusionClause = str()
        self.exclusionDescription = str()
        self.exclusionLabel = str()
        self.exclusionSymbol = 'CIMSymbolReference'
        self.useExclusionSymbol = True
        self.exclusionSymbolPatch = PatchShape.Default
        self.exclusionSymbolCustomPatch = 'CIMLegendPatch'
        self.colorRamp = 'CIMColorRamp'
        self.dotDensitySymbol = 'CIMSymbolReference'
        self.dotSize = 2.0
        self.dotValue = 0.0
        self.excludeDotsFromMaskedArea = False
        self.fieldNames = []
        self.fieldLabels = []
        self.maintainDensity = False
        self.maskingLayer = str()
        self.randomSeed = 0
        self.referenceScale = 0.0
        self.useMasking = False
        self.valueExpressionInfos = []
        self.symbolLabel = str()
        self.unitLabel = str()
    
class CIMHeatMapRenderer(CIMRenderer):
    """
      Represents a heat map renderer.
        /// The Heat Map Renderer draws point features as a continuous 
      /// color gradient representing the density of the points. The 
      resulting /// density surface represents the physical proximity 
      between points, /// optionally weighted by a specified attribute 
      value. The displayed /// raster surface is dynamic and morphs according 
      to the zoom level /// and updates if the source point features 
      are edited.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colorScheme = 'CIMColorRamp'
        self.field = str()
        self.radius = 10
        self.rendererQuality = 7
        self.heading = str()
        self.minLabel = str()
        self.maxLabel = str()
        self.maxPixelIntensity = 0.0
        self.pixelIntensityStops = []
        self.autoAdjustPixelIntensity = True
        self.maxPixelIntensityReferenceScale = 0.0
        self.referenceScale = 0.0
    
class CIMLineLegendPatch(CIMLegendPatch):
    """
      Represents a line legend patch, small lines used to display legend 
      classes.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMMultilevelVisualVariable(CIMVisualVariable):
    """
      Represents a visual variable with different levels-of-detail, each 
      with its own minimum and maximum data values. Used for binning 
      layers.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.levels = []
    
class CIMProportionalRenderer(CIMRenderer):
    """
      Represents a proportional renderer.
    """
    """
      Represents a proportional renderer.
    """
    """
      Represents a proportional renderer.
    """
    """
      Represents a proportional renderer.
    """
    """
      Represents a proportional renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.sampleSize = 10000
        self.visualVariables = []
        self.normalizationField = str()
        self.normalizationTotal = 0.0
        self.normalizationType = DataNormalizationMethod.Nothing
        self.exclusionClause = str()
        self.exclusionDescription = str()
        self.exclusionLabel = str()
        self.exclusionSymbol = 'CIMSymbolReference'
        self.useExclusionSymbol = True
        self.exclusionSymbolPatch = PatchShape.Default
        self.exclusionSymbolCustomPatch = 'CIMLegendPatch'
        self.backgroundSymbol = 'CIMSymbolReference'
        self.barrierWeight = BarrierWeight.High
        self.field = str()
        self.flanneryCompensation = False
        self.legendSymbolCount = 3
        self.maxDataValue = 0
        self.minDataValue = 0
        self.minSymbol = 'CIMSymbolReference'
        self.unitSymbolization = 'CIMUnitSymbolization'
        self.heading = str()
        self.useDefaultSymbol = False
        self.defaultSymbol = 'CIMSymbolReference'
        self.defaultSymbolPatch = PatchShape.Default
        self.defaultLabel = str()
        self.defaultDescription = str()
        self.showInAscendingOrder = False
        self.valueExpressionInfo = 'CIMExpressionInfo'
        self.drawProportionalSymbolsAboveAllLayers = True
        self.defaultSymbolCustomPatch = 'CIMLegendPatch'
    
class CIMRepresentationRenderer(CIMRenderer):
    """
      Represents a representation renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.drawInvalidRule = True
        self.drawInvisibleRepresentation = False
        self.invalidRuleColor = 'CIMColor'
        self.invisibleRepresentationColor = 'CIMColor'
        self.representationClassName = str()
        self.ruleLegendVisibility = []
        self.symbolLayerNameMapping = []
    
class CIMRotationVisualVariable(CIMVisualVariable):
    """
      Represents a rotation visual variable.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.visualVariableInfoX = 'CIMVisualVariableInfo'
        self.visualVariableInfoY = 'CIMVisualVariableInfo'
        self.visualVariableInfoZ = 'CIMVisualVariableInfo'
        self.rotationTypeZ = SymbolRotationType.Arithmetic
        self.normalToSurface = False
    
class CIMRuleRenderer(CIMRenderer):
    """
      Represents a rule renderer.
    """
    """
      Represents a rule renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.visualVariables = []
        self.rules = []
    
class CIMSimpleRenderer(CIMRenderer):
    """
      Represents a simple renderer.
    """
    """
      Represents a simple renderer.
    """
    """
      Represents a simple renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.sampleSize = 10000
        self.visualVariables = []
        self.description = str()
        self.label = str()
        self.patch = PatchShape.Default
        self.symbol = 'CIMSymbolReference'
        self.alternateSymbols = []
        self.customPatch = 'CIMLegendPatch'
    
class CIMSizeVisualVariable(CIMVisualVariable):
    """
      Represents a size visual variable.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.expression = str()
        self.randomMin = 0.0
        self.randomMax = 1.0
        self.minSize = 0.0
        self.maxSize = 1.0
        self.minValue = 0.0
        self.maxValue = 1.0
        self.valueUnits = str()
        self.valueRepresentation = ValueRepresentations.Radius
        self.variableType = SizeVisualVariableType.eNone
        self.valueShape = SymbolShapes.Unknown
        self.axis = SizeVisualVariableAxis.HeightAxis
        self.target = str()
        self.normalizationField = str()
        self.normalizationType = DataNormalizationMethod.Nothing
        self.sizeValues = []
        self.dataValues = []
        self.valueExpressionInfo = 'CIMExpressionInfo'
    
class CIMTransparencyVisualVariable(CIMVisualVariable):
    """
      Represents a transparency visual variable.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.field = str()
        self.transparencyValues = []
        self.dataValues = []
        self.normalizationField = str()
        self.normalizationTotal = 0.0
        self.normalizationType = DataNormalizationMethod.Nothing
        self.valueExpressionInfo = 'CIMExpressionInfo'
    
class CIMUniqueValueRenderer(CIMRenderer):
    """
      Represents a unique value renderer.
    """
    """
      Represents a unique value renderer.
    """
    """
      Represents a unique value renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.sampleSize = 10000
        self.visualVariables = []
        self.colorRamp = 'CIMColorRamp'
        self.defaultDescription = str()
        self.defaultLabel = str()
        self.defaultSymbol = 'CIMSymbolReference'
        self.defaultSymbolPatch = PatchShape.Default
        self.fields = []
        self.groups = []
        self.useDefaultSymbol = False
        self.isDefaultSymbolVisible = True
        self.styleGallery = str()
        self.valueExpressionInfo = 'CIMExpressionInfo'
        self.polygonSymbolColorTarget = PolygonSymbolColorTarget.Fill
        self.authoringInfo = 'CIMUniqueValueRendererAuthoringInfo'
        self.defaultSymbolCustomPatch = 'CIMLegendPatch'
        self.showClassVisibility = False
    
class CIMUniqueValueRendererAuthoringInfo(CIMRendererAuthoringInfo):
    """
      Represents additional authoring properties used by a unique value 
      renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMBivariateRendererAuthoringInfo(CIMUniqueValueRendererAuthoringInfo):
    """
      Represents additional authoring properties used by a bivariate 
      choropleth renderer.
    """
    """
      Represents additional authoring properties used by a bivariate 
      choropleth renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.sampleSize = 10000
        self.fieldInfos = []
        self.gridSize = BivariateGridSizeOption.TwoByTwo
        self.gridOrientation = BivariateGridLegendOrientationType.eNone
        self.gridLabelOption = BivariateGridLegendLabelStrategy.Corners
        self.templateSymbol = 'CIMSymbolReference'
    
class CIMClassBreaksRenderer(CIMClassBreaksRendererBase):
    """
      Represents a class break renderer.
    """
    """
      Represents a class break renderer.
    """
    """
      Represents a class break renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.normalizationField = str()
        self.normalizationTotal = 0.0
        self.normalizationType = DataNormalizationMethod.Nothing
        self.exclusionClause = str()
        self.exclusionDescription = str()
        self.exclusionLabel = str()
        self.exclusionSymbol = 'CIMSymbolReference'
        self.useExclusionSymbol = True
        self.exclusionSymbolPatch = PatchShape.Default
        self.exclusionSymbolCustomPatch = 'CIMLegendPatch'
        self.visualVariables = []
    
class CIMColorClassBreaksVisualVariable(CIMColorVisualVariable):
    """
      Represents a classified color visual variable.
    """
    """
      Represents a classified color visual variable.
    """
    """
      Represents a classified color visual variable.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.classificationMethod = ClassificationMethod.NaturalBreaks
        self.breaks = []
        self.minimumBreak = 0.0
        self.showClassGaps = False
        self.showInAscendingOrder = True
        self.useDefaultSymbol = False
        self.defaultSymbolPatch = PatchShape.Default
        self.defaultSymbol = 'CIMSymbolReference'
        self.defaultLabel = str()
        self.defaultDescription = str()
        self.numberFormat = 'CIMNumberFormat'
        self.defaultSymbolCustomPatch = 'CIMLegendPatch'
        self.alwaysUpdateClassLabels = True
        self.colorChannelTarget = ColorChannelTarget.All
        self.classBreaksLegendVisualVariableOptions = ClassBreaksLegendVisualVariableOptions.ShowVisualVariableSymbolClasses
        self.useClassBreaks = False
    
class CIMMultilevelColorVisualVariable(CIMMultilevelVisualVariable):
    """
      Represents a color visual variable with different levels-of-detail.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colorRamp = 'CIMColorRamp'
        self.normalizationField = str()
        self.normalizationType = DataNormalizationMethod.Nothing
        self.valueExpressionInfo = 'CIMExpressionInfo'
        self.polygonSymbolColorTarget = PolygonSymbolColorTarget.Fill
    
class CIMMultilevelSizeVisualVariable(CIMMultilevelVisualVariable):
    """
      Represents a size visual variable with different levels-of-detail.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.minSize = 0.0
        self.maxSize = 1.0
        self.valueRepresentation = ValueRepresentations.Radius
        self.variableType = SizeVisualVariableType.eNone
        self.valueShape = SymbolShapes.Unknown
        self.axis = SizeVisualVariableAxis.HeightAxis
        self.target = str()
        self.normalizationField = str()
        self.normalizationType = DataNormalizationMethod.Nothing
        self.valueExpressionInfo = 'CIMExpressionInfo'
    
class CIMSizeClassBreaksVisualVariable(CIMSizeVisualVariable):
    """
      Represents a classified size visual variable.
    """
    """
      Represents a classified size visual variable.
    """
    """
      Represents a classified size visual variable.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.classBreaksLegendVisualVariableOptions = ClassBreaksLegendVisualVariableOptions.ShowVisualVariableSymbolClasses
        self.useClassBreaks = False
        self.classificationMethod = ClassificationMethod.NaturalBreaks
        self.breaks = []
        self.minimumBreak = 0.0
        self.showClassGaps = False
        self.showInAscendingOrder = True
        self.useDefaultSymbol = False
        self.defaultSymbolPatch = PatchShape.Default
        self.defaultSymbol = 'CIMSymbolReference'
        self.defaultLabel = str()
        self.defaultDescription = str()
        self.numberFormat = 'CIMNumberFormat'
        self.defaultSymbolCustomPatch = 'CIMLegendPatch'
        self.alwaysUpdateClassLabels = True
        self.templateSymbol = 'CIMSymbolReference'
        self.drawSizeMarkerSymbolsAboveAllLayers = True
    
