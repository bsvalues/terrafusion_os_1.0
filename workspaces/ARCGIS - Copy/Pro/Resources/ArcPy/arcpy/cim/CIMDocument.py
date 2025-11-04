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

class CIMBinaryReference():
    """
      Represents a binary reference in a document.
    """
    def __init__(self, *args, **Kwargs):
        self.uRI = str()
        self.data = str()
        self.object = CIMObject
    
class CIMColorReplacementRule():
    """
      Represents a color replacement rule.
    """
    def __init__(self, *args, **Kwargs):
        self.inputColor = 'CIMColor'
        self.outputColor = 'CIMColor'
    
class CIMGISProject():
    """
      Represents a project.
    """
    def __init__(self, *args, **Kwargs):
        self.views = []
        self.moduleSettings = []
        self.projectItems = []
        self.databaseConnections = []
        self.serverConnections = []
        self.folderConnections = []
        self.viewLayoutXML = str()
        self.defaultGeoDatabase = str()
        self.defaultToolbox = str()
        self.defaultSpatialReference = str()
        self.defaultFolder = str()
        self.projectMetadata = str()
        self.sourceURI = str()
        self.sourceModifiedTime = GetPythonClass('datetime', 'datetime')
        self.readOnly = False
        self.forceUpdate = False
        self.thumbnailOptions = 'CIMProjectThumbnailOptions'
    
class CIMModuleSettings():
    """
      Represents module settings in the project.
    """
    def __init__(self, *args, **Kwargs):
        self.moduleName = str()
        self.settingsXML = str()
    
class CIMProjectItem():
    """
      Represents an item in the project.
    """
    def __init__(self, *args, **Kwargs):
        self.alias = str()
        self.iD = str()
        self.catalogPath = str()
        self.pathHint = str()
        self.itemType = str()
        self.name = str()
        self.propertiesXML = str()
        self.sourceURI = str()
        self.sourceModifiedTime = GetPythonClass('datetime', 'datetime')
        self.consolidatePath = False
        self.consolidationResources = []
        self.pathSaveRelative = False
        self.metadataURI = str()
    
class CIMProjectThumbnailOptions():
    """
      A collection of options governing project thumbnail generation.
    """
    def __init__(self, *args, **Kwargs):
        self.generationMethod = ProjectThumbnailGenerationMethod.Manual
        self.automaticGenerationSource = ProjectThumbnailAutomaticGenerationSource.ActiveMap
        self.mapURI = str()
    
class CIMStatisticalDataCollection():
    """
      A statistical data collection is used by the Business Analyst to 
      organize and present data that can be aggregated by the enrich 
      functionality. This is not the storage of the data, it is metadata 
      about the data that describes how data will be aggregated by Business 
      Analyst. Currently, data can be calculated by defining what data 
      collections and analysis variables are needed in the output for 
      a given input features.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.shortDescription = str()
        self.longDescription = str()
        self.keywords = []
        self.countries = []
        self.categories = []
        self.author = str()
        self.creationDate = GetPythonClass('datetime', 'datetime')
        self.lastRevisionDate = GetPythonClass('datetime', 'datetime')
        self.calculators = []
        self.dataVintage = str()
        self.dataVintageDescription = str()
        self.icon = str()
    
class CIMStatisticalDataCollectionCalculator():
    """
      Base class for statistical data collection calculator.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
    
class CIMStatisticalDataCollectionField():
    """
      Represents a field of a statistical data collection that matches 
      to existing field in referenced feature dataset.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.alias = str()
        self.category = str()
        self.apportionmentMethod = str()
        self.summaryType = StatisticalDataCollectionSummaryType.Avg
        self.weightFieldName = str()
        self.precision = 0
        self.fieldFormat = ''
        self.vintage = str()
        self.script = str()
        self.scriptLanguage = LabelExpressionEngine.Python
        self.usedFields = []
        self.showInDataBrowser = True
        self.outputFieldType = esriFieldType.esriFieldTypeDouble
    
class CIMStatisticalDataCollectionInputProperty():
    """
      Represents a property of an input feature.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.alias = str()
        self.propertyType = esriFieldType.esriFieldTypeDouble
    
class CIMStatisticalDataCollectionStandardVariable():
    """
      Represents a field of a statistical data collection that matches 
      to an existing variable in referenced feature dataset.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.showInDataBrowser = True
    
class CIMVersion():
    """
      Represents a version object used for representing the saved version.
    """
    def __init__(self, *args, **Kwargs):
        self.version = str()
        self.build = int()
    
class CIMView():
    """
      Represents a view in the project.
    """
    def __init__(self, *args, **Kwargs):
        self.viewableObjectPath = str()
        self.viewType = str()
        self.instanceID = 0
    
class CIMBookmarkDocument(CIMVersion):
    """
      Represents a bookmark document which is the document type used 
      for saving .bkmx files.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.spatialReference = GetPythonClass('arcpy', 'SpatialReference')
        self.bookmarks = []
    
class CIMColorReplacementDocument(CIMVersion):
    """
      Represents list of color replacement rules.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.replacementRules = []
    
class CIMDocumentInfo(CIMVersion):
    """
      Represents high level information for a document.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.documentTitle = str()
        self.subject = str()
        self.author = str()
        self.category = str()
        self.comments = str()
        self.keywords = str()
        self.credits = str()
        self.hyperlinkBase = str()
        self.savePreview = False
        self.activeMapRepositoryPath = str()
        self.useRelativePath = False
        self.antialiasing = esriBGLAntialiasingMode.esriBGLAntialiasingNone
        self.textAntialiasing = esriBGLTextAAlias.esriBGLTextAAliasForce
    
class CIMGenericView(CIMView):
    """
      Represents a generic view.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.viewProperties = {}
    
class CIMLayerDocument(CIMVersion):
    """
      Represents a layer document which is the document type used for 
      saving .lyrx files.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.layers = []
        self.tables = []
        self.layerDefinitions = []
        self.binaryReferences = []
        self.tableDefinitions = []
        self.rGBColorProfile = str()
        self.cMYKColorProfile = str()
        self.elevationSurfaceLayerDefinitions = []
    
class CIMLayoutDocument(CIMVersion):
    """
      Represents a layout document which is the document type used for 
      saving .pagx files.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.binaryReferences = []
        self.layerDefinitions = []
        self.mapDefinitions = []
        self.tableDefinitions = []
        self.layoutDefinition = 'CIMLayout'
        self.linkChartDefinitions = []
        self.timelineDefinitions = []
        self.videoDefinitions = []
        self.elevationSurfaceLayerDefinitions = []
    
class CIMMapDocument(CIMVersion):
    """
      Represents a map document which is the document type used for saving 
      .mapx files.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.mapDefinition = 'CIMMap'
        self.layerDefinitions = []
        self.binaryReferences = []
        self.tableDefinitions = []
        self.linkChartDefinitions = []
        self.timelineDefinitions = []
        self.videoDefinitions = []
        self.elevationSurfaceLayerDefinitions = []
    
class CIMMapView(CIMView):
    """
      Represents a map view in the project.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.viewingMode = MapViewingMode.Map
        self.camera = 'CIMViewCamera'
        self.verticalExaggerationScaleFactor = 1.0
        self.timeDisplay = 'CIMMapTimeDisplay'
        self.layerRanges = []
        self.rangeSliderSettings = 'CIMSliderSettings'
        self.timeSliderSettings = 'CIMSliderSettings'
        self.floorFilterSettings = 'CIMFloorFilterSettings'
        self.sceneDrawingMode = SceneDrawingMode.Perspective
        self.fieldOfView = 55.0
        self.pauseDrawing = False
        self.pauseAnimatedSymbols = False
        self.exploratoryAnalysis = []
        self.visualEffect = 'CIMVisualEffect'
        self.cameraEffect = 'CIMCameraEffect'
        self.postprocessingEffects = []
        self.colorVisionDeficiencyMode = ColorVisionDeficiencyType.eNone
    
class CIMPresentationDocument(CIMVersion):
    """
      Represents a presentation document which is the document type used 
      for saving .prsx files.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.presentationDefinition = 'CIMPresentation'
        self.binaryReferences = []
        self.layerDefinitions = []
        self.mapDefinitions = []
        self.tableDefinitions = []
        self.linkChartDefinitions = []
        self.timelineDefinitions = []
        self.videoDefinitions = []
        self.elevationSurfaceLayerDefinitions = []
    
class CIMStatisticalDataCollectionDocument(CIMVersion):
    """
      Represents a document used for saving statistical data collections.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.statisticalDataCollection = 'CIMStatisticalDataCollection'
    
class CIMStatisticalDataCollectionFeatureLayerCalculator(CIMStatisticalDataCollectionCalculator):
    """
      Statistical data collection calculator based on a feature layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.datasetID = str()
        self.dataConnection = 'CIMDataConnection'
        self.fields = []
        self.apportionmentDatasetConnection = 'CIMDataConnection'
    
class CIMStatisticalDataCollectionInputAreaProperty(CIMStatisticalDataCollectionInputProperty):
    """
      Represents the property used to calculate the geodesic area of 
      the input feature.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.units = str()
    
class CIMStatisticalDataCollectionInputPropertiesCalculator(CIMStatisticalDataCollectionCalculator):
    """
      Statistical Data Collection calculator for accessing properties 
      of input features, e.g. Area of polygonal input.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.area = 'CIMStatisticalDataCollectionInputAreaProperty'
    
class CIMStatisticalDataCollectionScriptCalculator(CIMStatisticalDataCollectionCalculator):
    """
      Statistical data collection calculator based on a scripts that 
      use fields from other calculators.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.scripts = []
    
class CIMStatisticalDataCollectionStandardDataCalculator(CIMStatisticalDataCollectionCalculator):
    """
      Statistical data collection calculator based on a standard local 
      data.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.datasetID = str()
        self.variables = []
    
class CIMTableView(CIMView):
    """
      Represents a table view in the project.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fieldOrder = str()
        self.sortInformation = {}
        self.selectionMode = False
        self.honorTime = False
        self.frozenFields = 0
        self.zoomLevel = 0
        self.fieldWidth = {}
        self.displaySubtypeDomainDescriptions = False
        self.qualifyJoinFieldNames = False
        self.time = TimeValue
        self.honorRange = True
        self.ranges = []
        self.extent = GetPythonClass('arcpy', 'Extent')
        self.timeRelation = esriTimeRelation.esriTimeRelationOverlaps
        self.showOnlyContingentValueFields = False
        self.highlightInvalidContingentValueFields = False
        self.autoPopulateContingentValueFields = True
        self.columnHeaderRowHeight = TableRowHeightType.eNone
        self.rowHeight = TableRowHeightType.eNone
    
class CIMExternalTableView(CIMTableView):
    """
      Represents an external table view.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMDataConnection'
    
class CIMMapTableView(CIMTableView):
    """
      Represents a map table view in the project.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.mapURI = str()
    
