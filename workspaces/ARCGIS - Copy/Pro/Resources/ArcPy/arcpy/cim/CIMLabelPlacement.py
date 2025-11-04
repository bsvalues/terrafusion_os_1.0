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

class CIMGeneralPlacementProperties():
    """
      Represents general placement properties. This is base class for 
      general placement properties for each label engine.
    """
    def __init__(self, *args, **Kwargs):
        self.drawUnplacedLabels = False
        self.invertedLabelTolerance = 2.0
        self.rotateLabelWithDisplay = False
        self.unplacedLabelColor = 'CIMColor'
    
class CIMLabelClass():
    """
      Represents a label class which describes how to generate a set 
      of text labels from a group of features in a feature layer.
    """
    def __init__(self, *args, **Kwargs):
        self.expressionTitle = str()
        self.expression = str()
        self.expressionEngine = LabelExpressionEngine.VBScript
        self.featuresToLabel = FeaturesToLabel.AllVisibleFeatures
        self.maplexLabelPlacementProperties = 'CIMMaplexLabelPlacementProperties'
        self.maximumScale = 0.0
        self.minimumScale = 0.0
        self.name = str()
        self.priority = -1
        self.standardLabelPlacementProperties = 'CIMStandardLabelPlacementProperties'
        self.textSymbol = 'CIMSymbolReference'
        self.useCodedValue = True
        self.whereClause = str()
        self.visibility = False
        self.iD = -1
    
class CIMLabelClassProperties():
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMLabelPlacementProperties():
    """
      Represents label placement properties.
    """
    def __init__(self, *args, **Kwargs):
        self.featureType = LabelFeatureType.Line
    
class CIMMaplexDictionary():
    """
      Represents a Maplex dictionary.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.maplexDictionary = []
    
class CIMMaplexDictionaryEntry():
    """
      Represents a Maplex dictionary entry.
    """
    def __init__(self, *args, **Kwargs):
        self.abbreviation = str()
        self.text = str()
        self.maplexAbbreviationType = MaplexAbbreviationType.Translation
    
class CIMMaplexExternalZonePriorities():
    """
      Represents Maplex external zone priorities.
    """
    def __init__(self, *args, **Kwargs):
        self.aboveLeft = 4
        self.aboveCenter = 2
        self.aboveRight = 1
        self.centerRight = 3
        self.belowRight = 5
        self.belowCenter = 7
        self.belowLeft = 8
        self.centerLeft = 6
        self.center = 0
    
class CIMMaplexInternalZonePriorities():
    """
      Represents Maplex internal zone priorities.
    """
    def __init__(self, *args, **Kwargs):
        self.aboveLeft = 0
        self.aboveCenter = 0
        self.aboveRight = 0
        self.centerRight = 0
        self.belowRight = 0
        self.belowCenter = 0
        self.belowLeft = 0
        self.centerLeft = 0
        self.center = 1
    
class CIMMaplexKeyNumberGroup():
    """
      Represents a Maplex key number group.
    """
    def __init__(self, *args, **Kwargs):
        self.delimiterCharacter = str()
        self.horizontalAlignment = MaplexKeyNumberHorizontalAlignment.Left
        self.maximumNumberOfLines = 80
        self.minimumNumberOfLines = 2
        self.name = str()
        self.numberResetType = MaplexKeyNumberResetType.eNone
        self.keyNumberMethod = MaplexKeyNumberMethod.PreventUnplacedLabels
    
class CIMMaplexLabelStackingProperties():
    """
      Represents Maplex label stacking properties.
    """
    def __init__(self, *args, **Kwargs):
        self.stackAlignment = MaplexStackingAlignment.ChooseBest
        self.maximumNumberOfLines = 3
        self.minimumNumberOfCharsPerLine = 3
        self.maximumNumberOfCharsPerLine = 24
        self.separators = []
        self.trimStackingSeparators = True
    
class CIMMaplexOffsetAlongLineProperties():
    """
      Represents Maplex offset along the line properties.
    """
    def __init__(self, *args, **Kwargs):
        self.placementMethod = MaplexOffsetAlongLineMethod.BestPositionAlongLine
        self.labelAnchorPoint = MaplexLabelAnchorPoint.CenterOfLabel
        self.distance = 0.0
        self.tolerance = 0.0
        self.distanceUnit = MaplexUnit.Percentage
        self.useLineDirection = True
    
class CIMMaplexRotationProperties():
    """
      Represents Maplex rotation properties.
    """
    def __init__(self, *args, **Kwargs):
        self.enable = False
        self.rotationType = MaplexLabelRotationType.Arithmetic
        self.rotationField = str()
        self.perpendicularToAngle = False
        self.alignLabelToAngle = False
        self.alignmentType = MaplexRotationAlignmentType.Straight
        self.additionalAngle = 0
        self.rotationExpressionInfo = 'CIMExpressionInfo'
    
class CIMMaplexStackingSeparator():
    """
      Represents a Maplex stacking separator.
    """
    def __init__(self, *args, **Kwargs):
        self.separator = str()
        self.visible = False
        self.splitForced = False
        self.splitAfter = True
    
class CIMMaplexStrategyPriorities():
    """
      Represents Maplex strategy priorities.
    """
    def __init__(self, *args, **Kwargs):
        self.stacking = 1
        self.overrun = 2
        self.fontCompression = 3
        self.fontReduction = 4
        self.abbreviation = 5
    
class CIMStandardLineLabelPosition():
    """
      Represents standard label engine line label position.
    """
    def __init__(self, *args, **Kwargs):
        self.produceCurvedLabels = False
        self.above = True
        self.below = False
        self.onTop = False
        self.left = False
        self.right = False
        self.inLine = True
        self.atStart = False
        self.atEnd = False
        self.parallel = True
        self.perpendicular = False
        self.horizontal = False
        self.offset = 0.0
    
class CIMStandardLineLabelPriorities():
    """
      Represents standard label engine line label priorities.
    """
    def __init__(self, *args, **Kwargs):
        self.aboveBefore = 0
        self.aboveStart = 3
        self.aboveAlong = 3
        self.aboveEnd = 3
        self.aboveAfter = 0
        self.centerBefore = 0
        self.centerStart = 3
        self.centerAlong = 3
        self.centerEnd = 3
        self.centerAfter = 0
        self.belowBefore = 0
        self.belowStart = 3
        self.belowAlong = 3
        self.belowEnd = 3
        self.belowAfter = 0
    
class CIMStandardPointPlacementPriorities():
    """
      Represents standard label engine point placement priorities.
    """
    def __init__(self, *args, **Kwargs):
        self.aboveLeft = 2
        self.aboveCenter = 2
        self.aboveRight = 1
        self.centerLeft = 3
        self.centerRight = 2
        self.belowLeft = 3
        self.belowCenter = 3
        self.belowRight = 2
    
class CIMMaplexGeneralPlacementProperties(CIMGeneralPlacementProperties):
    """
      Represents Maplex general placement properties.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.allowBorderOverlap = False
        self.dictionaries = []
        self.keyNumberGroups = []
        self.placementQuality = MaplexQualityType.Low
    
class CIMMaplexLabelPlacementProperties(CIMLabelPlacementProperties):
    """
      Represents Maplex label placement properties.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.alignLabelToLineDirection = False
        self.allowAsymmetricOverrun = False
        self.allowStraddleStacking = False
        self.alternateLabelExpressionInfo = 'CIMExpressionInfo'
        self.avoidOverlappingLabeledPolygonsAsIfHoles = False
        self.avoidPolygonHoles = True
        self.backgroundLabel = False
        self.boundaryLabelingAllowHoles = False
        self.boundaryLabelingAllowSingleSided = False
        self.boundaryLabelingSingleSidedOnLine = False
        self.canAbbreviateLabel = False
        self.canFlipStackedStreetLabel = False
        self.canKeyNumberLabel = False
        self.canOverrunFeature = True
        self.canPlaceLabelOnTopOfFeature = False
        self.canPlaceLabelOutsidePolygon = True
        self.canReduceFontSize = False
        self.canReduceLeading = False
        self.canRemoveOverlappingLabel = True
        self.canShiftPointLabel = False
        self.canStackLabel = True
        self.canTruncateLabel = False
        self.canUseAlternateLabelExpression = False
        self.centerLabelAnchorType = MaplexCenterLabelAnchorType.Symbol
        self.connectionType = MaplexConnectionType.Unambiguous
        self.constrainOffset = MaplexConstrainOffset.NoConstraint
        self.contourAlignmentType = MaplexContourAlignmentType.Page
        self.contourLadderType = MaplexContourLadderType.Straight
        self.contourMaximumAngle = 90
        self.dictionaryName = str()
        self.enableConnection = True
        self.enablePointPlacementPriorities = False
        self.enablePolygonFixedPosition = False
        self.enableSecondaryOffset = False
        self.featureWeight = 100
        self.fontHeightReductionLimit = 4.0
        self.fontHeightReductionStep = 0.5
        self.fontWidthReductionLimit = 90.0
        self.fontWidthReductionStep = 5.0
        self.graticuleAlignment = False
        self.graticuleAlignmentType = MaplexGraticuleAlignmentType.Straight
        self.isLabelBufferHardConstraint = False
        self.isMinimumSizeBasedOnArea = False
        self.isOffsetFromFeatureGeometry = False
        self.keyNumberGroupName = str()
        self.labelBuffer = 15
        self.labelLargestPolygon = True
        self.labelPriority = -1
        self.labelStackingProperties = 'CIMMaplexLabelStackingProperties'
        self.lineFeatureType = MaplexLineFeatureType.General
        self.linePlacementMethod = MaplexLinePlacementMethod.OffsetCurvedFromLine
        self.maximumCharacterSpacing = 0.0
        self.maximumLabelOverrun = 36.0
        self.maximumLabelOverrunUnit = MaplexUnit.Point
        self.maximumWordSpacing = 0.0
        self.measureFromClippedFeatureGeometry = False
        self.minimumEndOfStreetClearance = 0.0
        self.minimumFeatureSizeUnit = MaplexUnit.Map
        self.minimumRepetitionInterval = 0.0
        self.minimumSizeForLabeling = 0.0
        self.multiPartOption = MaplexMultiPartOption.OneLabelPerPart
        self.neverRemoveLabel = False
        self.offsetAlongLineProperties = 'CIMMaplexOffsetAlongLineProperties'
        self.pointExternalZonePriorities = 'CIMMaplexExternalZonePriorities'
        self.pointPlacementMethod = MaplexPointPlacementMethod.AroundPoint
        self.polygonAnchorPointType = MaplexAnchorPointType.GeometricCenter
        self.polygonBoundaryWeight = 200
        self.polygonExternalZones = 'CIMMaplexExternalZonePriorities'
        self.polygonFeatureType = MaplexPolygonFeatureType.General
        self.polygonInternalZones = 'CIMMaplexInternalZonePriorities'
        self.polygonPlacementMethod = MaplexPolygonPlacementMethod.CurvedInPolygon
        self.preferHorizontalPlacement = False
        self.preferLabelNearJunction = False
        self.preferLabelNearJunctionClearance = 0.0
        self.preferLabelNearMapBorder = False
        self.preferLabelNearMapBorderClearance = 0.0
        self.preferredEndOfStreetClearance = 0.0
        self.primaryOffset = 1.0
        self.primaryOffsetUnit = MaplexUnit.Point
        self.removeAmbiguousLabels = MaplexRemoveAmbiguousLabelsType.All
        self.removeExtraLineBreaks = False
        self.removeExtraWhiteSpace = True
        self.repeatLabel = False
        self.repetitionIntervalUnit = MaplexUnit.Map
        self.rotationProperties = 'CIMMaplexRotationProperties'
        self.secondaryOffset = 100.0
        self.secondaryOffsetMaximum = 0.0
        self.secondaryOffsetMinimum = 0.0
        self.secondaryOffsetUnit = MaplexUnit.Percentage
        self.spreadCharacters = False
        self.spreadWords = False
        self.strategyPriorities = 'CIMMaplexStrategyPriorities'
        self.thinDuplicateLabels = False
        self.thinningDistance = 0.0
        self.thinningDistanceUnit = MaplexUnit.Map
        self.truncationMarkerCharacter = str()
        self.truncationMinimumLength = 1
        self.truncationPreferredCharacters = str()
        self.useExactSymbolOutline = False
        self.truncationExcludedCharacters = str()
        self.polygonAnchorPointPerimeterInset = 0.0
        self.polygonAnchorPointPerimeterInsetUnit = MaplexUnit.Point
    
class CIMStandardGeneralPlacementProperties(CIMGeneralPlacementProperties):
    """
      Represents standard label engine general placement properties.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMStandardLabelPlacementProperties(CIMLabelPlacementProperties):
    """
      Represents standard label engine label placement properties.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.featureWeight = StandardFeatureWeight.eNone
        self.labelWeight = StandardLabelWeight.High
        self.numLabelsOption = StandardNumLabelsOption.OneLabelPerName
        self.lineLabelPosition = 'CIMStandardLineLabelPosition'
        self.lineLabelPriorities = 'CIMStandardLineLabelPriorities'
        self.pointPlacementMethod = StandardPointPlacementMethod.AroundPoint
        self.pointPlacementPriorities = 'CIMStandardPointPlacementPriorities'
        self.pointPlacementAngles = []
        self.bufferRatio = 0.0
        self.lineOffset = 0.0
        self.maxDistanceFromTarget = 0.0
        self.rotationType = StandardLabelRotationType.Arithmetic
        self.rotationField = str()
        self.perpendicularToAngle = False
        self.polygonPlacementMethod = StandardPolygonPlacementMethod.AlwaysHorizontal
        self.placeOnlyInsidePolygon = False
        self.allowOverlappingLabels = False
    
