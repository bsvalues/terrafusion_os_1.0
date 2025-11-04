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

class CIMAltitudeParams():
    """
      Represents altitude parameters.
    """
    def __init__(self, *args, **Kwargs):
        self.altitudeValue = 0
        self.mode = AltitudeMode.RelativeToGround
    
class CIMAnimationScreenGraphic():
    """
      Represents a graphic and list of keyframes indicating properties 
      that can be changed during the animation.
    """
    def __init__(self, *args, **Kwargs):
        self.graphic = 'CIMGraphic'
        self.alias = str()
        self.keyframes = []
    
class CIMAnimationScreenGraphicKeyframe():
    """
      Properties defining the graphic at a single point in time for the 
      animation.
    """
    def __init__(self, *args, **Kwargs):
        self.trackTime = 0.0
        self.anchorX = 0.0
        self.anchorY = 0.0
        self.transparency = 0.0
        self.scale = 1.0
        self.elementWidth = 0.0
        self.elementHeight = 0.0
        self.rotation = 0.0
    
class CIMBookmark():
    """
      Represents a spatial bookmark.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.groupName = str()
        self.thumbnailImagePath = str()
        self.camera = 'CIMViewCamera'
        self.location = GetPythonClass('arcpy', 'Extent')
        self.timeExtent = TimeExtent
        self.timeRelation = esriTimeRelation.esriTimeRelationOverlaps
        self.rangeExtent = 'CIMLayerRange'
        self.layerRangeExtents = []
        self.description = str()
        self.videoURI = str()
        self.videoElapsedTime = 0.0
    
class CIMDatumTransform():
    """
      Represents a datum transform.
    """
    def __init__(self, *args, **Kwargs):
        self.forward = True
        self.geoTransformation = str()
    
class CIMEditingElevation():
    """
      Defines the properties needed to specify new Z values when creating 
      or modifying features.
    """
    def __init__(self, *args, **Kwargs):
        self.captureMode = EditingElevationCaptureMode.Off
        self.constantValue = 0.0
        self.constantValueUnit = str()
        self.elevationSurfaceLayerURI = str()
    
class CIMEditingTemplateCollectionItem():
    """
      Represents an item that can be stored within an editing template 
      collection.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
    
class CIMExploratoryAnalysisDefinition():
    """
      Represents an exploratory analysis definition.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = -1
    
class CIMFacilityLayerProperties():
    """
      Defines the URI and required field properties for the Indoors Facility 
      layer required for floor filtering operations.
    """
    def __init__(self, *args, **Kwargs):
        self.layerURI = str()
        self.subLayerID = -1
        self.siteIDField = str()
        self.facilityIDField = str()
        self.nameField = str()
    
class CIMFieldMapping():
    """
      Represents a field mapping that maps fields from source layer or 
      table to target layer or table.
    """
    def __init__(self, *args, **Kwargs):
        self.sourceURI = str()
        self.targetURI = str()
        self.mappingExpressionInfo = 'CIMExpressionInfo'
    
class CIMFloorAwareMapProperties():
    """
      Defines the properties needed to identify the Indoors layers and 
      some required fields for each layer which are used for floor filtering 
      operations, as well as properties for the map's floor filter.
    """
    def __init__(self, *args, **Kwargs):
        self.siteLayerProperties = 'CIMSiteLayerProperties'
        self.facilityLayerProperties = 'CIMFacilityLayerProperties'
        self.levelLayerProperties = 'CIMLevelLayerProperties'
        self.defaultFloorFilterSettings = 'CIMFloorFilterSettings'
    
class CIMFloorFilterSettings():
    """
      Represents floor filter settings.
    """
    def __init__(self, *args, **Kwargs):
        self.selectedSiteID = str()
        self.selectedFacilityID = str()
        self.selectedLevelID = str()
        self.enabled = False
        self.minimized = False
        self.longNames = False
        self.pinnedLevels = False
        self.siteFacilityIDs = []
        self.siteLevelIDs = []
    
class CIMGeotrigger():
    """
      Represents common properties for all the geotrigger types.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
    
class CIMGeotriggerFeed():
    """
      Represents feed for Geotriggers.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMGeotriggerFenceFilter():
    """
      Represents a geotrigger fence filter.
    """
    def __init__(self, *args, **Kwargs):
        self.whereClause = str()
        self.geometryURI = str()
    
class CIMGeotriggerFenceParameters():
    """
      Represents the parameters of a geotrigger fence.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMGeotriggerNotificationProperties():
    """
      Represents a geotrigger notification properties.
    """
    def __init__(self, *args, **Kwargs):
        self.expressionInfo = 'CIMExpressionInfo'
        self.requestedActions = []
    
class CIMGroundToGridCorrection():
    """
      Defines the properties needed to perform a COGO ground to grid 
      correction when adding new features.
    """
    def __init__(self, *args, **Kwargs):
        self.enabled = False
        self.useDirection = True
        self.useScale = True
        self.direction = 0.0
        self.scaleType = GroundToGridScaleType.ConstantFactor
        self.constantScaleFactor = 1.0
    
class CIMIPSAppleIPSConfiguration():
    """
      Define IPS configuration Apple IPS propeties.
    """
    def __init__(self, *args, **Kwargs):
        self.enabled = True
    
class CIMIPSAwareMapProperties():
    """
      Define the properties needed to identify IPS layer and table.
    """
    def __init__(self, *args, **Kwargs):
        self.iPSRecordingsLayerURI = str()
        self.iPSPositioningTableProperties = 'CIMIPSPositioningTableProperties'
        self.iPSPositioningDataServiceProperties = 'CIMIPSPositioningDataServiceProperties'
        self.iPSConfiguration = 'CIMIPSConfiguration'
    
class CIMIPSConfiguration():
    """
      Defines the properties for the IPS configuration.
    """
    def __init__(self, *args, **Kwargs):
        self.pathSnapping = 'CIMIPSPathSnappingConfiguration'
        self.smoothing = 'CIMIPSSmoothingConfiguration'
        self.gNSS = 'CIMIPSGNSSConfiguration'
        self.appleIPS = 'CIMIPSAppleIPSConfiguration'
    
class CIMIPSGNSSConfiguration():
    """
      Define IPS configuration GNSS properties.
    """
    def __init__(self, *args, **Kwargs):
        self.enabled = True
    
class CIMIPSPathSnappingConfiguration():
    """
      Defines IPS configuration path snapping properties.
    """
    def __init__(self, *args, **Kwargs):
        self.enabled = True
        self.distance = 5.0
        self.distanceUnit = str()
    
class CIMIPSPositioningDataServiceProperties():
    """
      Defines the Portal Item for the IPS Positioning data service.
    """
    def __init__(self, *args, **Kwargs):
        self.portalItem = 'CIMPortalItem'
        self.workspaceConnection = 'CIMWorkspaceConnection'
    
class CIMIPSPositioningTableProperties():
    """
      Defines the URI and selected global ID for the IPS positioning 
      table.
    """
    def __init__(self, *args, **Kwargs):
        self.tableURI = str()
        self.selectedGlobalID = str()
    
class CIMIPSSmoothingConfiguration():
    """
      Defines IPS configuration smoothing properties.
    """
    def __init__(self, *args, **Kwargs):
        self.enabled = True
    
class CIMIlluminationProperties():
    """
      Represents illumination properties.
    """
    def __init__(self, *args, **Kwargs):
        self.ambientLight = 50.0
        self.sunPositionX = -0.61237243569579
        self.sunPositionY = 0.61237243569579
        self.sunPositionZ = 0.5
        self.showAtmosphericEffects = False
        self.showShadows3D = False
        self.dateTime = GetPythonClass('datetime', 'datetime')
        self.illuminationSource = IlluminationSource.AbsoluteSunPosition
        self.sunAzimuth = 315.0
        self.sunAltitude = 30.0
        self.showStars = True
        self.enableAmbientOcclusion = True
        self.enableEyeDomeLighting = True
    
class CIMKeyframeAnalysis():
    """
      Represents an exploratory analysis keyframe.
    """
    def __init__(self, *args, **Kwargs):
        self.analysis = 'CIMExploratoryAnalysisDefinition'
        self.transition = AnimationTransition.Linear
    
class CIMKeyframeCamera():
    """
      Represents a camera keyframe.
    """
    def __init__(self, *args, **Kwargs):
        self.camera = 'CIMViewCamera'
        self.headingTransition = AnimationTransition.FixedArc
        self.pitchTransition = AnimationTransition.FixedArc
        self.rollTransition = AnimationTransition.FixedArc
        self.scaleTransition = AnimationTransition.FixedArc
        self.xTransition = AnimationTransition.FixedArc
        self.yTransition = AnimationTransition.FixedArc
        self.zTransition = AnimationTransition.FixedArc
        self.transitionScale = 0.5
        self.cameraTransitionMode = esriAnimationTransitionMode.esriAnimationTransitionModeAuto
        self.lookAt = GetPythonClass('arcpy', 'Geometry')
        self.adjustedCameraPath = GetPythonClass('arcpy', 'Multipoint')
        self.fieldOfView = 55.0
        self.fieldOfViewTransition = AnimationTransition.FixedArc
    
class CIMKeyframeElevationSource():
    """
      Represents an elevation source keyframe.
    """
    def __init__(self, *args, **Kwargs):
        self.sourceID = str()
        self.visible = True
    
class CIMKeyframeLayer():
    """
      Represents a layer keyframe.
    """
    def __init__(self, *args, **Kwargs):
        self.layerURI = str()
        self.transparency = 0.0
        self.transparencyTransition = AnimationTransition.Linear
        self.visible = True
        self.swipeDirection = SwipeDirection.eNone
        self.swipePercent = 0.0
        self.verticalExaggeration = 1.0
        self.zOffset = 0.0
    
class CIMKeyframeRange():
    """
      Represents a range keyframe.
    """
    def __init__(self, *args, **Kwargs):
        self.range = 'CIMRange'
        self.rangeRelation = RangeRelation.Overlaps
        self.minTransition = AnimationTransition.Stepped
        self.maxTransition = AnimationTransition.Stepped
        self.isExclusion = False
        self.layerRangeExtents = []
        self.layerRangeTransition = AnimationTransition.Stepped
        self.activeRangeLayer = str()
        self.activeRangeName = str()
    
class CIMKeyframeSurface():
    """
      Represents a surface keyframe.
    """
    def __init__(self, *args, **Kwargs):
        self.surfaceID = str()
        self.transition = AnimationTransition.Linear
        self.verticalExaggeration = 1.0
        self.visible = True
        self.swipeDirection = SwipeDirection.eNone
        self.swipePercent = 0.0
        self.baseSources = []
    
class CIMKeyframeTime():
    """
      Represents a time keyframe.
    """
    def __init__(self, *args, **Kwargs):
        self.time = TimeExtent
        self.timeRelation = esriTimeRelation.esriTimeRelationOverlaps
        self.endTimeTransition = AnimationTransition.Stepped
        self.startTimeTransition = AnimationTransition.Stepped
    
class CIMKeyframeVoxelPlane():
    """
      Represents a voxel plane keyframe.
    """
    def __init__(self, *args, **Kwargs):
        self.visible = True
        self.position = 0.0
        self.orientation = 0.0
        self.tilt = 0.0
    
class CIMLevelLayerProperties():
    """
      Defines the URI and required field properties for the Indoors Level 
      layer required for floor filtering operations.
    """
    def __init__(self, *args, **Kwargs):
        self.layerURI = str()
        self.subLayerID = -1
        self.facilityIDField = str()
        self.levelIDField = str()
        self.shortNameField = str()
        self.longNameField = str()
        self.levelNumberField = str()
        self.verticalOrderField = str()
    
class CIMLocator():
    """
      Represents properties of locator for the map.
    """
    def __init__(self, *args, **Kwargs):
        self.locatorType = LocatorType.Locator
        self.name = str()
        self.locatorURI = str()
        self.suggestionsEnabled = False
        self.enabled = True
        self.suggestionsSupported = False
    
class CIMMapGeotriggerProperties():
    """
      Represents geotrigger properties for a map.
    """
    def __init__(self, *args, **Kwargs):
        self.geotriggers = []
    
class CIMMapStereoProperties():
    """
      Represents map stereo properties.
    """
    def __init__(self, *args, **Kwargs):
        self.leftImage = 'CIMDataConnection'
        self.rightImage = 'CIMDataConnection'
        self.sourceType = StereoSourceType.StereoModel
        self.stereoModelCollection = 'CIMDataConnection'
        self.leftImageID = -1
        self.rightImageID = -1
        self.leftImageColorizer = 'CIMRasterColorizer'
        self.rightImageColorizer = 'CIMRasterColorizer'
        self.adjustColorizersInSync = False
        self.isInverted = False
        self.stereoModelDisplayMode = StereoModelDisplayMode.Default
        self.orientation = StereoOrientation.UpOrRight
        self.terrainFollowingDEM = 'CIMDataConnection'
    
class CIMMapTimeDisplay():
    """
      Represents map time display.
    """
    def __init__(self, *args, **Kwargs):
        self.currentTimeExtent = TimeExtent
        self.defaultTimeInterval = 0.0
        self.defaultTimeIntervalUnits = esriTimeUnits.esriTimeUnitsUnknown
        self.defaultTimeWindow = 0.0
        self.fullTimeExtent = TimeExtent
        self.timeReference = TimeReference
        self.timeValue = TimeValue
        self.hasLiveData = False
        self.timeRelation = esriTimeRelation.esriTimeRelationOverlaps
        self.uniqueTimes = []
    
class CIMScale():
    """
      Represents a 2D scale or 3D Distance.
    """
    def __init__(self, *args, **Kwargs):
        self.value = 0.0
        self.alias = str()
    
class CIMScaleFormat():
    """
      Represents the scale formatting options.
    """
    def __init__(self, *args, **Kwargs):
        self.formatType = ScaleFormatType.Absolute
        self.separator = str()
        self.reverseOrder = False
        self.decimalPlacesThreshold = 100.0
        self.decimalPlaces = 2
        self.showThousandSeparator = True
        self.pageUnits = str()
        self.pageUnitValue = 1.0
        self.equalsSign = str()
        self.mapUnits = str()
        self.capitalizeUnits = False
        self.abbreviateUnits = False
    
class CIMSiteLayerProperties():
    """
      Defines the URI and required field properties for the Indoors Site 
      layer required for floor filtering operations.
    """
    def __init__(self, *args, **Kwargs):
        self.layerURI = str()
        self.subLayerID = -1
        self.siteIDField = str()
        self.nameField = str()
    
class CIMSliderSettings():
    """
      Represents slider settings.
    """
    def __init__(self, *args, **Kwargs):
        self.sliderExtent = 'CIMRange'
        self.sliderExtentLocked = False
        self.startValueLocked = False
        self.endValueLocked = False
        self.flipVertically = False
        self.useWindowValue = False
        self.windowValue = 1.0
        self.windowUnit = esriTimeUnits.esriTimeUnitsDays
        self.stepUsesWindow = True
        self.stepIntervalValue = 1.0
        self.stepIntervalUnit = esriTimeUnits.esriTimeUnitsDays
        self.stepCount = 30.0
        self.stepOption = SliderStepType.Interval
        self.stepLayerURI = str()
        self.playWaitSeconds = 0.3
        self.playForward = True
        self.playRepeats = False
        self.playReverses = False
        self.fullExtentOption = SliderExtentType.AllLayers
        self.fullExtentLayerURI = str()
        self.fullExtentCustomRange = 'CIMRange'
        self.interactionMode = SliderInteractionMode.Slider
        self.useTimeSnapping = False
        self.timeSnapMode = TimeSnapMode.Single
        self.singleTimeSnapUnit = esriTimeUnits.esriTimeUnitsDays
        self.aliasExpressionLayerURI = str()
        self.isMinimized = False
        self.ignoreInactiveValues = False
        self.liveMode = False
        self.liveModeOffsetDirection = TimeOffsetDirection.Past
    
class CIMSnappingProperties():
    """
      Represents snapping properties.
    """
    def __init__(self, *args, **Kwargs):
        self.xYTolerance = 10.0
        self.xYToleranceUnit = SnapXYToleranceUnit.SnapXYToleranceUnitPixel
        self.zTolerance = 0.0
        self.zToleranceEnabled = False
        self.snapToSketchEnabled = True
        self.snapRequestType = SnapRequestType.SnapRequestType_GeometricAndVisualSnapping
        self.geometricFeedbackColor = 'CIMColor'
        self.visualFeedbackColor = 'CIMColor'
        self.isZSnappingEnabled = True
        self.snapTipDisplayParts = 3
    
class CIMSurfaceEffect():
    """
      Represents a stylized rendering effect that is applied to a surface 
      in a 3D view.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMViewCamera():
    """
      Represents a view camera.
    """
    def __init__(self, *args, **Kwargs):
        self.heading = 0
        self.pitch = 0
        self.roll = 0
        self.scale = 0
        self.x = 0
        self.y = 0
        self.z = 0
        self.viewportHeight = -1.0
        self.viewportWidth = -1.0
    
class CIMViewKeyframe():
    """
      Represents a view keyframe.
    """
    def __init__(self, *args, **Kwargs):
        self.trackTime = 0.0
        self.camera = 'CIMKeyframeCamera'
        self.layers = []
        self.range = 'CIMKeyframeRange'
        self.time = 'CIMKeyframeTime'
        self.surfaces = []
        self.exploratoryAnalysis = []
    
class CIMViewTrack():
    """
      Represents a animation view track.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.keyframes = []
        self.screenGraphics = []
        self.referenceResolutionWidth = 0
        self.referenceResolutionHeight = 0
        self.exportType = str()
        self.frameRate = -1
        self.dataRateFactor = -1
        self.startFrameTime = -1
        self.endFrameTime = -1
    
from .CIMCore import CIMDefinition
class CIMMap(CIMDefinition):
    """
      Represents a map or scene.
    """
    """
      Represents a map or scene.
    """
    """
      Represents a map or scene.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.defaultCamera = 'CIMViewCamera'
        self.illumination = 'CIMIlluminationProperties'
        self.layers = []
        self.stereoProperties = 'CIMMapStereoProperties'
        self.defaultViewingMode = MapViewingMode.Map
        self.mapType = MapType.Map
        self.rangeSliderSettings = 'CIMSliderSettings'
        self.timeSliderSettings = 'CIMSliderSettings'
        self.animationViewTracks = []
        self.animationActiveTrackName = str()
        self.locators = []
        self.mapContexts = []
        self.standaloneVideos = []
        self.customProperties = []
        self.linkCharts = []
        self.timelines = []
        self.knowledgeGraphLinkChartProperties = 'CIMKnowledgeGraphLinkChartProperties'
        self.groundElevationSurfaceLayer = str()
        self.customElevationSurfaceLayers = []
        self.defaultVisualEffect = 'CIMVisualEffect'
        self.defaultCameraEffect = 'CIMCameraEffect'
        self.defaultPostprocessingEffects = []
        self.defaultColorVisionDeficiencyMode = ColorVisionDeficiencyType.eNone
        self.weatherEffect = 'CIMWeatherEffect'
        self.standaloneTables = []
        self.backgroundColor = 'CIMColor'
        self.bookmarks = []
        self.clipToFullExtent = False
        self.attribution = str()
        self.customFullExtent = GetPythonClass('arcpy', 'Polygon')
        self.datumTransforms = []
        self.defaultExtent = GetPythonClass('arcpy', 'Extent')
        self.defaultScale = 0.0
        self.defaultGlobeTransparency = 0.0
        self.defaultRotation = 0.0
        self.description = str()
        self.generalPlacementProperties = 'CIMGeneralPlacementProperties'
        self.snappingProperties = 'CIMSnappingProperties'
        self.spatialReference = GetPythonClass('arcpy', 'SpatialReference')
        self.surfaceColor = 'CIMColor'
        self.timeDisplay = 'CIMMapTimeDisplay'
        self.enableNavigationBelowGround = False
        self.referenceScale = 0.0
        self.enableWraparound = False
        self.includeMaximumInScaleRanges = False
        self.colorModel = ColorModel.RGB
        self.scales = []
        self.snapToScales = False
        self.scaleFormat = 'CIMScaleFormat'
        self.scaleDisplayFormat = ScaleDisplayFormat.Value
        self.hVDatumTransforms = list()
        self.useServiceLayerIDs = False
        self.groundToGridCorrection = 'CIMGroundToGridCorrection'
        self.clippingMode = ClippingMode.eNone
        self.customClippingShapeURI = str()
        self.layersExcludedFromClipping = []
        self.surfacesExcludedFromClipping = []
        self.clippingAreaBorderSymbol = 'CIMSymbolReference'
        self.nearPlaneClipDistanceMode = ClipDistanceMode.Automatic
        self.nearPlaneClipDistance = 0.0
        self.editingElevation = 'CIMEditingElevation'
        self.editingTemplateCollection = 'CIMEditingTemplateCollection'
        self.fieldMappings = []
        self.rGBColorProfile = str()
        self.cMYKColorProfile = str()
        self.simulateOverprint = False
        self.floorAwareMapProperties = 'CIMFloorAwareMapProperties'
        self.iPSAwareMapProperties = 'CIMIPSAwareMapProperties'
        self.autoFillFeatureCache = True
        self.geotriggerProperties = 'CIMMapGeotriggerProperties'
        self.useMasking = True
    
class CIMAnimationScreenGraphicGroup(CIMAnimationScreenGraphic):
    """
      Represents an animation screen graphic group container.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.children = []
    
class CIMBorderlandsEffect(CIMSurfaceEffect):
    """
      Represents a surface effect for reshading the surface with a borderlands 
      effect in 3D views.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMContouringEffect(CIMSurfaceEffect):
    """
      Represents a surface effect for adding contour lines to surfaces 
      in 3D views.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.distance = 1000.0
        self.useRealWorldSizeThickness = True
        self.thickness = 5.0
    
class CIMCutAndFillEADefinition(CIMExploratoryAnalysisDefinition):
    """
      Represents a slice box exploratory analysis definition.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.cutFillPlane = GetPythonClass('arcpy', 'Polygon')
    
class CIMEditingTemplateCollection(CIMEditingTemplateCollectionItem):
    """
      Represents a collection of editing templates.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.contents = []
        self.expanded = False
    
class CIMEditingTemplateReference(CIMEditingTemplateCollectionItem):
    """
      Represents a reference to an editing template.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.layerURI = str()
        self.templateName = str()
    
class CIMFenceGeotrigger(CIMGeotrigger):
    """
      Represents a fence geotrigger.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.feed = 'CIMGeotriggerFeed'
        self.fenceNotificationRule = GeoFenceNotificationRule.EnterOrExit
        self.feedAccuracyMode = GeotriggerAccuracyMode.UseGeometry
        self.enterExitRule = GeoFenceEnterExitRule.EnterContainsAndExitDoesNotIntersect
        self.fenceParameters = 'CIMGeotriggerFenceParameters'
        self.notificationOptions = 'CIMGeotriggerNotificationProperties'
    
class CIMGeotriggerDeviceLocationFeed(CIMGeotriggerFeed):
    """
      Represents a Geotrigger feed that uses the device location to provide 
      updates.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.filterExpression = 'CIMExpressionInfo'
    
class CIMGeotriggerFeatureFenceParameters(CIMGeotriggerFenceParameters):
    """
      Represents the parameters of a geotrigger feature fence.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.bufferDistance = 0.0
        self.sourceDataConnection = 'CIMDataConnection'
        self.sourceLayer = str()
        self.filter = 'CIMGeotriggerFenceFilter'
    
class CIMKeyframeVoxelLayer(CIMKeyframeLayer):
    """
      Represents a voxel layer keyframe.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.variableName = str()
        self.showSurface = True
        self.dataFilterMax = 0.0
        self.dataFilterMin = 0.0
        self.isosurfaces = []
        self.sections = []
        self.lockedSections = []
        self.slices = []
    
class CIMLineOfSightEADefinition(CIMExploratoryAnalysisDefinition):
    """
      Represents a line of sight exploratory analysis definition.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.observer = GetPythonClass('arcpy', 'Point')
        self.targets = GetPythonClass('arcpy', 'Multipoint')
        self.maximumDistance = 200.0
        self.minimumDistance = 3.0
    
class CIMSliceBoxEADefinition(CIMExploratoryAnalysisDefinition):
    """
      Represents a slice box exploratory analysis definition.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.centerPoint = GetPythonClass('arcpy', 'Point')
        self.heading = 0
        self.height = 100
        self.width = 100
        self.depth = 100
        self.cullDirection = CullDirection.Inward
    
class CIMSliceCylinderEADefinition(CIMExploratoryAnalysisDefinition):
    """
      Represents a slice cylinder exploratory analysis definition.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.centerPoint = GetPythonClass('arcpy', 'Point')
        self.heading = 0.0
        self.pitch = 0.0
        self.height = 100.0
        self.width = 100.0
        self.cullDirection = CullDirection.Inward
    
class CIMSlicePlaneEADefinition(CIMExploratoryAnalysisDefinition):
    """
      Represents a slice plane exploratory analysis definition.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.centerPoint = GetPythonClass('arcpy', 'Point')
        self.heading = 0.0
        self.pitch = 0.0
        self.height = 100.0
        self.width = 100.0
        self.cullDirection = CullDirection.Inward
    
class CIMSliceSphereEADefinition(CIMExploratoryAnalysisDefinition):
    """
      Represents a slice sphere exploratory analysis definition.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.centerPoint = GetPythonClass('arcpy', 'Point')
        self.radius = 0.0
        self.cullDirection = CullDirection.Inward
    
class CIMViewDomeEADefinition(CIMExploratoryAnalysisDefinition):
    """
      Represents a view dome exploratory analysis definition.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.observer = GetPythonClass('arcpy', 'Point')
        self.maximumDistance = 200.0
        self.minimumDistance = 3.0
    
class CIMViewshedEADefinition(CIMExploratoryAnalysisDefinition):
    """
      Represents a viewshed exploratory analysis definition.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.observer = GetPythonClass('arcpy', 'Point')
        self.heading = 0.0
        self.pitch = 0.0
        self.horizontalAngle = 60.0
        self.verticalAngle = 60.0
        self.maximumDistance = 200.0
        self.minimumDistance = 3.0
    
