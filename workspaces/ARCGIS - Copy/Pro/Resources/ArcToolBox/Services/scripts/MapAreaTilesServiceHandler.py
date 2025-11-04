import arcpy
import json
from MapAreaServiceTaskBase import ServiceTaskBase, OfflineException, ServiceNameFromUrl
import time
import uuid
from datetime import datetime, timezone

# service properties * are required ones
# itemId (in case of update)
# serviceItemId*
# title*
# url*
# levels*
# folderId

# errors
# export tile error
# general error


class TilesServiceTask(ServiceTaskBase):
    def __init__(self, hostedgp, serviceprop, itemInfo, userInfo):

        self.jobUrl = ""
        self.maxSteps = 4.0
        self.tileUrl = ""
        self.item = None
        self.levels = None
        self.compressionQuality = -1
        self.conn = None
        self.is107AndHigher = False
        self.extractJobTimeTracker = None
        self.itemStatusTimeTracker = None
        area = None
        extent = None

        if itemInfo is not None:
            item = itemInfo['item']

            if 'properties' not in item or item['properties'] is None:
                raise OfflineException('ItemPropMissing',
                                       {'itemId': item['id'], 'properties': 'url,levels,extent,area'})

            itemProps = item['properties']

            if 'url' not in itemProps:
                raise OfflineException('ItemPropMissing', {'itemId': item['id'], 'properties': 'url'})
            if 'levels' not in itemProps:
                raise OfflineException('ItemPropMissing', {'itemId': item['id'], 'properties': 'levels'})

            if 'area' in item['properties']:
                area = item['properties']['area']

            if 'extent' in item['properties']:
                extent = item['properties']['extent']

            if extent is None:
                raise OfflineException('ItemPropMissing', {'itemId': item['id'], 'properties': 'extent'})

            super(TilesServiceTask, self).__init__(hostedgp, itemProps['url'], extent, area, userInfo)

            self.item = item

            if 'token' in itemInfo:
                self.token = itemInfo['token']

            if 'referer' in itemInfo:
                self.referer = itemInfo['referer']

            if 'ownerFolder' in item:
                self.folderId = item['ownerFolder']

            self.levels = itemProps['levels']
            self.itemId = item['id']

            if 'compressionQuality' in itemProps:
                self.compressionQuality = itemProps['compressionQuality']

        else:
            # verify properties
            if 'url' not in serviceprop:
                raise OfflineException('MissingProperty', {'name': 'url'})

            # if 'levels' not in serviceprop:
            # raise OfflineException('MissingProperty',{'name' : 'levels'})

            if 'area' in serviceprop:
                area = serviceprop['area']

            if 'extent' in serviceprop:
                extent = serviceprop['extent']

            if extent is None:
                raise OfflineException('MissingProperty', {'name': 'extent'})

            if "title" not in serviceprop:
                raise OfflineException('MissingProperty', {'name': 'title'})

            if 'mapAreaItemId' not in serviceprop:
                raise OfflineException('MissingProperty', {'name': 'mapAreaItemId'})

            super(TilesServiceTask, self).__init__(hostedgp, serviceprop['url'], extent, area, userInfo)

            self.mapAreaItemId = serviceprop['mapAreaItemId']

            if 'levels' in serviceprop:
                self.levels = serviceprop['levels']

            self.title = serviceprop['title']

            if 'folderId' in serviceprop:
                self.folderId = serviceprop['folderId']

            if 'compressionQuality' in serviceprop:
                self.compressionQuality = serviceprop['compressionQuality']

            # if 'usePackageSharing' in serviceprop:
            # self.usePackageSharing = serviceprop['usePackageSharing']

            if 'mapAreaItemSharing' in serviceprop:
                self.mapAreaItemSharing = serviceprop['mapAreaItemSharing']

            if 'token' in serviceprop:
                self.token = serviceprop['token']

            if 'referer' in serviceprop:
                self.referer = serviceprop['referer']

        self.exportTileUrl = self.encodedUrl  # initialize with same could change later

        if self.url.rfind('/MapServer') > 0:
            self.type = "MapServer"
        elif self.url.rfind('/ImageServer') > 0:
            self.type = "ImageServer"

        self.serviceName = ServiceNameFromUrl(self.url, self.type)

    # for task functions 0 repeat, 1 continue, -1 error
    # 0 - done, 1 continue -1 error
    def ProcessTask(self):
        try:
            if self.step == -1:
                return -1

            if self.step >= 4:
                return 0

            if self.step == 3:
                # check item status
                if self.itemStatusTimeTracker is not None:
                    currentTime = datetime.now(timezone.utc)
                    timeDiff = currentTime - self.itemStatusTimeTracker
                    if timeDiff.seconds > 5 * 60:
                        self.itemStatusTimeTracker = currentTime
                        arcpy.AddMessage(f"{self.serviceName} - Over 5min wait checking status for package item:"
                                         f"{self.itemId}")
                props = {}
                if self.folderId is not None:
                    props['folderId'] = self.folderId

                if self.CheckItemStatus(self.itemId, props) == 1:
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
                # check tile job status
                if self.CheckTileJob() == 1:
                    # add/update item
                    arcpy.AddMessage(f"{self.serviceName} - Add/Update package item")
                    self.AddUpdateItem()
                    self.step = 3
                    self.itemStatusTimeTracker = datetime.now(timezone.utc)
                    arcpy.AddMessage(f"{self.serviceName} - Checking status for package item:{self.itemId}")

            if self.step == 1:
                # get the token
                # not checking for package sharing
                # if self.usePackageSharing:
                # if found, create relationship
                # move to step 4
                # if self.TryExistingPackage():
                # self.isShared = True
                # self.step = 4
                # return 1

                self.HandleItemExtent()
                # change exportTileUrl
                arcpy.AddMessage(f"{self.serviceName} - Check if export URL is different from service URL.")
                toolUrl = self.GetExportTileUrl()

                if toolUrl is not None:
                    # export url is different from original url
                    # need to use a different connection object
                    arcpy.AddMessage(f"{self.serviceName} - Export URL is different from service URL:{toolUrl}")
                    self.conn = ServiceTaskBase(self.hostedgp, toolUrl, self.extent, self.area, self.userInfo)
                    self.exportTileUrl = self.conn.encodedUrl

                    if self.token is not None:
                        self.conn.token = self.token  # user provide token
                    if self.referer is not None:
                        self.conn.referer = self.referer

                if self.levels is None or self.area is not None:
                    # need def to determine the version
                    if self.conn is not None:
                        self.conn.GetServiceDef()
                        if self.conn.serviceDef is None:
                            raise OfflineException('URLAccessError', {'url': self.conn.url, 'error': ''})
                        serviceDef = self.conn.serviceDef
                    else:
                        self.GetServiceDef()
                        if self.serviceDef is None:
                            raise OfflineException('URLAccessError', {'url': self.url, 'error': ''})
                        serviceDef = self.serviceDef

                    if 'currentVersion' in serviceDef:
                        if serviceDef['currentVersion'] >= 10.7:
                            self.is107AndHigher = True

                    # compute default level
                    if self.levels is None:
                        arcpy.AddMessage(f"{self.serviceName} - Calculate default level")
                        self.levels = self.hostedgp.EstimateExportTileLevels(serviceDef, {'extent': self.extent,
                                                                                          'type': self.type})
                        arcpy.AddMessage(f"{self.serviceName} - Calculated levels:{self.levels}")
                    # , 'maxTileCount' : 10000})

                # submit the job
                self.SubmitCreateTileJob()
                self.step = 2

            return 1
        except Exception as err:
            self.error = str(err)
        return -1

    def SubmitCreateTileJob(self):
        self.lastFunction = "SubmitCreateTileJob"
        levels = self.levels
        submitUrl = self.exportTileUrl + "/exportTiles"
        params = {
            "exportBy": "LevelID",
            "levels": levels,
            "tilePackage": True
        }

        if self.compressionQuality >= 0:
            # explicitly passed in parameter
            params["compressionQuality"] = self.compressionQuality
            params["optimizeTilesForSize"] = True

        self.HandleAreaByRef()

        if self.areaValue is not None and self.is107AndHigher and 'polygon' in self.areaValue:
            params['polygon'] = json.dumps(self.areaValue['polygon'], ensure_ascii=False)
        elif self.extent is not None:
            if self.areaValue is not None and 'polygon' in self.areaValue:
                # we are using extent as service does not support polygon
                arcpy.AddMessage(f"{self.serviceName} - Does not support polygon for export. Using extent.")
            params["exportExtent"] = json.dumps(self.extent, ensure_ascii=False)

        retryCount = 5
        sleepTime = 5  # 5 sec
        while retryCount > 0:
            try:
                arcpy.AddMessage(f"{self.serviceName} - Submitting export tile job:{submitUrl.split('token=', 1)[0]}")
                if self.conn is not None:
                    job = self._handleError(self.conn.RESTRequestWithRetry(submitUrl, params), ['jobId'])
                else:
                    job = self._handleError(self.RESTRequestWithRetry(submitUrl, params), ['jobId'])

                self.extractJobTimeTracker = datetime.now(timezone.utc)
            except Exception as err:
                if retryCount > 1:
                    retryCount = retryCount - 1
                    time.sleep(sleepTime)
                    continue
                raise OfflineException('ExportTileError', {'url': submitUrl, 'error': str(err)})

            if "jobId" in job:
                self.jobUrl = self.exportTileUrl + "/exportTiles/jobs/" + job["jobId"]
                arcpy.AddMessage(f"{self.serviceName} - Job url:{self.jobUrl.split('token=', 1)[0]}")
                return 1
            else:
                if retryCount > 1:
                    retryCount = retryCount - 1
                    time.sleep(sleepTime)
                    continue
                raise OfflineException('ExportTileError',
                                       {'url': submitUrl, 'error': json.dumps(job, ensure_ascii=False)})

    def CheckTileJob(self):
        self.lastFunction = "CheckTileJob"
        retryCount = 10
        sleepTime = 5
        while retryCount > 0:
            try:
                if self.conn is not None:
                    jobInfo = self._handleError(self.conn.RESTRequestWithRetry(self.jobUrl, None), ['jobStatus'])
                else:
                    jobInfo = self._handleError(self.RESTRequestWithRetry(self.jobUrl, None), ['jobStatus'])
            except Exception as err:
                if retryCount > 1:
                    retryCount = retryCount - 1
                    time.sleep(sleepTime)
                    continue
                raise OfflineException('ExportTileError', {'url': self.jobUrl, 'error': str(err)})

            if "jobStatus" not in jobInfo:
                if retryCount > 1:
                    retryCount = retryCount - 1
                    time.sleep(sleepTime)
                    continue
                raise OfflineException('ExportTileError',
                                       {'url': self.jobUrl, 'error': json.dumps(jobInfo, ensure_ascii=False)})
            retryCount = 0  # we have response from job
            jobStatus = jobInfo["jobStatus"]
            if jobStatus == 'esriJobFailed':
                # get error message , ags or agol
                if 'error' in jobInfo:
                    raise OfflineException('ExportTileError',
                                           {
                                                'url': self.jobUrl,
                                                'error': json.dumps(jobInfo['error'], ensure_ascii=False)}
                                           )
                if 'messages' in jobInfo:
                    # gp job get error message type
                    for message in jobInfo['messages']:
                        if 'type' in message and message['type'] == 'esriJobMessageTypeError':
                            raise OfflineException('ExportTileError',
                                                   {'url': self.jobUrl,
                                                    'error': message['description']})

                raise OfflineException('ExportTileError', {'url': self.jobUrl,
                                                           'error': json.dumps(jobInfo, ensure_ascii=False)})
            # get the item url
            # first make a self call
            if jobStatus == 'esriJobSucceeded':
                # AGOL tile services
                if "output" in jobInfo:
                    if "outputUrl" in jobInfo["output"]:
                        self.tileUrl = jobInfo["output"]["outputUrl"][0]
                        return 1
                # AGS tile service
                elif "results" in jobInfo:
                    if "out_service_url" in jobInfo["results"]:
                        resultUrl = self.jobUrl + "/results/out_service_url"
                        outServiceRetryCount = 5
                        while outServiceRetryCount > 0:
                            try:
                                if self.conn is not None:
                                    resultInfo = self._handleError(self.conn.RESTRequestWithRetry(resultUrl, None),
                                                                   ['value'])
                                else:
                                    resultInfo = self._handleError(self.RESTRequestWithRetry(resultUrl, None),
                                                                   ['value'])
                            except Exception as err:
                                if outServiceRetryCount > 1:
                                    outServiceRetryCount = outServiceRetryCount - 1
                                    time.sleep(sleepTime)
                                    continue
                                raise OfflineException('ExportTileError', {'url': resultUrl, 'error': str(err)})

                            if "value" in resultInfo:
                                # we are getting path to folder here
                                # iterate over the files and get the
                                # first one with .tpk
                                outServiceRetryCount = 0  # we have service response
                                retryCountForFile = 5  # for next request

                                while retryCountForFile > 0:
                                    try:
                                        if self.conn is not None:
                                            dirjson = self._handleError(self.conn.RESTRequestWithRetry(
                                                self.EncodeUrl(resultInfo["value"]), None), ['files'])
                                        else:
                                            dirjson = self._handleError(
                                                self.RESTRequestWithRetry(self.EncodeUrl(resultInfo["value"]),
                                                                          None), ['files'])
                                    except Exception as err:
                                        if retryCountForFile > 1:
                                            retryCountForFile = retryCountForFile - 1
                                            time.sleep(sleepTime)
                                            continue
                                        raise OfflineException('ExportTileError',
                                                               {'url': resultInfo["value"], 'error': str(err)})

                                    if "files" in dirjson:
                                        for file in dirjson["files"]:
                                            if "name" in file and "url" in file:
                                                if file["name"].find(".tpk") > 0:
                                                    self.tileUrl = file["url"]
                                                    if self.conn is not None:
                                                        if self.conn.token is not None:
                                                            self.tileUrl = self.tileUrl + "?token=" + self.conn.token
                                                    elif self.token is not None:
                                                        self.tileUrl = self.tileUrl + "?token=" + self.token
                                                    break
                                        if len(self.tileUrl) > 0:
                                            return 1

                                    if retryCountForFile > 1:
                                        retryCountForFile = retryCountForFile - 1
                                        time.sleep(sleepTime)
                                        continue
                                    else:
                                        raise OfflineException('ExportTileError',
                                                               {'url': resultInfo["value"],
                                                                'error': json.dumps(dirjson,
                                                                                    ensure_ascii=False)})

                            if outServiceRetryCount > 1:
                                outServiceRetryCount = outServiceRetryCount - 1
                                time.sleep(sleepTime)
                                continue
                            else:
                                raise OfflineException('ExportTileError',
                                                       {'url': resultInfo["value"], 'error': json.dumps(resultInfo,
                                                        ensure_ascii=False)})
                else:
                    raise OfflineException('ExportTileError', {'url': self.jobUrl,
                                                               'error': json.dumps(jobInfo, ensure_ascii=False)})

            if self.extractJobTimeTracker is not None:
                currentTime = datetime.now(timezone.utc)
                timeDiff = currentTime - self.extractJobTimeTracker
                if timeDiff.seconds > 5 * 60:
                    self.extractJobTimeTracker = currentTime
                    arcpy.AddMessage(f"{self.serviceName} - Over 5 min wait on export tile job, response:"
                                     f"{json.dumps(jobInfo)}")
        return 0  # job not complete

    def AddUpdateItem(self):
        self.lastFunction = "AddUpdateItem"
        properties = {}

        if self.folderId is not None:
            properties["folderId"] = self.folderId

        arcpy.AddMessage(f"{self.serviceName} - Tile package url:{self.tileUrl.split('?', 1)[0]}")

        if self.item is not None:
            self.isUpdate = True
            self.state = "updated"
            self.itemId = self.item['id']
            # update existing item
            paramUpdateItem = {
                'dataUrl': self.tileUrl,
                'properties': json.dumps(self.item['properties']),
                'title': self.item['title'],
                'fileName': 'tile_' + str(uuid.uuid4()).replace('-', '') + ".tpk",
                'typeKeywords': self.item['typeKeywords']
            }
            if 'description' in self.item and self.item['description'] is not None:
                paramUpdateItem['description'] = self.item['description']

            # if 'tags' in self.item and self.item['tags'] is not None:
            # paramUpdateItem['tags'] = self.item['tags']

            if 'snippet' in self.item and self.item['snippet'] is not None:
                paramUpdateItem['snippet'] = self.item['snippet']
            # properties contain url,level
            # for update only set level.

            try:
                arcpy.AddMessage(f"{self.serviceName} - Updating package item by URL:{self.itemId}")
                self.UpdateItem(self.itemId, paramUpdateItem, properties=properties)
            except Exception as err:
                raise OfflineException('UpdateItemFailed', {'itemId': self.itemId, 'error': str(err)})
        else:
            # item properties
            # ReferenceName#<name> , ReferenceItem#<itemId> , ReferenceURL#<uuencoded url>
            self.state = "new"
            paramItemProp = {
                # 'ReferenceName' : self.serviceprop["refName"]
                # ,'ReferenceItem' : self.serviceprop["serviceItemId"]
                'url': self.url,
                'levels': self.levels,
                'compressionQuality': self.compressionQuality
            }

            if self.area is not None:
                paramItemProp['area'] = self.area
            if self.extent is not None:
                paramItemProp['extent'] = self.extent

            # add new item
            paramAddItem = {
                'dataUrl': self.tileUrl,
                'title': self.title,
                'type': 'Tile Package',
                'typeKeywords': "ArcGlobe, ArcMap, Data, Tile Package, tpk, MapAreaPackage, Package",
                'properties': json.dumps(paramItemProp),
                'fileName': 'tile_' + str(uuid.uuid4()).replace('-', '') + ".tpk"
            }

            if self.itemExtent is not None:
                paramAddItem["extent"] = self.itemExtent

            if self.itemSRName is not None:
                paramAddItem["spatialReference"] = self.itemSRName
            # we do relationships later
            # if self.mapAreaItemId is not None:
            # paramAddItem["originItemId"] = self.mapAreaItemId
            # paramAddItem["relationshipType"] = "Area2Package"
            # add url as type keyword
            paramAddItem['typeKeywords'] += ',ReferenceURL#' + self.url
            try:
                self.itemId = self.AddItem(paramAddItem, properties)
                arcpy.AddMessage(f"{self.serviceName} - Added package item by URL:{self.itemId}")
            except Exception as err:
                raise OfflineException('AddItemFailed', {'error': str(err)})

        return 1

    def TryExistingPackage(self):
        # search by itemtype, serviceUrl in typeKeyword , owner
        selfJson = self.GetSelf()
        searchParam = 'type:' + '"Tile Package"' + ' owner:' + '"' + selfJson["user"][
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
                existingPackage = TilesServiceTask(self.hostedgp, None, itemInfo, self.userInfo)
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
        pass

    def Compare(self, serviceObj):
        if not super(TilesServiceTask, self).Compare(serviceObj):
            return False
        # compare levels only when both have it
        # cannot compare with default level that I compute
        # only when user provides level, we can compare
        if self.levels is not None and serviceObj.levels is not None:
            if self.levels != serviceObj.levels:
                return False
        # compression quality
        if self.compressionQuality is not None and serviceObj.compressionQuality is not None:
            if self.compressionQuality != serviceObj.compressionQuality:
                return False
        elif (self.compressionQuality is not None and serviceObj.compressionQuality is None) or \
                (self.compressionQuality is None and serviceObj.compressionQuality is not None):
            return False
        return True
