import arcpy
import json
from MapAreaServiceTaskBase import ServiceTaskBase, OfflineException, ServiceNameFromUrl
import uuid
import shutil
from math import floor
from re import match
from datetime import datetime, timedelta, timezone


# service properties
# itemId (in case of update)
# title*
# url*
# layers*
# folderId
# layerQueries
# layerDefinition comes from map
# returnAttachments
# syncDirection
# syncModel
# attachmentsSyncDirection
# createPkgDeltas(maxDeltaAge, maxDeltaCount)
# UseSyncForRefresh(true or false)

# steps
# -1-error
# 1-get service def,submit create replica job
# 2-check replica job status, add/update item
# 3-check item status,update job state in item
# 4-Complete

# task function return values
# -1 error, 0 repeat, 1 complete

# errors
# general error

# It has either polygon or extent

class FeatureServiceTask(ServiceTaskBase):
    def __init__(self, hostedgp, serviceprop, itemInfo, userInfo):

        self.jobUrl = ""
        self.replicaUrl = ""
        self.maxSteps = 4.0
        self.replicaID = None
        self.returnAttachments = None
        self.attachmentsSyncDirection = None
        self.layers = None
        self.layerQueries = None
        self.item = None
        self.layerServerGens = None
        self.replicaServerGen = None
        self.delta = None
        self.syncModel = None
        self.useSyncForRefresh = True
        self.syncResponseHasChanges = False
        self.createPkgDeltas = None
        self.layerDefinition = None
        self.mapOfflineProps = None
        self.isEditable = None
        self.hasUtilityNetworkLayer = False
        self.syncDataOptions = None
        self.reconcileFlagInSync = None
        self.replicaJobTimeTracker = None
        self.checkItemStatus = False
        self.itemStatusTimeTracker = None
        area = None
        extent = None

        if itemInfo is not None:
            # get all properties from item
            item = itemInfo['item']

            if 'properties' not in item or item['properties'] is None:
                raise OfflineException('ItemPropMissing', {'itemId': item['id'], 'properties': 'url,layers,extent'})

            # check for required properties
            if 'url' not in item['properties']:
                raise OfflineException('ItemPropMissing', {'itemId': item['id'], 'properties': 'url'})

            if 'layers' not in item['properties']:
                raise OfflineException('ItemPropMissing', {'itemId': item['id'], 'properties': 'layers'})

            if 'area' in item['properties']:
                area = item['properties']['area']

            if 'extent' in item['properties']:
                extent = item['properties']['extent']

            if extent is None and area is None:
                raise OfflineException('ItemPropMissing', {'itemId': item['id'], 'properties': 'extent or area'})

            super(FeatureServiceTask, self).__init__(hostedgp, item['properties']['url'], extent, area,
                                                     userInfo)

            self.item = item

            if 'token' in itemInfo:
                self.token = itemInfo['token']
            if 'referer' in itemInfo:
                self.referer = itemInfo['referer']

            self.layers = item['properties']['layers']

            if 'returnAttachments' in item['properties']:
                self.returnAttachments = item['properties']['returnAttachments']

            if 'ownerFolder' in item:
                self.folderId = item['ownerFolder']

            if 'layerQueries' in item['properties']:
                self.layerQueries = item['properties']['layerQueries']

            if 'attachmentsSyncDirection' in item['properties']:
                self.attachmentsSyncDirection = item['properties']['attachmentsSyncDirection']

            if 'syncModel' in item['properties']:
                self.syncModel = item['properties']['syncModel']

            if 'useSyncForRefresh' in item['properties']:
                self.useSyncForRefresh = item['properties']['useSyncForRefresh']

            if 'createPkgDeltas' in item['properties']:
                self.createPkgDeltas = item['properties']['createPkgDeltas']

            if 'replicaID' in item['properties']:
                self.replicaID = item['properties']['replicaID']

            if 'layerServerGens' in item['properties']:
                self.layerServerGens = item['properties']['layerServerGens']

            if 'syncDataOptions' in item['properties']:
                self.syncDataOptions = item['properties']['syncDataOptions']

            if 'replicaServerGen' in item['properties']:
                self.replicaServerGen = item['properties']['replicaServerGen']

            self.itemId = item['id']

            if 'hasUtilityNetworkLayer' in item['properties']:
                self.hasUtilityNetworkLayer = item['properties']['hasUtilityNetworkLayer']
        else:
            # verify properties
            if 'url' not in serviceprop:
                raise OfflineException('MissingProperty', {'name': 'url'})

            if 'layers' not in serviceprop:
                raise OfflineException('MissingProperty', {'name': 'layers'})

            if 'area' in serviceprop:
                area = serviceprop['area']

            if 'extent' in serviceprop:
                extent = serviceprop['extent']

            if extent is None and area is None:
                raise OfflineException('MissingProperty', {'name': 'extent or area'})

            if "title" not in serviceprop:
                raise OfflineException('MissingProperty', {'name': 'title'})

            if 'mapAreaItemId' not in serviceprop:
                raise OfflineException('MissingProperty', {'name': 'mapAreaItemId'})

            super(FeatureServiceTask, self).__init__(hostedgp, serviceprop['url'], extent, area, userInfo)

            if 'token' in serviceprop:
                self.token = serviceprop['token']

            if 'referer' in serviceprop:
                self.referer = serviceprop['referer']

            if 'folderId' in serviceprop:
                self.folderId = serviceprop['folderId']

            if 'returnAttachments' in serviceprop:
                self.returnAttachments = serviceprop['returnAttachments']

            if 'attachmentsSyncDirection' in serviceprop:
                self.attachmentsSyncDirection = serviceprop['attachmentsSyncDirection']

            if 'syncModel' in serviceprop:
                self.syncModel = serviceprop['syncModel']

            if 'useSyncForRefresh' in serviceprop:
                self.useSyncForRefresh = serviceprop['useSyncForRefresh']

            if 'createPkgDeltas' in serviceprop:
                self.createPkgDeltas = serviceprop['createPkgDeltas']
                if 'maxDeltaAge' not in self.createPkgDeltas:
                    self.createPkgDeltas['maxDeltaAge'] = 5  # default to 5 days.

            if 'layerDefinition' in serviceprop:
                self.layerDefinition = serviceprop['layerDefinition']

            if 'mapOfflineProps' in serviceprop:
                self.mapOfflineProps = serviceprop['mapOfflineProps']

            if 'mapAreaItemSharing' in serviceprop:
                self.mapAreaItemSharing = serviceprop['mapAreaItemSharing']

            self.layers = serviceprop['layers']

            self.title = serviceprop['title']

            self.mapAreaItemId = serviceprop['mapAreaItemId']

            if 'layerQueries' in serviceprop:
                self.layerQueries = serviceprop['layerQueries']

            if 'hasUtilityNetworkLayer' in serviceprop:
                self.hasUtilityNetworkLayer = serviceprop['hasUtilityNetworkLayer']

        self.serviceName = ServiceNameFromUrl(self.url, "FeatureServer")

    # for task functions 0-repeat, 1-continue, -1 - error
    # 0 done , -1 error, 1 continue
    def ProcessTask(self):
        try:
            if self.step == -1:
                return -1

            if self.step >= 4:
                return 0

            if self.step == 3:
                if self.checkItemStatus and self.itemStatusTimeTracker is not None:
                    currentTime = datetime.now(timezone.utc)
                    timeDiff = currentTime - self.itemStatusTimeTracker
                    if timeDiff.seconds > 5 * 60:
                        self.itemStatusTimeTracker = currentTime
                        arcpy.AddMessage(f"{self.serviceName} - Over 5min wait checking status for package item:"
                                         f"{self.itemId}")
                    props = {}
                    if self.folderId is not None:
                        props['folderId'] = self.folderId
                    ret = self.CheckItemStatus(self.itemId, props)
                else:
                    ret = 1
                if ret == 1:
                    # now do sharing and relationship
                    # if item as added
                    if not self.isUpdate:
                        try:
                            arcpy.AddMessage(f"{self.serviceName} - Setting up sharing/relationship for package item:"
                                             f"{self.itemId}")
                            self.PostAddItem()
                        except Exception as err:
                            # delete the item
                            try:
                                arcpy.AddMessage(
                                    f"{self.serviceName}"
                                    " - Failed to setup sharing/relationship deleting package item:"
                                    f"{self.itemId}")
                                self.DeletePackageItem()
                            except Exception:
                                pass
                            raise err
                    self.step = 4  # complete
                    arcpy.AddMessage(f"{self.serviceName} - Processing complete")
                    return 0

            if self.step == 2:
                ret = self.CheckCreateReplicaJob()
                if ret == 1:
                    arcpy.AddMessage(f"{self.serviceName} - Add/Update package item")
                    self.AddUpdateItem()
                    self.step = 3
                    if self.checkItemStatus:
                        arcpy.AddMessage(f"{self.serviceName} - Checking status for package item:{self.itemId}")
                        self.itemStatusTimeTracker = datetime.now(timezone.utc)
            if self.step == 1:
                arcpy.AddMessage(f"{self.serviceName} - Get Service Definition")

                self.GetFeatureServiceDef()

                self.CheckServiceDef()
                # if already done in compare, this will be nop
                self.SetupMapProperties()
                # check the SR for extent
                self.HandleItemExtent()
                if self.item is not None and self.useSyncForRefresh:
                    arcpy.AddMessage(f"{self.serviceName} - Submit sync job")
                    self.SubmitSyncReplicaJob()
                else:
                    arcpy.AddMessage(f"{self.serviceName} - Submit replica job")
                    self.SubmitCreateReplicaJob()
                self.step = 2

            return 1
        except Exception as err:
            self.error = str(err)
        return -1

    def SetupMapProperties(self):
        # check if editable or readonly
        # check all properties, if they are none , user didn't provide
        # figure out default values
        edit_download = 'featuresAndAttachments'
        edit_sync = 'syncFeaturesAndAttachments'
        readonly_downloadAttach = True
        # map offline properties
        # download (none,featuresAndAttachments, features)
        # sync (uploadFeaturesAndAttachments, syncFeaturesAndAttachments, syncFeaturesUploadAttachments)
        if self.mapOfflineProps is not None:
            if 'editableLayers' in self.mapOfflineProps:
                if 'download' in self.mapOfflineProps['editableLayers']:
                    edit_download = self.mapOfflineProps['editableLayers']['download']
                if 'sync' in self.mapOfflineProps['editableLayers']:
                    edit_sync = self.mapOfflineProps['editableLayers']['sync']
            if 'readonlyLayers' in self.mapOfflineProps:
                if 'downloadAttachments' in self.mapOfflineProps['readonlyLayers']:
                    readonly_downloadAttach = self.mapOfflineProps['readonlyLayers']['downloadAttachments']

        # check layerQueries(layerDefinition), returnAttachments, attachmentSyncDirection
        if self.layerQueries is None:
            self.layerQueries = {}
            for layerId in self.layers:
                layerEntry = {}
                whereClause = None
                if self.layerDefinition is not None and str(layerId) in self.layerDefinition.keys():
                    if 'where' in self.layerDefinition[str(layerId)]:
                        whereClause = self.layerDefinition[str(layerId)]['where']

                if self.isEditable:
                    if edit_download == 'none':
                        # add query option as none for each layer
                        layerEntry['queryOption'] = "none"

                if whereClause is not None:
                    layerEntry['where'] = whereClause

                if len(layerEntry.keys()) > 0:
                    self.layerQueries[str(layerId)] = layerEntry

        if self.returnAttachments is None:
            if not self.isEditable:
                # not editable may not want attachment
                self.returnAttachments = readonly_downloadAttach
            else:
                # editable set it to false if download is features
                if edit_download == 'featuresAndAttachments':
                    self.returnAttachments = True
                else:
                    self.returnAttachments = False

        if self.attachmentsSyncDirection is None:
            if self.isEditable:
                # either bi or upload only
                if edit_sync == 'syncFeaturesAndAttachments':
                    self.attachmentsSyncDirection = 'bidirectional'
                else:
                    self.attachmentsSyncDirection = 'upload'
            else:
                if readonly_downloadAttach:
                    self.attachmentsSyncDirection = 'bidirectional'
                else:
                    self.attachmentsSyncDirection = 'none'

    def CheckServiceDef(self):
        # check if sync is enabled
        syncDataOptions = 0
        supportsReconcile = False
        if "syncEnabled" in self.serviceDef and self.serviceDef['syncEnabled']:
            # check map properties for sync data options
            mapSyncDataOptions = None
            if self.mapOfflineProps is not None:
                # check for sync data options
                if 'syncDataOptions' in self.mapOfflineProps:
                    mapSyncDataOptions = self.mapOfflineProps['syncDataOptions']

            # check if per layer sync is enabled otherwise default is perReplica
            syncCap = None
            if "syncCapabilities" in self.serviceDef:
                syncCap = self.serviceDef["syncCapabilities"]
                if self.syncModel is None:
                    if "supportsPerLayerSync" in syncCap:
                        if syncCap["supportsPerLayerSync"]:
                            self.syncModel = "perLayer"
                        else:
                            self.syncModel = "perReplica"

                # check for reconcile flag will be used later
                if "supportsBranchVersionReconcile" in syncCap:
                    if syncCap["supportsBranchVersionReconcile"]:
                        supportsReconcile = True
            # only change syncDataOption when new service
            # object is created.
            if self.syncDataOptions is None:
                if mapSyncDataOptions is not None:
                    # check for supportedSyncDataOptions
                    # if found do an & with mapSyncOptions
                    if syncCap is not None and "supportedSyncDataOptions" in syncCap:
                        syncDataOptions = int(mapSyncDataOptions) & int(syncCap['supportedSyncDataOptions'])
                    else:
                        syncDataOptions = mapSyncDataOptions

                elif syncCap is not None and "supportedSyncDataOptions" in syncCap:
                    # check if create replica needs extra parameter for network utility layers
                    supportedSyncDataOptions = syncCap['supportedSyncDataOptions']
                    if self.hasUtilityNetworkLayer:
                        if supportedSyncDataOptions & 16:  # flag for UN layer
                            syncDataOptions |= 16
                        if supportedSyncDataOptions & 128:  # extra flag for UN system tables
                            syncDataOptions |= 128
                    if supportedSyncDataOptions & 4:  # contingent values
                        syncDataOptions |= 4
                    if supportedSyncDataOptions & 8:
                        syncDataOptions |= 8

                # else:
                # for contingent value (AGOL case)
                # enterprise Hosted FS do not work with this option
                # AGOL will expose supportedSyncDataOptions
                # syncDataOptions = 4

            if syncDataOptions > 0:
                self.syncDataOptions = syncDataOptions
                if syncDataOptions & 1024 and self.hasUtilityNetworkLayer and syncCap is not None:
                    # check for supportedFullUNOptions (11.3)
                    if ("supportedFullUNOptions" not in syncCap or
                            ("perReplicaDownload" not in syncCap["supportedFullUNOptions"] and
                                "perReplicaBiDirectional" not in syncCap["supportedFullUNOptions"])):
                        self.syncModel = "none"
                        self.useSyncForRefresh = False
        else:
            # error sync not enabled
            restservicestr = '/rest/services/'
            restservicepos = self.url.find(restservicestr)
            featureservicepos = self.url.rfind('/FeatureServer')
            serviceName = self.url
            if restservicepos > 0 and featureservicepos > 0:
                serviceName = self.url[restservicepos + len(restservicestr):featureservicepos]

            raise OfflineException('SyncNotEnabled', {'name': serviceName})  # self.serviceDef['name']})

        # also check if versioned editing, disable sync
        if 'hasVersionedData' in self.serviceDef:
            if self.serviceDef['hasVersionedData']:
                # check for branch versioned
                if 'hasBranchVersionedData' not in self.serviceDef or not self.serviceDef['hasBranchVersionedData']:
                    # do not use sync if editing,create,delete,update is present
                    if self.isEditable:
                        self.useSyncForRefresh = False
                # check if we need to pass reconcile flag to sync
                elif 'hasBranchVersionedData' in self.serviceDef and self.serviceDef['hasBranchVersionedData']:
                    if supportsReconcile:
                        self.reconcileFlagInSync = True
                        arcpy.AddMessage("Branch version with reconcile support.")

    def SubmitCreateReplicaJob(self):
        self.lastFunction = "SubmitCreateReplicaJob"
        submiturl = self.encodedUrl + "/createReplica"
        params = {
            'dataFormat': 'sqlite',
            'layers': sorted(self.layers),
            'async': True,
            'syncDirection': 'bidirectional',
            'returnAttachments': self.returnAttachments,
            'attachmentsSyncDirection': self.attachmentsSyncDirection
        }
        if self.syncModel is None:
            self.syncModel = "perReplica"

        params["syncModel"] = self.syncModel

        self.HandleAreaByRef()

        if self.areaValue is not None and 'polygon' in self.areaValue:
            params['geometry'] = json.dumps(self.areaValue['polygon'], ensure_ascii=False)
            params['geometryType'] = "esriGeometryPolygon"
            if 'spatialReference' in self.areaValue['polygon']:
                params['inSR'] = json.dumps(self.areaValue['polygon']['spatialReference'], ensure_ascii=False)
        elif self.extent is not None:
            params['geometry'] = json.dumps(self.extent, ensure_ascii=False)
            params['geometryType'] = "esriGeometryEnvelope"
            if 'spatialReference' in self.extent:
                params['inSR'] = json.dumps(self.extent['spatialReference'], ensure_ascii=False)
        elif "fullExtent" in self.serviceDef:
            # use the extent from service def
            params['geometry'] = json.dumps(self.serviceDef["fullExtent"], ensure_ascii=False)
            params['geometryType'] = "esriGeometryEnvelope"
            params['inSR'] = json.dumps(self.serviceDef["fullExtent"]["spatialReference"], ensure_ascii=False)
        # replicaSR
        if 'inSR' in params:
            params['replicaSR'] = params['inSR']
        # for each layer/table build the layerQueries
        if self.layerQueries is not None:
            params['layerQueries'] = self.layerQueries

        if self.syncDataOptions is not None:
            params['replicaOptions'] = {"syncDataOptions": self.syncDataOptions}

        try:
            arcpy.AddMessage(f"{self.serviceName} - Submitting Create replica Job:{submiturl.split('token=', 1)[0]}")
            job = self._handleError(self.RESTRequestWithRetry(submiturl, params), ['statusUrl'])
            self.replicaJobTimeTracker = datetime.now(timezone.utc)
        except Exception as err:
            raise OfflineException('CreateReplicaError', {'url': submiturl, 'error': str(err)})

        if "statusUrl" in job:
            self.jobUrl = self.EncodeUrl(job["statusUrl"])
            arcpy.AddMessage(f"{self.serviceName} - Job url:{self.jobUrl.split('token=', 1)[0]}")
            return 1  # move to next step
        else:
            raise OfflineException('CreateReplicaError',
                                   {'url': submiturl, 'error': json.dumps(job, ensure_ascii=False)})

    def CheckCreateReplicaJob(self):
        self.lastFunction = "CheckCreateReplicaJob"
        params = {}
        try:
            jobinfo = self._handleError(self.RESTRequestWithRetry(self.jobUrl, params), ['status'])
        except Exception as err:
            raise OfflineException('ReplicaJobError', {'url': self.jobUrl, 'error': str(err)})

        if "replicaID" in jobinfo:
            self.replicaID = jobinfo["replicaID"]

        jobStatus = jobinfo["status"]
        # we have submitted the job
        # check status
        if jobStatus == 'Failed' or jobStatus == 'CompletedWithErrors':
            # put error in error property
            if 'error' in jobinfo:
                raise OfflineException('ReplicaJobError',
                                       {'url': self.jobUrl, 'error': json.dumps(jobinfo['error'], ensure_ascii=False)})
            if 'messages' in jobinfo:
                # gp job get error message type
                for message in jobinfo['messages']:
                    if 'type' in message and message['type'] == 'esriJobMessageTypeError':
                        raise OfflineException('ReplicaJobError',
                                               {'url': self.jobUrl,
                                                'error': message['description']})

            raise OfflineException('ReplicaJobError',
                                   {'url': self.jobUrl,
                                    'error': json.dumps(jobinfo, ensure_ascii=False)})

        if jobStatus == 'Completed':
            # move to next step
            if "resultUrl" in jobinfo:
                self.replicaUrl = self.EncodeUrl(jobinfo["resultUrl"])
                # get info for server gen
                # replicaInfoUrl = self.url + '/replicas/' + self.replicaID
                # replicaInfo = self.RESTRequestWithRetry(replicaInfoUrl,params)
                layerServerGens = None
                replicaServerGen = None
                if "layerServerGens" in jobinfo:
                    layerServerGens = jobinfo["layerServerGens"]

                if 'replicaServerGen' in jobinfo:
                    replicaServerGen = jobinfo['replicaServerGen']

                if replicaServerGen is None and layerServerGens is None:
                    self.useSyncForRefresh = False  # disable the flag for arcgis server
                    # we cannot create deltas so full update always
                    #                     
                # in case of sync 
                if 'responseType' in jobinfo:
                    respType = jobinfo['responseType']
                    if respType == 'esriReplicaResponseTypeNoEdits':
                        self.syncResponseHasChanges = False
                        return 1
                    else:
                        self.syncResponseHasChanges = True
                # also update gens if we have them
                # we don't update on item gens if nothing changed
                if replicaServerGen is not None:
                    self.replicaServerGen = replicaServerGen
                if layerServerGens is not None:
                    self.layerServerGens = layerServerGens
                return 1
            else:
                raise OfflineException('ReplicaJobError', {'url': self.jobUrl, 'error': json.dumps(jobinfo)})

        # Log message on 5 min intervals
        if self.replicaJobTimeTracker is not None:
            currentTime = datetime.now(timezone.utc)
            timeDiff = currentTime - self.replicaJobTimeTracker
            if timeDiff.seconds > 5 * 60:
                self.replicaJobTimeTracker = currentTime
                arcpy.AddMessage(f"{self.serviceName} - Over 5 min wait on replica job, response:{json.dumps(jobinfo)}")
        return 0  # repeat this step

    def SubmitSyncReplicaJob(self):
        submiturl = self.encodedUrl + "/synchronizeReplica"
        param = {'replicaID': self.replicaID, 'transportType': 'esriTransportTypeUrl',
                 'returnAttachmentsDataByUrl': False, 'async': True, 'syncDirection': 'download',
                 'dataFormat': 'sqlite'}

        if self.replicaServerGen is not None:
            param['replicaServerGen'] = self.replicaServerGen
        elif self.layerServerGens is not None:
            param['syncLayers'] = self.layerServerGens

        if self.reconcileFlagInSync is not None:
            param['reconcileBranchVersion'] = self.reconcileFlagInSync
            arcpy.AddMessage(f"{self.serviceName} - Passing reconcileBranchVersion:{self.reconcileFlagInSync}")
        # submit job
        try:
            arcpy.AddMessage(f"{self.serviceName} - Submitting sync job:{submiturl.split('token=', 1)[0]}")
            job = self._handleError(self.RESTRequestWithRetry(submiturl, param), ['statusUrl'])
            self.replicaJobTimeTracker = datetime.now(timezone.utc)
        except Exception as err:
            raise OfflineException('SyncReplicaError',
                                   {'url': submiturl, 'replicaId': self.replicaID, 'error': str(err)})

        if "statusUrl" in job:
            self.jobUrl = self.EncodeUrl(job["statusUrl"])
            arcpy.AddMessage(f"{self.serviceName} - Job url :{self.jobUrl.split('token=', 1)[0]}")
            return 1  # move to next step
        else:
            raise OfflineException('SyncReplicaError', {'url': submiturl, 'replicaId': self.replicaID,
                                                        'error': json.dumps(job, ensure_ascii=False)})

    def MergeDeltaIntoPackage(self, syncUrl):
        # use item name as filename, should be with guid 
        fileName = arcpy.env.scratchFolder + '/' + self.item['name']
        # download the package
        arcpy.AddMessage(f"{self.serviceName} - Downloading package item to merge delta:{self.itemId}")
        self.GetItemDataAsFile(self.itemId, fileName)

        syncFileName = arcpy.env.scratchFolder + '/replica_' + str(uuid.uuid4()).replace('-', '') + ".geodatabase"
        # download delta
        try:
            arcpy.AddMessage(f"{self.serviceName} - Downloading changes to merge:{syncUrl.split('token=', 1)[0]}")
            with self._myUrlOpen(syncUrl) as response, open(syncFileName, "wb") as out_file:
                shutil.copyfileobj(response, out_file)
        except Exception as err:
            raise OfflineException('FailedToDownloadPkg', {'url': syncUrl, 'error': str(err)})

        arcpy.AddMessage(f"{self.serviceName} - Merging changes into package")
        self.hostedgp.ImportDelta(fileName, syncFileName)
        return fileName, syncFileName

    def AddDeltaAsResource(self, syncUrl):
        # add resource as url or explicitly from deltaFileName
        # not using file, could be large no esri multipart upload for resources
        # resource name is d_generation for layerreplica it is first layer
        if self.layerServerGens is not None:
            # create the string
            filename = "d_" + str(self.layerServerGens[0]['serverGen']) + ".geodatabase"

        elif self.replicaServerGen is not None:
            filename = "d_" + str(self.replicaServerGen) + ".geodatabase"
        else:
            raise Exception('Missing generation number')
        # rename(deltaFileName, filename)
        arcpy.AddMessage(f"{self.serviceName} - Adding delta changes as new resource:{filename}")
        self.AddResource(None, None, syncUrl, filename, self.itemId, self.folderId)

    def PurgeOldGens(self, replicaUrl, deltaFileName):
        # get last purged gens
        # get all resources
        # delete all lesser then equal to last purged gens
        # return last purged gen
        lastPurgedGen = None
        nextPurgedGen = None
        if self.item is not None and 'properties' in self.item:
            if 'lastPurgedGen' in self.item['properties']:
                lastPurgedGen = self.item['properties']['lastPurgedGen']

        resourcesResp = self.GetResources(self.itemId, {})
        resourceList = []
        total = 0
        num = 0
        while resourcesResp is not None:
            # make a list    
            if 'total' in resourcesResp:
                total = resourcesResp['total']
            if 'num' in resourcesResp:
                num += resourcesResp['num']
            if total > 0 and num <= total:
                for resource in resourcesResp['resources']:
                    m = None
                    if 'resource' in resource:
                        m = match('d_([0-9]+).geodatabase', resource['resource'])
                    if m is not None:
                        resourceToadd = {'name': resource['resource'], 'gen': int(m.group(1))}
                        if 'created' in resource:
                            resourceToadd['created'] = resource['created']
                            resourceList.append(resourceToadd)
                if num < total:
                    # make another request
                    resourcesResp = self.GetResources(self.itemId, {'start': num})
                    continue
            resourcesResp = None  # done with this batch

        if len(resourceList) > 0:
            resourceList = sorted(resourceList, key=lambda k: k['created'])
            # verify last resource gen matches items gen
            # if item gen is less than resource gen, purge all the existing resource 
            # set nextPurge to latest gens, so clients do package refresh
            lastResourceGen = resourceList[-1]['gen']
            lastItemGen = None
            isReplicaGen = False
            if 'replicaServerGen' in self.item['properties']:
                lastItemGen = self.item['properties']['replicaServerGen']
                isReplicaGen = True
            elif 'layerServerGens' in self.item['properties']:
                # sort it
                layerGenList = []
                for layerGen in self.item['properties']['layerServerGens']:
                    layerGenList.append(layerGen)

                if len(layerGenList) > 0:
                    layerGenList = sorted(layerGenList, key=lambda k: k['id'])
                    lastItemGen = layerGenList[0]['serverGen']
            if lastItemGen is not None:
                if lastResourceGen > lastItemGen:
                    if isReplicaGen:
                        return self.replicaServerGen  # not adding delta as resource
                    else:
                        layerGenList = []
                        for layerGen in self.layerServerGens:
                            layerGenList.append(layerGen)
                        if len(layerGenList) > 0:
                            layerGenList = sorted(layerGenList, key=lambda k: k['id'])
                            return layerGenList[0]['serverGen']  # not adding delta as resource

        currentUtcTime = datetime.now(timezone.utc)
        x = self.createPkgDeltas['maxDeltaAge']
        if type(x) is str:
            x = int(x)
        deltaAge = timedelta(days=x)

        # subtract number of days in maxDeltaAge
        currentUtcTime -= deltaAge
        if len(resourceList) == 0 and deltaFileName is not None:
            # return original package gen as next purged unless it is same as last purged in item
            if 'replicaServerGen' in self.item['properties']:
                nextPurgedGen = self.item['properties']['replicaServerGen']
            elif 'layerServerGens' in self.item['properties']:
                # sort it
                layerGenList = []
                for layerGen in self.item['properties']['layerServerGens']:
                    layerGenList.append(layerGen)

                if len(layerGenList) > 0:
                    layerGenList = sorted(layerGenList, key=lambda k: k['id'])
                    nextPurgedGen = layerGenList[0]['serverGen']

        for resource in resourceList:
            # delete if less than lastPurgeGen
            # set nextPurgeGen if < currentUtcTime
            if lastPurgedGen is not None and resource['gen'] <= lastPurgedGen:
                # delete this resource
                try:
                    arcpy.AddMessage(f"{self.serviceName} - Deleting old delta resource from package "
                                     f"item:{self.itemId} name:{resource['name']}")
                    self.DeleteResource(self.itemId, resource['name'], False, self.folderId)
                except Exception as err:
                    arcpy.AddMessage(str(err))  # don't fail
                continue
            if resource['created'] <= floor(currentUtcTime.timestamp()) * 1000:
                if nextPurgedGen is None or resource['gen'] > nextPurgedGen:
                    nextPurgedGen = resource['gen']

        if deltaFileName is not None:
            # create a new resource for delta
            self.AddDeltaAsResource(replicaUrl)

        return nextPurgedGen

    def AddUpdateItem(self):
        replicaUrlWithoutToken = self.replicaUrl
        if self.token is not None:
            replicaUrl = self.replicaUrl + "?token=" + self.token
        else:
            replicaUrl = self.replicaUrl

        properties = {}
        if self.folderId is not None:
            properties['folderId'] = self.folderId

        lastPurgedGen = None

        if self.item is not None:
            # update package or generate new delta and/or merge into package old
            self.isUpdate = True
            self.state = "updated"
            fileName = None
            deltaFileName = None

            if self.useSyncForRefresh:
                # check if there are any changes
                if self.syncResponseHasChanges:
                    # always merge new delta into package first
                    fileName, deltaFileName = self.MergeDeltaIntoPackage(replicaUrl)

                if fileName is None:
                    paramUpdateItem = {
                        'title': self.item['title']
                    }
                    # change state to unchanged
                    arcpy.AddMessage(f"{self.serviceName} - No changes for the package")
                    self.state = "unchanged"
                else:
                    paramUpdateItem = {
                        'file': fileName,
                        'title': self.item['title']
                    }

                if self.createPkgDeltas is not None:
                    # delete old resources and add new resource
                    lastPurgedGen = self.PurgeOldGens(replicaUrl, deltaFileName)

                # for no change case only update item if lastPurgedGen is not None
                if fileName is None and lastPurgedGen is None:
                    return 1
            else:
                # first unregister replica, replicaId in property not object(which is new one)
                arcpy.AddMessage(f"{self.serviceName} - Sync not supported, complete update of package item")
                if 'replicaID' in self.item['properties']:
                    UnRegisterReplicaUrl = self.encodedUrl + "/unRegisterReplica"
                    try:
                        arcpy.AddMessage(f"{self.serviceName} - Unregister old replica for "
                                         f"item:{self.item['properties']['replicaID']}")
                        self.RESTRequestWithRetry(UnRegisterReplicaUrl, {
                            'replicaID': self.item['properties']['replicaID']})
                    except Exception:
                        pass  # ignore this error

                # now get rid of old replicaId in properties
                if self.replicaID is not None:
                    self.item['properties']['replicaID'] = self.replicaID
                paramUpdateItem = {
                    'title': self.item['title']
                }

            # we can pass the url to GW
            # if not delta case
            if 'file' not in paramUpdateItem:
                paramUpdateItem['dataUrl'] = replicaUrl
                paramUpdateItem['fileName'] = 'replica_' + str(uuid.uuid4()).replace('-', '') + ".geodatabase"
                arcpy.AddMessage(f"{self.serviceName} - Updating package Item by URL:{replicaUrlWithoutToken}")
                self.checkItemStatus = True

            if self.layerServerGens is not None:
                self.item['properties']['layerServerGens'] = self.layerServerGens

            if self.replicaServerGen is not None:
                self.item['properties']['replicaServerGen'] = self.replicaServerGen

            if lastPurgedGen is not None:
                self.item['properties']['lastPurgedGen'] = lastPurgedGen

            # replicaId or servergens have changed
            paramUpdateItem["properties"] = json.dumps(self.item["properties"])

            if 'description' in self.item and self.item['description'] is not None:
                paramUpdateItem['description'] = self.item['description']

            if 'snippet' in self.item and self.item['snippet'] is not None:
                paramUpdateItem['snippet'] = self.item['snippet']
            arcpy.AddMessage(f"{self.serviceName} - Updating package item:{self.itemId}")
            self.UpdateItem(self.itemId, paramUpdateItem, properties=properties)
        else:
            # add item
            self.state = "new"
            paramItemProp = {
                'url': self.url,
                'layers': self.layers
            }

            if self.area is not None:
                paramItemProp['area'] = self.area

            if self.extent is not None:
                paramItemProp['extent'] = self.extent

            if self.layerQueries is not None:
                paramItemProp['layerQueries'] = self.layerQueries

            if self.replicaID is not None:
                paramItemProp["replicaID"] = self.replicaID

            if self.layerServerGens is not None:
                paramItemProp["layerServerGens"] = self.layerServerGens

            if self.replicaServerGen is not None:
                paramItemProp["replicaServerGen"] = self.replicaServerGen

            if self.returnAttachments is not None:
                paramItemProp["returnAttachments"] = self.returnAttachments

            if self.attachmentsSyncDirection is not None:
                paramItemProp["attachmentsSyncDirection"] = self.attachmentsSyncDirection

            # paramItemProp["syncDirection"] = self.syncDirection
            paramItemProp["syncModel"] = self.syncModel

            paramItemProp["useSyncForRefresh"] = self.useSyncForRefresh

            paramItemProp["hasUtilityNetworkLayer"] = self.hasUtilityNetworkLayer

            if self.syncDataOptions is not None:
                paramItemProp["syncDataOptions"] = self.syncDataOptions

            if self.createPkgDeltas is not None:
                paramItemProp["createPkgDeltas"] = self.createPkgDeltas

            paramAddItem = {'type': 'SQLite Geodatabase',
                            'typeKeywords': 'SQLite Geodatabase, Replica, Syncable, Bidirectional, MapAreaPackage, '
                                            'Data, Package',
                            'properties': json.dumps(paramItemProp), 'title': self.title, 'dataUrl': replicaUrl,
                            'fileName': 'replica_' + str(uuid.uuid4()).replace('-', '') + ".geodatabase"}
            self.checkItemStatus = True
            # we can pass the url to GW
            arcpy.AddMessage(f"{self.serviceName} - Adding package item by URL:{replicaUrlWithoutToken}")
            if self.itemExtent is not None:
                paramAddItem["extent"] = self.itemExtent

            if self.itemSRName is not None:
                paramAddItem["spatialReference"] = self.itemSRName

            # if self.mapAreaItemId is not None:
            # paramAddItem["originItemId"] = self.mapAreaItemId
            # paramAddItem["relationshipType"] = "Area2Package"

            # add url to type keyword
            paramAddItem['typeKeywords'] += ',ReferenceURL#' + self.url

            try:
                self.itemId = self.AddItem(paramAddItem, properties)
                arcpy.AddMessage(f"{self.serviceName} - Added package item:{self.itemId}")
            except Exception as err:
                raise OfflineException('AddItemFailed', {'error': str(err)})
        return 1

    def DeletePackageItem(self):
        # try:
        super(FeatureServiceTask, self).DeletePackageItem()
        # unregister if delete was successful
        # unregister happens with delete already
        # if 'replicaID' in self.item['properties']:
        # UnRegisterReplicaUrl = self.encodedUrl + "/unRegisterReplica"
        # param = {'replicaID': self.item['properties']['replicaID']}
        # self.RESTRequestWithRetry(UnRegisterReplicaUrl, param)
        # except Exception as e:
        # raise e

    def TryExistingPackage(self):
        # search by itemtype, serviceUrl in typeKeyword , owner
        selfJson = self.GetSelf()
        searchParam = 'type:' + '"SQLite Geodatabase"' + ' owner:' + '"' + selfJson["user"][
            "username"] + '"' + ' typekeywords:' + '"ReferenceURL#' + self.url + '"'
        searchResult = self.PortalSearch({'q': searchParam})
        if searchResult is None:
            return False

        if 'total' in searchResult and searchResult['total'] > 0:
            # found something
            if 'results' not in searchResult:
                return False
            results = searchResult['results']
            for item in results:
                itemInfo = {'item': item}
                existingPackage = FeatureServiceTask(self.hostedgp, None, itemInfo, self.userInfo)
                if self.Compare(existingPackage):
                    # setup relationship with this item
                    try:
                        self.AddRelationShip(self.mapAreaItemId, item['id'], "Area2Package")
                        # setup up other info for return values
                        self.itemId = item['id']
                        return True
                    except Exception:
                        pass
        return False

    def SetupPackageRefreshJob(self, packageRefreshSchedule):
        if self.itemId is not None:
            arcpy.AddMessage(f"{self.serviceName} - Fetching package item to setup refresh "
                             f"job:{self.itemId}")
            serviceItem = self.GetItem(self.itemId)
            # check if it has schedule job
            jobFound = False
            if 'packageRefreshJobId' in serviceItem['properties']:
                # check if schedule has changed, update job.
                # first get the job
                try:
                    arcpy.AddMessage(f"{self.serviceName} - Fetch existing refresh "
                                     f"job:{serviceItem['properties']['packageRefreshJobId']}")
                    job = self.GetScheduledMapAreaJob(serviceItem['properties']['packageRefreshJobId'])
                    jobFound = True
                    if 'cronExpression' not in job or job['cronExpression'] != packageRefreshSchedule:
                        arcpy.AddMessage(f"{self.serviceName} - Refresh schedule changed,updating refresh "
                                         f"job:{job['id']}")
                        self.UpdateScheduledMapAreaJob(job['id'], self.itemId, packageRefreshSchedule)
                except Exception as err:
                    if jobFound:
                        arcpy.AddWarning(str(err))
            if jobFound:
                return
            # schedule a job if not scheduled already
            arcpy.AddMessage(f"{self.serviceName} - Setup new refresh job on package item:{self.itemId}")
            jobId = self.ScheduleMapAreaJob(self.itemId, packageRefreshSchedule)
            serviceItem['properties']['packageRefreshJobId'] = jobId
            paramUpdateItem = {'title': serviceItem['title'], "properties": json.dumps(serviceItem["properties"])}

            if 'description' in serviceItem and serviceItem['description'] is not None:
                paramUpdateItem['description'] = serviceItem['description']

            if 'snippet' in serviceItem and serviceItem['snippet'] is not None:
                paramUpdateItem['snippet'] = serviceItem['snippet']

            properties = {}
            if self.folderId is not None:
                properties['folderId'] = self.folderId
            arcpy.AddMessage(f"{self.serviceName} - Updating package item:{self.itemId} properties with refresh job Id")
            self.UpdateItem(self.itemId, paramUpdateItem, properties)

    def Compare(self, serviceObj):
        # call base
        if not super(FeatureServiceTask, self).Compare(serviceObj):
            return False
        # build the properties based on map properties
        try:
            # first get service def
            self.GetFeatureServiceDef()
            # calculate correct sync data options
            self.CheckServiceDef()
            # setup properties based on map/input etc
            self.SetupMapProperties()
        except Exception:
            # ignore exceptions here
            # they will be handled later when actually building
            pass
        # compare other properties
        # layers, layerQueries,returnAttachments,syncDirection,attachmentsSyncDirection
        if serviceObj.layers != self.layers:
            return False
        if self.layerQueries is not None and serviceObj.layerQueries is not None:
            # if self.layerQueries != serviceObj.layerQueries:
            if not self.CompareDict(self.layerQueries, serviceObj.layerQueries):
                return False
        elif (self.layerQueries is not None and serviceObj.layerQueries is None) or \
                (self.layerQueries is None and serviceObj.layerQueries is not None):
            return False

        if self.returnAttachments != serviceObj.returnAttachments:
            return False

        if self.attachmentsSyncDirection != serviceObj.attachmentsSyncDirection:
            return False

        if self.createPkgDeltas != serviceObj.createPkgDeltas:
            return False
        # don't use useSyncForRefresh property in comparison as it can change later in the process

        if self.hasUtilityNetworkLayer != serviceObj.hasUtilityNetworkLayer:
            return False

        # compare syncDataOptions
        if self.syncDataOptions != serviceObj.syncDataOptions:
            return False

        return True

    def GetFeatureServiceDef(self):
        if self.serviceDef is None:
            self.GetServiceDef()

        if self.serviceDef is None:
            raise OfflineException('URLAccessError', {'url': self.url, 'error': ''})

        if self.serviceDef is not None and self.isEditable is None:
            try:
                if 'capabilities' in self.serviceDef:
                    if 'Editing' in self.serviceDef['capabilities']:
                        self.isEditable = True
                    elif 'Create' in self.serviceDef['capabilities']:
                        self.isEditable = True
                    elif 'Update' in self.serviceDef['capabilities']:
                        self.isEditable = True
                    elif 'Delete' in self.serviceDef['capabilities']:
                        self.isEditable = True
            except Exception as err:
                arcpy.AddMessage('Error checking capabilities for service ' + str(err))
