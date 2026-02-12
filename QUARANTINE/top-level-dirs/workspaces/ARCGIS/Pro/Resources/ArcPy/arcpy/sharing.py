import arcpy
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject as _convertArcObjectToPythonObject
from arcpy.geoprocessing._base import gp_fixargs as _gp_fixargs
from arcpy.arcobjects._base import _ObjectWithoutInitCall
from arcpy._sharingproperties import _PackageSharing, _ZDefault, _Timezone, _Cache, _Extension, _Pooling, _ParameterChecker, _ExtensionFeatureServer, _passthrough_attr_intpos, _passthrough_attr

class _SharingDraftBase(_ParameterChecker):

    def __init__(self):
        import arcgisscripting
        self._arc_object = arcgisscripting._sharing.SharingDraft(*_gp_fixargs((), True))
        self._allowed_parameters = {
            "overwriteExistingService",
            "serverType",
            "serviceType",
            "serviceName",
            "portalFolder",
            "allowExporting",
            "summary",
            "tags",
            "description",
            "credits",
            "useLimitations",
            "copyDataToServer",
            "serverFolder",
            "federatedServerUrl",
            "offline",
            "offlineTarget",
            "draftValue",
            "checkUniqueIDAssignment",
            "useCIMSymbols",
            "sharing",
        }
        self.overwriteExistingService=False
        self.serviceName=""
        self.portalFolder=""
        self.summary=""
        self.tags=""
        self.description=""
        self.credits=""
        self.useLimitations=False
        self.offline=False
        self.sharing = _PackageSharing()
    
    def exportToSDDraft(self, out_sddraft):
        self._validateParameters()
        return _convertArcObjectToPythonObject(self._arc_object.exportToSDDraft(out_sddraft, self))

class _FeatureSharingDraft(_SharingDraftBase):

    maxRecordCount = _passthrough_attr_intpos("_maxRecordCount")

    def __init__(self):
        super().__init__()
        self._allowed_parameters.update(["approvePublicDataCollection", 
                                        "preserveEditUsersAndTimestamps",
                                        "allowUpdateWithoutMValues",
                                        "maxRecordCount",
                                        "featureCapabilities",
                                        "zDefault",
                                        "timezone",
                                        ])
        self.checkUniqueIDAssignment=False
        self.useCIMSymbols=False
        self.approvePublicDataCollection=False
        self.preserveEditUsersAndTimestamps=False
        self.allowUpdateWithoutMValues=True
        self._maxRecordCount=2000
        self.featureCapabilities = ""
        self.zDefault = _ZDefault()
        self.timezone = _Timezone()

class _TileSharingDraft(_SharingDraftBase):

    def __init__(self):
        super().__init__()
        self._allowed_parameters.update(["cache"])
        self.cache = _Cache()

class _MapImageSharingDraft(_SharingDraftBase):

    maxRecordCount = _passthrough_attr_intpos("_maxRecordCount")

    def __init__(self):
        super().__init__()
        self._allowed_parameters.update(["extension", 
                                        "maxRecordCount",
                                        "timezone",
                                        "pooling",
                                        "mapOperations",
                                        "enableDynamicWorkspaces",
                                        "cache",
                                        "federatedServerUrl",
                                        "enableCache"
                                        ])
        self.federatedServerUrl=""
        self.serverFolder = ""
        self.copyDataToServer = False
        self.checkUniqueIDAssignment=False
        self.useCIMSymbols=False
        self._maxRecordCount = 2000
        self.enableDynamicWorkspaces = True
        self.mapOperations=""
        self.enableCache = False
        self.extension = _Extension("MAP_IMAGE")
        self.cache = _Cache(cacheOnDemand = False, useExistingCache = False)
        self.timezone = _Timezone()
        self.pooling = _Pooling()

class _MapServiceSharingDraft(_SharingDraftBase):

    maxRecordCount = _passthrough_attr_intpos("_maxRecordCount")

    def __init__(self):
        super().__init__()
        self._allowed_parameters.update(["extension", 
                                        "maxRecordCount",
                                        "timezone",
                                        "pooling",
                                        "mapOperations",
                                        "enableDynamicWorkspaces",
                                        "cache",
                                        "federatedServerUrl",
                                        "targetServer",
                                        "enableCache"
                                        ])
        self.federatedServerUrl=""
        self.targetServer = ""
        self.serverType="FEDERATED_SERVER"
        self.serviceType="MAP_SERVICE"
        self.serverFolder=""
        self.copyDataToServer = False
        self.checkUniqueIDAssignment=False
        self._maxRecordCount = 2000
        self.enableDynamicWorkspaces = True
        self.mapOperations=""
        self.enableCache = False
        self.extension = _Extension("MAP_SERVICE")
        self.cache = _Cache(cacheOnDemand = False, useExistingCache = False)
        self.timezone = _Timezone()
        self.pooling = _Pooling()
        # the below props are unsupported for MapService
        delattr(self, "sharing")
        delattr(self, "portalFolder")

    def exportToSDDraft(self, out_sddraft):
        self.federatedServerUrl = self.targetServer # todo: temp fix
        super().exportToSDDraft(out_sddraft)

class GeoprocessingSharingDraft(_ObjectWithoutInitCall):

    def __init__(self, **kwargs):
        import arcgisscripting
        self._arc_object = arcgisscripting._sharing.SharingDraft(*_gp_fixargs((), True))
        self.serverType = "STANDALONE_SERVER"
        self.serviceType = "GP_SERVICE"
        self.serviceName = ""
        self.draftValue = None
        self.description = ""
        self.summary = ""
        self.tags = ""
        self.offline = False
        self.targetServer = ""
        self.overwriteExistingService = False
        self.copyDataToServer = False
        self.executionType = "Asynchronous"
        self.serverFolder = ""
        self.portalFolder = ""
        self.maximumRecords = 1000
        self.maxInstances = 2
        self.minInstances = 1
        self.resultMapService = False
        self.messageLevel = "Error"
        self.maxUsageTime = 600
        self.maxWaitTime = 60
        self.maxIdleTime = 1800
        self.capabilities = None
        self.constantValues = None
        self.choiceLists = None
        self.offlineTarget = "11"
        self.enableOutputFeatureService = None
        self.convertFeatureLayerURL = True
        self.removeDefaultValues = None
        self.GPStringValues = None
        self.enableOutputImageService = False
        for k, v in kwargs.items():
            if k in self.__dict__:
                setattr(self, k, v)
            else:
                raise KeyError(k)

    def exportToSDDraft(self, out_sddraft):
        self._out_sddraft = out_sddraft
        return _convertArcObjectToPythonObject(self._arc_object.exportToGPSDDraft(out_sddraft, self))
    
    def analyzeSDDraft(self, out_sddraft = None):
        if out_sddraft is None and hasattr(self, '_out_sddraft'):
            out_sddraft = self._out_sddraft
        return _convertArcObjectToPythonObject(self._arc_object.analyzeGPSDDraft(out_sddraft, self))

def CreateSharingDraft(server_type, service_type, service_name, draft_value):

    if service_type == "MAP_SERVICE" and server_type == "STANDALONE_SERVER": #todo: validation
        map_service = _MapServiceSharingDraft()
        map_service.serviceName = service_name
        map_service.serverType = server_type
        map_service.serviceName = service_name
        map_service.draftValue = draft_value._arc_object #todo: temp fix
        return map_service

    if service_type == "GP_SERVICE" or service_type == "WEB_TOOL":
        gp_service = GeoprocessingSharingDraft()
        gp_service.serverType = server_type
        gp_service.serviceType = service_type
        gp_service.serviceName = service_name
        gp_service.draftValue = draft_value
        return gp_service
    
class _SceneLayerSharingDraft(_ParameterChecker):

    def __init__(self, serviceType, serviceName, draftValue, sharingDraft, isLocalScene):
        super().__init__()
        self._allowed_parameters = {"serviceType",
                                    "serviceName",
                                    "featureCapabilities", 
                                    "approvePublicDataCollection",
                                    "allowUpdateWithoutMValues",
                                    "preserveEditUsersAndTimestamps",
                                    "zDefault",
                                    "export",
                                    "compressedTextures",
                                    "sharing",
                                    "maxRecordCount",
                                    "timezone",
                                    "portalFolder",
                                    "serverFolder",
                                    "summary",
                                    "credits",
                                    "description",
                                    "tags",
                                    "useLimitations"
                                    }
        self.serviceType = serviceType
        self.serviceName = serviceName
        self._sharingDraft = sharingDraft
        self._draftValue = draftValue
        self.compressedTextures = False
        self.export = False
        self._isLocalScene = isLocalScene
        self._webItemName = '_'.join(serviceName.split())
        self._sharingDraft.draftValue = draftValue
        self._connectionID = "HOSTING_SERVER" #can only be published to hosting server

        setattr(_SceneLayerSharingDraft, "sharing", _passthrough_attr("_sharingDraft.sharing"))
        setattr(_SceneLayerSharingDraft, "maxRecordCount", _passthrough_attr("_sharingDraft.maxRecordCount"))
        setattr(_SceneLayerSharingDraft, "timezone", _passthrough_attr("_sharingDraft.timezone"))
        setattr(_SceneLayerSharingDraft, "portalFolder", _passthrough_attr("_sharingDraft.portalFolder"))
        setattr(_SceneLayerSharingDraft, "tags", _passthrough_attr("_sharingDraft.tags"))
        setattr(_SceneLayerSharingDraft, "summary", _passthrough_attr("_sharingDraft.summary"))
        setattr(_SceneLayerSharingDraft, "credits", _passthrough_attr("_sharingDraft.credits"))
        setattr(_SceneLayerSharingDraft, "description", _passthrough_attr("_sharingDraft.description"))
        setattr(_SceneLayerSharingDraft, "useLimitations", _passthrough_attr("_sharingDraft.useLimitations"))

        if isinstance(sharingDraft, _FeatureSharingDraft):
            setattr(_SceneLayerSharingDraft, "featureCapabilities", _passthrough_attr("_sharingDraft.featureCapabilities"))
            setattr(_SceneLayerSharingDraft, "approvePublicDataCollection", _passthrough_attr("_sharingDraft.approvePublicDataCollection"))
            setattr(_SceneLayerSharingDraft, "allowUpdateWithoutMValues", _passthrough_attr("_sharingDraft.allowUpdateWithoutMValues"))
            setattr(_SceneLayerSharingDraft, "preserveEditUsersAndTimestamps", _passthrough_attr("_sharingDraft.preserveEditUsersAndTimestamps"))
            setattr(_SceneLayerSharingDraft, "zDefault", _passthrough_attr("_sharingDraft.zDefault"))
        elif isinstance(sharingDraft, _MapImageSharingDraft):
            self._sharingDraft.federatedServerUrl = ""
            self._sharingDraft.extension.feature.featureCapabilities = "Query,Create,Update,Delete,Editing"
            self._sharingDraft.extension.feature.featureCapabilities = "Query"
            self._sharingDraft.extension.feature.isEnabled = True
            setattr(_SceneLayerSharingDraft, "featureCapabilities", _passthrough_attr("_sharingDraft.extension.feature.featureCapabilities"))
            setattr(_SceneLayerSharingDraft, "allowUpdateWithoutMValues", _passthrough_attr("_sharingDraft.extension.feature.allowUpdateWithoutMValues"))
            setattr(_SceneLayerSharingDraft, "zDefault", _passthrough_attr("_sharingDraft.extension.feature.zDefault"))
            setattr(_SceneLayerSharingDraft, "serverFolder", _passthrough_attr("_sharingDraft.serverFolder"))
        self._sharingDraft._validateParameters()
        _convertArcObjectToPythonObject(self._sharingDraft._arc_object.createDraftForWebLayersWithAssociatedLayers(self))
    
    def analyzeForSharing(self):
        self._validateParameters()
        self._sharingDraft._validateParameters()
        try:
            jsonObj =  _convertArcObjectToPythonObject(self._sharingDraft._arc_object.analyze(self))
            if isinstance(jsonObj, str):
                import json
                return json.loads(jsonObj)
            return jsonObj
        except:
            return jsonObj

    
def Publish(object, item_id = None):
    if not isinstance(object, _SceneLayerSharingDraft):
        raise ValueError(arcpy.GetIDMessage(89459))
    
    object._validateParameters()
    object._sharingDraft._validateParameters()
    if item_id == None:
        item_id = {};

    return _convertArcObjectToPythonObject(object._sharingDraft._arc_object.publish(object, item_id))
