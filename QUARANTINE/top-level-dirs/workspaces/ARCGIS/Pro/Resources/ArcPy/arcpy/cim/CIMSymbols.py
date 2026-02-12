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

class CIM3DMarkerGraphic():
    """
      Represents a 3D marker graphic.
    """
    def __init__(self, *args, **Kwargs):
        self.primitiveType = PrimitiveType3D.TriangleStrip
        self.diffuseColor = 'CIMColor'
        self.shapeVerticesCollectionIndex = 0
        self.isSubstitutionAllowed = True
        self.materialProperties = 'CIMMaterialProperties'
        self.entityID = -1
        self.offsetIntoShapeVertices = 0
        self.countOfShapeVertices = 0
        self.patchPriority = -1
        self.textureIndex = -1
    
class CIM3DMarkerLOD():
    """
      Represents a 3D Marker LOD.
    """
    def __init__(self, *args, **Kwargs):
        self.markerGraphics = []
        self.entityNames = str()
    
class CIM3DSymbolProperties():
    """
      Represents 3D symbol properties, a collection of symbol properties 
      that apply when the symbol is used in a 3D context.
    """
    def __init__(self, *args, **Kwargs):
        self.dominantSizeAxis3D = DominantSizeAxis.Z
        self.rotationOrder3D = RotationOrder.YXZ
        self.scaleZ = 1.0
        self.scaleY = 1.0
    
class CIMAnimatedSymbolProperties():
    """
      Represents animated symbol properties, a collection of symbol properties 
      that apply when the symbol layer has animation data.
    """
    def __init__(self, *args, **Kwargs):
        self.playAnimation = False
        self.reverseAnimation = False
        self.randomizeStartTime = False
        self.randomizeStartSeed = 0
        self.startTimeOffset = 0
        self.duration = 3.0
        self.endingDuration = 3.0
        self.useEndingDuration = False
        self.repeatType = AnimatedSymbolRepeatType.Loop
        self.repeatDelay = 0.0
        self.primitiveName = str()
        self.easing = AnimatedSymbolEasingType.Linear
    
class CIMCGAAttribute():
    """
      Represents a CGA attribute, the symbol attribute as specified by 
      the CGA code in the rule package.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.cGAAttributeType = CGAAttributeType.Float
        self.value = object()
        self.values = list()
        self.arrayRowCount = 1
    
class CIMCallout():
    """
      Represents a callout.
    """
    def __init__(self, *args, **Kwargs):
        self.leaderTolerance = 0
        self.leaderOffset = 0
    
class CIMChartPart():
    """
      Represents a chart part, individual components of the chart marker.
    """
    def __init__(self, *args, **Kwargs):
        self.value = 0.0
        self.polygonSymbol = 'CIMPolygonSymbol'
    
class CIMClippingPath():
    """
      Represents a vector marker clipping path.
    """
    def __init__(self, *args, **Kwargs):
        self.clippingType = ClippingType.Intersect
        self.path = GetPythonClass('arcpy', 'Polygon')
    
class CIMColorSubstitution():
    """
      Represents color substitution, an ordered list of color substitutes.
    """
    def __init__(self, *args, **Kwargs):
        self.oldColor = 'CIMColor'
        self.newColor = 'CIMColor'
    
class CIMCompositeTextPartPosition():
    """
      Represents the text part position properties on a callout part.
    """
    def __init__(self, *args, **Kwargs):
        self.horizontalAlignment = HorizontalAlignment.Center
        self.verticalAlignment = VerticalAlignment.Bottom
        self.xOffset = 0.0
        self.yOffset = 0.0
        self.splitOffset = 0.0
        self.isPartWithinCalloutBox = False
    
class CIMFontVariation():
    """
      Represents a font variation tag name and value. This is sometimes 
      referred to as a variation-axis tag and variation-axis value.
    """
    def __init__(self, *args, **Kwargs):
        self.tagName = str()
        self.value = 0.0
    
class CIMGeometricEffect():
    """
      Represents a geometric effect, this is base class for all geometric 
      effects.
    """
    def __init__(self, *args, **Kwargs):
        self.primitiveName = str()
    
class CIMMarkerGraphic():
    """
      Represents a marker graphic which is used to define vector graphics 
      in a vector marker.
    """
    def __init__(self, *args, **Kwargs):
        self.geometry = GetPythonClass('arcpy', 'Geometry')
        self.symbol = 'CIMSymbol'
        self.textString = str()
        self.primitiveName = str()
    
class CIMMarkerPlacement():
    """
      Represents a marker placement.
    """
    def __init__(self, *args, **Kwargs):
        self.primitiveName = str()
        self.placePerPart = False
    
class CIMMaterialProperties():
    """
      Represents material properties.
    """
    def __init__(self, *args, **Kwargs):
        self.specularColor = 'CIMColor'
        self.shininess = 0.0
        self.externalColorMixMode = ExternalColorMixMode.Multiply
    
class CIMObjectMarker3DLOD():
    """
      Represents a level of detail of an object marker 3D.
    """
    def __init__(self, *args, **Kwargs):
        self.faceCount = 0
        self.modelURI = str()
    
class CIMShapeVertex():
    """
      Represents a shape vertex.
    """
    def __init__(self, *args, **Kwargs):
        self.position = GetPythonClass('arcpy', 'Point')
        self.normalVector = GetPythonClass('arcpy', 'Point')
        self.textureCoordinate = GetPythonClass('arcpy', 'Point')
    
class CIMShapeVertices():
    """
      Represents shape vertices.
    """
    def __init__(self, *args, **Kwargs):
        self.indices = 0
        self.shapes = str()
    
class CIMSymbol():
    """
      Represents a symbol. A symbol is used to describe how a geometric 
      shape, such as that from a graphic or feature, is displayed.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMSymbolAnimation():
    """
      Represents an animation of a symbol, this is the base class for 
      all animations.
    """
    def __init__(self, *args, **Kwargs):
        self.animatedSymbolProperties = 'CIMAnimatedSymbolProperties'
        self.primitiveName = str()
    
class CIMSymbolLayer():
    """
      Represents a symbol layer. Symbol layers are the components that 
      make up a symbol. A symbol layer is represented by a stroke, fill, 
      marker, or procedural symbol layer.
    """
    def __init__(self, *args, **Kwargs):
        self.animations = []
        self.effects = []
        self.enable = True
        self.name = str()
        self.colorLocked = False
        self.primitiveName = str()
        self.overprint = False
    
class CIMTextMargin():
    """
      Represents a text margin which defines the margin to apply around 
      text.
    """
    def __init__(self, *args, **Kwargs):
        self.left = 5.0
        self.right = 5.0
        self.top = 5.0
        self.bottom = 5.0
    
class CIMBalloonCallout(CIMCallout):
    """
      Represents a balloon callout. Balloon callouts are a filled background 
      that is placed behind text. They may or may not have a leader line 
      connecting the callout to an anchor point.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.balloonStyle = BalloonCalloutStyle.Rectangle
        self.backgroundSymbol = 'CIMPolygonSymbol'
        self.margin = 'CIMTextMargin'
        self.useFixedDartWidth = False
        self.fixedDartWidth = 7.0
        self.useDartSymbol = False
        self.dartSymbol = 'CIMPolygonSymbol'
    
class CIMCompositeCallout(CIMCallout):
    """
      Represents a composite callout. Composite callouts are a filled 
      background along with an optional shadow, which is placed
  /// 
      behind text. They may also have a leader line (consisting of one 
      or both of a simple line, and filled dart)
  /// connecting the 
      callout to an anchor point. Composite callouts may have additional 
      surrounding text elements.
  /// The text representing these parts 
      is specified in the text string using tags. Their relative position 
      properties are
  /// specified in the CIMCompositeCallout through 
      their corresponding CIMCompositeTextPartPosition elements specified 
      below,
  /// but these properties can also be overridden with tag 
      attributes.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.cornerRadius = 5.0
        self.backgroundSymbol = 'CIMPolygonSymbol'
        self.margin = 'CIMTextMargin'
        self.dartWidth = 7.0
        self.dartSymbol = 'CIMPolygonSymbol'
        self.snapLeaderToCornersOnly = False
        self.leaderLinePercentage = 70.0
        self.leaderLineSymbol = 'CIMLineSymbol'
        self.shadowSymbol = 'CIMPolygonSymbol'
        self.shadowXOffset = 0.0
        self.shadowYOffset = 0.0
        self.middle = 'CIMCompositeTextPartPosition'
        self.topLeft = 'CIMCompositeTextPartPosition'
        self.top = 'CIMCompositeTextPartPosition'
        self.topRight = 'CIMCompositeTextPartPosition'
        self.right = 'CIMCompositeTextPartPosition'
        self.left = 'CIMCompositeTextPartPosition'
        self.bottomLeft = 'CIMCompositeTextPartPosition'
        self.bottom = 'CIMCompositeTextPartPosition'
        self.bottomRight = 'CIMCompositeTextPartPosition'
        self.floating = 'CIMCompositeTextPartPosition'
    
class CIMFill(CIMSymbolLayer):
    """
      Represents a fill which defines how the polygonal geometry is drawn.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMGeometricEffectAddControlPoints(CIMGeometricEffect):
    """
      Represents the add control points geometric effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.angleTolerance = 120.0
    
class CIMGeometricEffectArrow(CIMGeometricEffect):
    """
      Represents the arrow geometric effect which creates a dynamic line 
      along a line feature with an arrow of a specified arrow type and 
      width.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.arrowType = GeometricEffectArrowType.OpenEnded
        self.width = 5.0
    
class CIMGeometricEffectBuffer(CIMGeometricEffect):
    """
      Represents the buffer geometric effect which creates a dynamic 
      polygon with a specified distance around features.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.size = 1
    
class CIMGeometricEffectCircularSector(CIMGeometricEffect):
    """
      Represents the circular sector geometric effect which creates a 
      circular sector of a specified radius and start/end angles originating 
      from a point feature.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.startAngle = 0
        self.endAngle = 45
        self.radius = 25
    
class CIMGeometricEffectControlMeasureLine(CIMGeometricEffect):
    """
      Represents the control measure line geometric effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.rule = GeometricEffectControlMeasureLineRule.FullGeometry
    
class CIMGeometricEffectCut(CIMGeometricEffect):
    """
      Represents the cut geometric effect which creates a dynamic line 
      that is shorter on one or both ends than the line feature or polygon 
      outline.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.beginCut = 1
        self.endCut = 1
        self.middleCut = 0
        self.invert = False
    
class CIMGeometricEffectDashes(CIMGeometricEffect):
    """
      Represents the dashes geometric effect which creates a dynamic 
      multipart line geometry from a line feature or the outline of a 
      polygon based on a template.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.customEndingOffset = 0.0
        self.dashTemplate = []
        self.lineDashEnding = LineDashEnding.NoConstraint
        self.offsetAlongLine = 0
        self.controlPointEnding = LineDashEnding.NoConstraint
    
class CIMGeometricEffectDonut(CIMGeometricEffect):
    """
      Represents the donut geometric effect which creates a dynamic polygon 
      ring of a specified width in relation to the outline of polygon 
      features.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.method = GeometricEffectDonutMethod.Mitered
        self.option = GeometricEffectOffsetOption.Accurate
        self.width = 2
    
class CIMGeometricEffectEnclosingPolygon(CIMGeometricEffect):
    """
      Represents the enclosing polygon geometric effect which creates 
      a dynamic polygon from the spatial extent of a line or polygon 
      feature.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.method = GeometricEffectEnclosingPolygonMethod.RectangularBox
    
class CIMGeometricEffectExtension(CIMGeometricEffect):
    """
      Represents the extension geometric effect which creates a dynamic 
      line that is extended from either the beginning or the end of the 
      line feature at a specified deflection angle and length.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.deflection = 45
        self.origin = GeometricEffectExtensionOrigin.EndOfLine
        self.length = 5
    
class CIMGeometricEffectJog(CIMGeometricEffect):
    """
      Represents the jog geometric effect which creates a dynamic line 
      with a jog of a specified angle, position, and width in the line.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.angle = 225.0
        self.length = 20.0
        self.position = 50.0
    
class CIMGeometricEffectLocalizerFeather(CIMGeometricEffect):
    """
      Represents a geometric effect which creates a localizer feather 
      for aeronautical charts.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.style = GeometricEffectLocalizerFeatherStyle.Complete
        self.length = 50
        self.width = 6
        self.angle = 0
    
class CIMGeometricEffectMove(CIMGeometricEffect):
    """
      Represents the move geometric effect which creates a point, line 
      or polygon that is offset a specified distance in X and Y.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.offsetX = 1
        self.offsetY = -1
    
class CIMGeometricEffectOffset(CIMGeometricEffect):
    """
      Represents the offset geometric effect which creates a dynamic 
      line or polygon offset at a specified distance perpendicularly 
      from a feature.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.method = GeometricEffectOffsetMethod.Square
        self.offset = 1
        self.option = GeometricEffectOffsetOption.Fast
    
class CIMGeometricEffectOffsetHatch(CIMGeometricEffect):
    """
      Represents a geometric effect which creates a hatch pattern to 
      depict special use airspace for aeronautical charts.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.length = 5
        self.spacing = 2.5
    
class CIMGeometricEffectOffsetTangent(CIMGeometricEffect):
    """
      Represents the offset tangent geometric effect which creates a 
      dynamic line along a line feature offset in the direction defined 
      by either the beginning or the end of the line.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.method = GeometricEffectOffsetTangentMethod.BeginningOfLine
        self.offset = 5.0
    
class CIMGeometricEffectRadial(CIMGeometricEffect):
    """
      Represents the radial geometric effect which creates a dynamic 
      line of a specified length and angle originating from a point feature.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.angle = 0
        self.length = 5
    
class CIMGeometricEffectRegularPolygon(CIMGeometricEffect):
    """
      Represents the regular polygon geometric effect which creates a 
      dynamic polygon around a point feature with a specified number 
      of edges. All edges are equal in length and all angles are equal.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.angle = 0
        self.edges = 4
        self.radius = 2.5
    
class CIMGeometricEffectReverse(CIMGeometricEffect):
    """
      Represents the reverse geometric effect which creates a dynamic 
      polygon around a point feature with a specified number of edges. 
      All edges are equal in length and all angles are equal.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.reverse = True
    
class CIMGeometricEffectRotate(CIMGeometricEffect):
    """
      Represents the rotate geometric effect which creates a dynamic 
      line or polygon rotated a specified angle from the feature.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.angle = 15
    
class CIMGeometricEffectScale(CIMGeometricEffect):
    """
      Represents the rotate geometric effect which creates a dynamic 
      line or polygon scaled by a specified factor. Vertices are moved 
      in relation to the center point of a feature envelope. Values greater 
      than 1 move vertices away from the center point. Values between 
      0 and 1 move vertices toward the center point. Values less than 
      0 draw an inverse dynamic line or polygon where the vertices have 
      crossed to the other side of the center point.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.xScaleFactor = 1.15
        self.yScaleFactor = 1.15
    
class CIMGeometricEffectSuppress(CIMGeometricEffect):
    """
      Represents the suppress geometric effect which creates a dynamic 
      line that hides sections of a stroke between pairs control points.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.suppress = True
        self.invert = False
    
class CIMGeometricEffectTaperedPolygon(CIMGeometricEffect):
    """
      Represents the tapered polygon geometric effect which creates a 
      dynamic polygon along a line feature, whose width varies by two 
      specified amounts along its length, as defined by a percentage 
      of the line feature's length.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fromWidth = 0
        self.length = 0
        self.toWidth = 1
    
class CIMGeometricEffectWave(CIMGeometricEffect):
    """
      Represents the wave geometric effect which creates a dynamic line 
      or polygon along a feature with a repeating wave pattern.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.amplitude = 2
        self.period = 3
        self.seed = 1
        self.waveform = GeometricEffectWaveform.Sinus
    
class CIMGradientFill(CIMFill):
    """
      Represents a gradient fill which fills polygonal geometry with 
      a specified color scheme.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.angle = 90
        self.colorRamp = 'CIMColorRamp'
        self.gradientMethod = GradientFillMethod.Linear
        self.gradientSize = 75.0
        self.gradientSizeUnits = SymbolUnits.Relative
        self.gradientType = GradientStrokeType.Discrete
        self.interval = 5
    
class CIMHatchFill(CIMFill):
    """
      Represents a hatch fill which fills polygonal geometry with a uniform 
      series of parallel line symbols.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.lineSymbol = 'CIMLineSymbol'
        self.offsetX = 0
        self.rotation = 0
        self.separation = 4
        self.offsetY = 0
    
class CIMLineCallout(CIMCallout):
    """
      Represents a line callout.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.leaderLineSymbol = 'CIMLineSymbol'
        self.gap = 0
        self.lineStyle = LeaderLineStyle.Base
    
class CIMMarker(CIMSymbolLayer):
    """
      Represents a marker which is a self-contained shape or image that 
      can draw for a point graphic or placed in a repeating arrangement 
      along a stroke or within a fill. It can be a glyph from a font, 
      a picture, a collection of vector geometries, or a 3D model.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.anchorPoint = GetPythonClass('arcpy', 'Point')
        self.anchorPointUnits = SymbolUnits.Relative
        self.angleX = 0.0
        self.angleY = 0.0
        self.dominantSizeAxis3D = DominantSizeAxis.Z
        self.offsetX = 0.0
        self.offsetY = 0.0
        self.offsetZ = 0.0
        self.rotateClockwise = False
        self.rotation = 0.0
        self.size = 10.0
        self.billboardMode3D = BillboardMode.FaceNearPlane
        self.markerPlacement = 'CIMMarkerPlacement'
    
class CIMMarker3D(CIMMarker):
    """
      Represents a 3D marker which consists of one or more ShapeGraphics 
      contained within one or more ShapeLODs.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.lODLevels = []
        self.lODDistances = []
        self.width = 10.0
        self.depth = 1.0
        self.color = 'CIMColor'
        self.isRestricted = False
        self.shapeVertices = []
        self.textures = []
        self.thumbnail = str()
    
class CIMMarkerFillPlacement(CIMMarkerPlacement):
    """
      Represents a marker fill placement.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMMarkerPlacementAroundPolygon(CIMMarkerFillPlacement):
    """
      Represents marker placement around polygon which places a marker 
      on a specific position on the polygon outline.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.position = PlacementAroundPolygonPosition.Top
        self.offset = 0
    
class CIMMarkerPlacementInsidePolygon(CIMMarkerFillPlacement):
    """
      Represents marker placement inside a polygon which defines how 
      a polygon is filled with a pattern of markers.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.gridAngle = 0
        self.gridType = PlacementGridType.Fixed
        self.offsetX = 0
        self.randomness = 100
        self.seed = 0
        self.shiftOddRows = False
        self.stepX = 16
        self.stepY = 16
        self.offsetY = 0
        self.clipping = PlacementClip.ClipAtBoundary
    
class CIMMarkerPlacementPolygonCenter(CIMMarkerFillPlacement):
    """
      Represents marker placement polygon center which defines how a 
      single marker will be placed within the polygon.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.method = PlacementPolygonCenterMethod.OnPolygon
        self.offsetX = 0
        self.offsetY = 0
        self.clipAtBoundary = False
    
class CIMMarkerStrokePlacement(CIMMarkerPlacement):
    """
      Represents a marker stroke placement.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.angleToLine = True
        self.keepUpright = False
        self.offset = 0.0
    
class CIMMaterialSymbolLayer(CIMSymbolLayer):
    """
      Represents a material which defines how the multipatch or mesh 
      is drawn.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.color = 'CIMColor'
        self.materialMode = MaterialMode.Multiply
    
class CIMMeshEdge(CIMSymbolLayer):
    """
      Represents a stroke drawn at specified edges of a mesh.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.color = 'CIMColor'
        self.thresholdAngle = 35
        self.applyThresholdAngleToBothSidesOfFaces = False
    
class CIMMultiLayerSymbol(CIMSymbol):
    """
      Represents a multilayer symbol, a generic type for point, line, 
      and polygon symbols, specifying that they can contain more than 
      one symbol layers.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.animations = []
        self.effects = []
        self.symbolLayers = []
        self.thumbnailURI = str()
        self.useRealWorldSymbolSizes = False
    
class CIMObjectMarker3D(CIMMarker):
    """
      Represents a marker symbol for 3D objects.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.modelURI = str()
        self.width = 10.0
        self.depth = 1.0
        self.tintColor = 'CIMColor'
        self.isRestricted = False
        self.thumbnail = str()
        self.useAnchorPoint = True
        self.lODs = []
        self.primitiveShapeType = PrimitiveShapeType.Unknown
    
class CIMPictureFill(CIMFill):
    """
      Represents a picture fill which fills polygonal geometry with a 
      picture. Supported file types are .bmp, .jpg, .png, and .gif.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.url = str()
        self.offsetX = 0
        self.offsetY = 0
        self.rotation = 0
        self.scaleX = 1
        self.height = 10
        self.textureFilter = TextureFilter.Draft
        self.colorSubstitutions = []
        self.tintColor = 'CIMColor'
    
class CIMPictureMarker(CIMMarker):
    """
      Represents a picture marker created from a raster (bitmapped) image 
      file. The image can have color substitutions to replace one or 
      more colors in the image or it can have a tint applied to the whole 
      image depending on the picture type. Supported formats are .bmp, 
      .jpg, .png, and .gif.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colorSubstitutions = []
        self.depth3D = 0.0
        self.invertBackfaceTexture = True
        self.scaleX = 1.0
        self.textureFilter = TextureFilter.Draft
        self.tintColor = 'CIMColor'
        self.url = str()
        self.verticalOrientation3D = False
        self.animatedSymbolProperties = 'CIMAnimatedSymbolProperties'
    
class CIMPointSymbol(CIMMultiLayerSymbol):
    """
      Represents a point symbol used to draw point features and point 
      graphics.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.callout = 'CIMCallout'
        self.haloSize = 1.0
        self.haloSymbol = 'CIMPolygonSymbol'
        self.primitiveName = str()
        self.scaleX = 1
        self.symbol3DProperties = 'CIM3DSymbolProperties'
        self.angle = 0.0
        self.angleAlignment = AngleAlignment.Display
    
class CIMPointSymbolCallout(CIMLineCallout):
    """
      Represents a point symbol callout which draws a point symbol as 
      the background and a line symbol for leaders. Often used for highway 
      shields.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.pointSymbol = 'CIMPointSymbol'
        self.backgroundScale = PointSymbolCalloutScale.eNone
    
class CIMPolygonSymbol(CIMMultiLayerSymbol):
    """
      Represents a polygon symbol which is used to draw polygon features 
      or polygon graphics.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.angleAlignment = AngleAlignment.Map
    
class CIMProceduralSymbolLayer(CIMSymbolLayer):
    """
      Represents a procedural symbol layer which defines rendering using 
      script-based logic to construct complex 3D objects and textures 
      from simple geometries. Properties of the symbol are derived from 
      a rule package (.rpk file).
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.attributes = []
        self.rulePackage = str()
        self.rulePackageName = str()
    
class CIMSimpleLineCallout(CIMCallout):
    """
      Represents a simple line callout for drawing basic leader lines.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.lineSymbol = 'CIMLineSymbol'
        self.autoSnap = True
    
class CIMSolidFill(CIMFill):
    """
      Represents a solid fill which fills polygonal geometry with a single 
      solid color.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.color = 'CIMColor'
    
class CIMSolidMeshEdge(CIMMeshEdge):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMStroke(CIMSymbolLayer):
    """
      Represents a stroke which defines how line geometry or the outline 
      of polygon geometry is drawn.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.capStyle = LineCapStyle.Round
        self.joinStyle = LineJoinStyle.Round
        self.lineStyle3D = Simple3DLineStyle.Strip
        self.miterLimit = 4.0
        self.width = 4
        self.closeCaps3D = False
        self.height3D = 1.0
        self.anchor3D = Simple3DLineAnchor.Center
    
class CIMSymbolAnimationColor(CIMSymbolAnimation):
    """
      Represents the color animation.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.toColor = 'CIMColor'
    
class CIMSymbolAnimationOffset(CIMSymbolAnimation):
    """
      Represents the offset animation.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.offsetX = 0
        self.offsetY = 0
    
class CIMSymbolAnimationRotation(CIMSymbolAnimation):
    """
      Represents the rotation animation.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.toRotation = 0
    
class CIMSymbolAnimationScale(CIMSymbolAnimation):
    """
      Represents the scale animation.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.scaleFactor = 1
    
class CIMSymbolAnimationSize(CIMSymbolAnimation):
    """
      Represents the size animation.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.toSize = 0
    
class CIMSymbolAnimationTransparency(CIMSymbolAnimation):
    """
      Represents the transparency animation.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.toTransparency = 0
    
class CIMTextSymbol(CIMSymbol):
    """
      Represents a text symbol which is used to draw text graphics, bleeds, 
      and annotation. Text symbols do not contain any symbol layers but 
      can have callouts.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.angle = 0.0
        self.angleX = 0.0
        self.angleY = 0.0
        self.blockProgression = BlockProgression.TTB
        self.callout = 'CIMCallout'
        self.compatibilityMode = False
        self.countryISO = str()
        self.depth3D = 1.0
        self.drawGlyphsAsGeometry = False
        self.drawSoftHyphen = False
        self.extrapolateBaselines = True
        self.flipAngle = 0.0
        self.fontEffects = FontEffects.Normal
        self.fontEncoding = FontEncoding.Unicode
        self.fontFamilyName = str()
        self.fontStyleName = str()
        self.fontType = FontType.Unspecified
        self.fontVariationSettings = []
        self.glyphRotation = 0.0
        self.haloSize = 1.0
        self.haloSymbol = 'CIMPolygonSymbol'
        self.height = 10.0
        self.hinting = GlyphHinting.Default
        self.horizontalAlignment = HorizontalAlignment.Left
        self.indentAfter = 0.0
        self.indentBefore = 0.0
        self.indentFirstLine = 0.0
        self.kerning = True
        self.languageISO = str()
        self.letterSpacing = 0.0
        self.letterWidth = 100.0
        self.ligatures = True
        self.lineGap = 0.0
        self.lineGapType = LineGapType.ExtraLeading
        self.offsetX = 0.0
        self.offsetY = 0.0
        self.offsetZ = 0.0
        self.shadowColor = 'CIMColor'
        self.shadowOffsetX = 0.0
        self.shadowOffsetY = 0.0
        self.smallCaps = False
        self.strikethrough = False
        self.symbol = 'CIMPolygonSymbol'
        self.symbol3DProperties = 'CIM3DSymbolProperties'
        self.textCase = TextCase.Normal
        self.textDirection = TextReadingDirection.LTR
        self.underline = False
        self.verticalAlignment = VerticalAlignment.Bottom
        self.verticalGlyphOrientation = VerticalGlyphOrientation.Right
        self.wordSpacing = 100.0
        self.billboardMode3D = BillboardMode.FaceNearPlane
        self.overprint = False
    
class CIMVectorMarker(CIMMarker):
    """
      Represents a vector marker which can represent vector graphics. 
      It's constructed from MarkerGraphics which are geometries and symbols 
      used as building blocks for the marker.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.depth3D = 0.0
        self.frame = GetPythonClass('arcpy', 'Extent')
        self.markerGraphics = []
        self.verticalOrientation3D = False
        self.scaleSymbolsProportionally = False
        self.respectFrame = True
        self.clippingPath = 'CIMClippingPath'
    
class CIMWaterFill(CIMFill):
    """
      Represents a water fill which fills polygonal geometry with animated 
      water.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.color = 'CIMColor'
        self.waveStrength = WaveStrength.Rippled
        self.waterbodySize = WaterbodySize.Medium
        self.waveHasDirection = False
        self.waveDirection = 0.0
    
class CIMglTFMarker3D(CIMMarker):
    """
      Represents a marker symbol for 3D objects.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.modelURI = str()
        self.additionalModelURIs = []
        self.width = 10.0
        self.depth = 1.0
        self.tintColor = 'CIMColor'
        self.isRestricted = False
        self.thumbnail = str()
        self.useAnchorPoint = True
        self.animatedSymbolProperties = 'CIMAnimatedSymbolProperties'
        self.primitiveShapeType = PrimitiveShapeType.Unknown
        self.sourceStyleName = str()
        self.sourceSymbolKey = str()
    
class CIMBackgroundCallout(CIMLineCallout):
    """
      Represents a background callout which draws a callout with an optional 
      polygon background and leader line.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.backgroundSymbol = 'CIMPolygonSymbol'
        self.accentBarSymbol = 'CIMLineSymbol'
        self.margin = 'CIMTextMargin'
    
class CIMCharacterMarker(CIMMarker):
    """
      Represents a character marker.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.characterIndex = 33
        self.depth3D = 0.0
        self.fontFamilyName = str()
        self.fontStyleName = str()
        self.fontType = FontType.Unspecified
        self.fontVariationSettings = []
        self.scaleX = 1.0
        self.symbol = 'CIMPolygonSymbol'
        self.verticalOrientation3D = False
        self.scaleSymbolsProportionally = False
        self.respectFrame = True
    
class CIMChartMarker(CIMMarker):
    """
      Represents a chart marker, a marker used to display a chart.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.display3D = False
        self.parts = []
        self.thickness3D = 3.0
        self.tilt3D = 45.0
    
class CIMGradientStroke(CIMStroke):
    """
      Represents a gradient stroke which draws linear geometry with a 
      specified color scheme.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colorRamp = 'CIMColorRamp'
        self.gradientMethod = GradientStrokeMethod.AcrossLine
        self.gradientSize = 75.0
        self.gradientSizeUnits = SymbolUnits.Relative
        self.gradientType = GradientStrokeType.Discrete
        self.interval = 5
    
class CIMLineSymbol(CIMMultiLayerSymbol):
    """
      Represents a line symbol which is used to draw polyline features 
      or graphics.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMMarkerPlacementAlongLine(CIMMarkerStrokePlacement):
    """
      Represents marker placement along the line which defines how a 
      marker is placed along a line or polygon outline.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.customEndingOffset = 0.0
        self.endings = PlacementEndings.WithHalfGap
        self.offsetAlongLine = 0.0
        self.placementTemplate = []
    
class CIMMarkerPlacementAlongLineRandomSize(CIMMarkerPlacementAlongLine):
    """
      Represents marker placement along the line which places randomly 
      sized markers evenly along a line or polygon outline.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.randomization = PlacementRandomlyAlongLineRandomization.Low
        self.seed = 0
    
class CIMMarkerPlacementAlongLineSameSize(CIMMarkerPlacementAlongLine):
    """
      Represents marker placement along the line which places markers 
      that are the same size evenly along a line or polygon outline.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMMarkerPlacementAlongLineVariableSize(CIMMarkerStrokePlacement):
    """
      Represents marker placement along the line which places markers 
      in either increasing, decreasing or alternating gradations along 
      a line or polygon outline.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.placementTemplate = []
        self.endings = SimplePlacementEndings.WithHalfGap
        self.controlPointPlacement = SimplePlacementEndings.WithHalfGap
        self.maxRandomOffset = 0
        self.maxZoom = 1.5
        self.minZoom = 0.5
        self.numberOfSizes = 3
        self.seed = 0
        self.variationMethod = SizeVariationMethod.Random
    
class CIMMarkerPlacementAtExtremities(CIMMarkerStrokePlacement):
    """
      Represents marker placement at extremities which places markers 
      at only one or both endpoints of a line.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.extremityPlacement = ExtremityPlacement.Both
        self.offsetAlongLine = 0
    
class CIMMarkerPlacementAtMeasuredUnits(CIMMarkerStrokePlacement):
    """
      Represents marker placement at geometry M values.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.interval = 100
        self.skipMarkerRate = 0
        self.placeAtExtremities = False
    
class CIMMarkerPlacementAtRatioPositions(CIMMarkerStrokePlacement):
    """
      Represents marker placement at ratio positions which places a set 
      number of markers along the line or the outline of a polygon.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.beginPosition = 0
        self.endPosition = 0
        self.flipFirst = True
        self.positionArray = []
    
class CIMMarkerPlacementOnLine(CIMMarkerStrokePlacement):
    """
      Represents a marker placement on the line.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.relativeTo = PlacementOnLineRelativeTo.LineMiddle
        self.startPointOffset = 0
    
class CIMMarkerPlacementOnVertices(CIMMarkerStrokePlacement):
    """
      Represents a marker placement on vertices which places a single 
      marker on a line or polygon outline at a set distance from the 
      middle or one of the endpoints.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.placeOnControlPoints = True
        self.placeOnEndPoints = True
        self.placeOnRegularVertices = True
    
class CIMMeshSymbol(CIMMultiLayerSymbol):
    """
      Represents a mesh symbol which is used to draw multipatch features 
      or mesh features.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.animatedSymbolProperties = 'CIMAnimatedSymbolProperties'
    
class CIMPictureStroke(CIMStroke):
    """
      Represents a picture stroke which draws linear geometry with a 
      repeating image file. Supported file types are .bmp, .jpg, .png, 
      and .gif.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colorSubstitutions = []
        self.textureFilter = TextureFilter.Draft
        self.url = str()
        self.tintColor = 'CIMColor'
    
class CIMPieChartMarker(CIMChartMarker):
    """
      Represents a pie chart marker which is a marker that draws numeric 
      values arranged in a circle.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.clockwise = False
        self.showOutline = False
        self.outlineSymbol = 'CIMLineSymbol'
        self.aggregateSmallSlices = False
        self.sliceAggregationThreshold = 5.0
        self.aggregateSliceSymbol = 'CIMPolygonSymbol'
        self.aggregateSliceLabel = str()
        self.showInvalidValues = False
        self.invalidValuesSymbol = 'CIMPolygonSymbol'
        self.invalidValuesLabel = str()
    
class CIMSolidStroke(CIMStroke):
    """
      Represents a solid stroke which draws linear geometry with a single 
      solid color.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.color = 'CIMColor'
    
class CIMStackedBarChartMarker(CIMChartMarker):
    """
      Represents a stacked bar chart marker which is a chart made of 
      vertical stacked bars displaying values.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fixedLength = False
        self.showOutline = False
        self.outlineSymbol = 'CIMLineSymbol'
        self.verticalBar = True
        self.width = 8.0
    
class CIMBarChartMarker(CIMChartMarker):
    """
      Represents a bar chart marker, a chart made of vertical bars displaying 
      values.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.axesSymbol = 'CIMLineSymbol'
        self.spacing = 0.0
        self.verticalBars = True
        self.width = 6.0
        self.showAxes = False
    
