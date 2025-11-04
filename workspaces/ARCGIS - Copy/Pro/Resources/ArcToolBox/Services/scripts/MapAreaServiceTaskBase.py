from urllib.parse import urlencode, urlparse, quote, urlunparse
from urllib.request import Request, urlopen
import ssl
import requests
import json
import arcpy
from hostedgp import GPCloudExec
import codecs
from os.path import getsize, basename
import shutil
from uuid import uuid4

errorMap = {
    'ItemAccessError': {'msg': 'Error accessing item {itemId}', 'code': 1},  # itemId
    'ItemTypeError': {'msg': 'Invalid item {itemId} type {type}', 'code': 2},  # itemId , type
    'ItemPropMissing': {'msg': 'Item {itemId} missing properties {properties}', 'code': 3},  # itemId, properties
    'ItemStatusError': {'msg': 'Failed to get status for item {itemId} error {error}', 'code': 4},  # itemId
    'ItemUploadError': {'msg': 'Failed to upload item {itemId} data error {error}', 'code': 5},  # itemId error
    'GetItemFailed': {'msg': 'Failed to get item {itemId} error {error}', 'code': 6},  # itemId error
    'AddItemFailed': {'msg': 'Failed to add item error: {error}', 'code': 7},  # error
    'SearchFailed': {'msg': 'Portal search failed error : {error}', 'code': 8},  # error
    'DeleteItemFailed': {'msg': 'Failed to delete item {itemId}, error: {error}', 'code': 9},  # itemId error
    'AddRelationFailed': {'msg': 'Failed to add relationship source {source} , destination {destination} error {error}',
                          'code': 10},  # source, destination, error
    'GetResourceAsFileFailed': {'msg': 'Failed to get resource {resourceKey} , itemId {itemId} error {error}',
                                'code': 11},  # resourceKey itemId error
    'AddResourceFailed': {'msg': 'Failed to add resource {resourceKey}, ItemId {itemId} error {error}', 'code': 12},
    # resourceKey itemId error
    'GetResourcesFailed': {'msg': 'Failed to get resources for Item {itemId} error {error}', 'code': 13},
    # itemId error
    'DeleteResourceFailed': {'msg': 'Failed to delete resource {resourceKey}, ItemId {itemId} error {error}',
                             'code': 14},  # resourceKey itemId error
    'GetItemAsFileFailed': {'msg': 'Failed to get item data {itemId} error {error}', 'code': 15},  # itemId error
    'DeleteRelationFailed': {
        'msg': 'Failed to delete relationship source {source}, destination {destination} error {error}', 'code': 16},
    # source destination error
    'ShareItemFailed': {'msg': 'Failed to share item {itemId} error {error}', 'code': 17},  # itemId error
    'UpdateItemFailed': {'msg': 'Failed to update item {itemId} error {error}', 'code': 18},  # itemId error
    'MapAreaMissingMap': {'msg': 'Map area item {itemId} missing related map', 'code': 19},  # itemId
    'MapMissingData': {'msg': 'Map item {itemId} missing data', 'code': 20},  # itemId
    'BookmarkMissing': {'msg': 'Map item {itemId} missing bookmark {bookmark}', 'code': 21},  # itemId bookmark
    'MissingProperty': {'msg': 'Missing required property {name}', 'code': 22},  # name
    'SyncNotEnabled': {'msg': 'Sync not enabled on service {name}', 'code': 23},  # name
    'InvalidParam': {'msg': 'Parameter {name} is invalid or exceeded limit.', 'code': 24},  # name
    'ExceedingMapAreas': {'msg': 'Exceeding number of map areas allowed per map. Limit={limit}', 'code': 25}, # limit
    'AreaMissing': {'msg': 'Parameter Area and/or AreaType not specified.', 'code': 26},
    'MapAreaExists': {'msg': 'Map area for the bookmark/extent/area already exists {itemId}.', 'code': 27},
    # bookmark itemId
    'SRError': {'msg': 'Failed to project extent {extent} to wgs 84', 'code': 28},  # extent
    'GetPackagesFailed': {'msg': 'Failed to get packages for Map area item {itemId}', 'code': 29},  # itemId
    'URLAccessError': {'msg': 'Accessing url {url} returned error {error}', 'code': 30},  # url, error
    'GenerateTokenError': {'msg': 'Failed to generate server token for {url} error {error}', 'code': 31},  # url, error
    'ReplicaJobError': {'msg': 'Replica job {url} encountered error {error}', 'code': 32},  # url ,error
    'CreateReplicaError': {'msg': 'Create replica operation {url} failed error {error}', 'code': 33},  # url, error
    'SyncReplicaError': {'msg': 'Sync replica operation on {url} for {replicaId} failed with error {error}',
                         'code': 34},  # url, replicaId, error
    'ExportTileError': {'msg': 'Export tile operation {url} failed error {error}', 'code': 35},  # url ,error
    'FailedToDownloadPkg': {'msg': 'Failed to download package from server {url} , error {error}', 'code': 36},
    # url, error
    'CreatePkgDeltaServerNotSup': {'msg': 'Service {url} does not support delta creation', 'code': 37},  # url
    'PortalSelfError': {'msg': 'Failed to get portal self error {error}', 'code': 38},  # error
    'ScheduleMapAreaJobFailed': {'msg': 'Failed to schedule Map area package refresh job for {itemId} error {error}',
                                 'code': 39},  # itemId, error
    'GetScheduledMapAreaJobFailed': {'msg':
                                     'Failed to get scheduled Map area package refresh job {jobId} error {error}',
                                     'code': 40},  # jobId, error
    'UpdateScheduledMapAreaJobFailed': {'msg':
                                        'Failed to updated Map area package refresh job {jobId} error {error}',
                                        'code': 41},
    'InvalidArea': {'msg': 'Area by reference is invalid', 'code': 42}
}


def ProcessExtent(extent):
    # input is dictionary
    retExtent = None
    if extent is not None and "spatialReference" in extent:
        if "xmin" in extent \
                and "xmax" in extent and "ymin" in extent \
                and "ymax" in extent:
            retExtent = extent
    return retExtent


def ProcessPolygon(poly):
    # input is dictionary
    # return envelope and area from polygon(only if input is polygon)
    retArea = None
    retExtent = None
    # verify if it is polygon
    if poly is not None:
        polygon = arcpy.AsShape(poly, True)
        if polygon is not None and polygon.type == "polygon":
            retExtent = json.loads(polygon.extent.JSON)
            retArea = {'polygon': poly}

    return retExtent, retArea


def UrlForCompare(url):
    x = url.lower()
    x = x.replace("https://", "")
    x = x.replace("http://", "")
    return x


def ServiceNameFromUrl(url, svcType):
    x = url.lower()
    typePos = x.rfind("/" + svcType.lower())
    if typePos > 0:
        temp = url[:typePos]
        pos2 = temp.rfind('/')
        return url[pos2 + 1:typePos + len(svcType) + 1]
    return None


class OfflineException(Exception):
    def __init__(self, code, values):
        if code not in errorMap:
            raise Exception('Invalid error code {0}'.format(*[code[0]]))
        self.code = code
        self.values = values

    def __str__(self):
        return json.dumps(
            {'code': errorMap[self.code]['code'], 'messageCode': 'OffPkg_{0:3d}'.format(errorMap[self.code]['code']),
             'message': errorMap[self.code]['msg'].format(**self.values), 'params': self.values})


class RESTHandler(object):
    def __init__(self, hgp, userInfo):
        self.hostedgp = hgp
        self.timeout = 300
        self.portalUrl = None
        self.privatePortalUrl = None
        self.reader = codecs.getreader("utf-8")
        self.userInfo = userInfo  # for portal and service if token is not provided
        self.portalSelf = None
        self.IsAGOL = None
        self.ignoreCertServers = []
        self.ignoreCertContext = ssl.create_default_context()
        self.ignoreCertContext.check_hostname = False
        self.ignoreCertContext.verify_mode = ssl.CERT_NONE

    def _handleError(self, resp, propsToCheck):
        if resp is None:
            raise Exception('No Response')
        for prop in propsToCheck:
            if prop not in resp or (prop == 'success' and not resp[prop]):
                # check for error
                if 'error' in resp:
                    if 'message' in resp['error'] and len(resp['error']['message']) > 0:
                        msg = resp['error']['message']
                        # check for detail dump whole if so
                        if 'details' in resp['error']:
                            msg = json.dumps(resp['error'])
                        raise Exception(msg)
                    else:
                        raise Exception(json.dumps(resp['error']))
                else:
                    raise Exception(json.dumps(resp))

        return resp

    def _IsOnline(self):
        if self.IsAGOL is None:
            x = self.GetOwningSystem()
            x = UrlForCompare(x.lower())
            if x.find('www.arcgis.com') >= 0 or x.find('devext.arcgis.com') >= 0 or x.find('qaext.arcgis.com') >= 0:
                self.IsAGOL = True
            else:
                self.IsAGOL = False
        return self.IsAGOL

    def _addToIgnoreCertServers(self, surl):
        if surl is None or len(surl) == 0:
            return

        tparse = urlparse(surl)
        if tparse is not None:
            if tparse.netloc is not None and len(tparse.netloc) > 0:
                entry = tparse.netloc
                if tparse.path is not None and len(tparse.path) > 0:
                    # take the first non empty one
                    paths = tparse.path.split('/', 3)
                    if paths is not None:
                        for y in paths:
                            if len(y) > 0:
                                entry += "/" + y
                                break

                if entry not in self.ignoreCertServers:
                    self.ignoreCertServers.append(entry)

    def _myUrlOpen(self, *args, **kwargs):
        if args is not None and len(args) > 0:
            # first one is url or request
            if type(args[0]) is str:
                if any(x in args[0] for x in self.ignoreCertServers):
                    return urlopen(*args, **kwargs, context=self.ignoreCertContext)
            else:
                if any(x in args[0].get_full_url() for x in self.ignoreCertServers):
                    return urlopen(*args, **kwargs, context=self.ignoreCertContext)

        # opening with ssl check
        return urlopen(*args, **kwargs)

    def GetOwningSystem(self):
        if self.portalUrl is None or len(self.portalUrl) == 0:
            owningSystem = self.hostedgp.GetOwningSystem()
            self.portalUrl = owningSystem.rstrip('/ ')
        return self.portalUrl

    def _GetPrivateOwningSystem(self):
        if self.privatePortalUrl is None or len(self.privatePortalUrl) == 0:
            owningSystem = self.hostedgp.GetPrivateOwningSystem()
            self.privatePortalUrl = quote(owningSystem.rstrip('/'), "/:")
            if not self._IsOnline():
                # add it to ignore cert server list
                self._addToIgnoreCertServers(self.privatePortalUrl)

        return self.privatePortalUrl

    def GetSelf(self):
        # either from hostedgp or userInfo provided
        if self.portalSelf is not None:
            return self.portalSelf

        if self.userInfo is None:
            try:
                self.portalSelf = json.loads(self.hostedgp.GetSelf())
                return self.portalSelf
            except Exception as err:
                raise OfflineException('PortalSelfError', {'error': str(err)})
        else:
            # make a rest call to portal self
            selfUrl = self._GetPrivateOwningSystem() + '/sharing/rest/portals/self'
            try:
                self.portalSelf = self._handleError(self.MakeUserInfoPortalRequest(selfUrl, None), ['user'])
            except Exception as err:
                raise OfflineException('PortalSelfError', {'error': str(err)})
            return self.portalSelf

    def GenerateToken(self, url, timeout=None):
        try:
            if timeout is None:
                return self.hostedgp.GetServerToken(url, self.timeout)
            else:
                return self.hostedgp.GetServerToken(url, timeout)
        except Exception as e:
            raise OfflineException('GenerateTokenError', {'url': url, 'error': str(e)})

    def CheckItemStatus(self, itemId, properties):
        statusException = None
        status = None
        if self.userInfo is not None:
            statusUrl = self._GetPrivateOwningSystem() + '/sharing/rest/content/users/' + self.GetSelf()['user'][
                'username']
            if properties is not None and 'folderId' in properties:
                statusUrl += '/' + properties['folderId']
            statusUrl += '/items/' + itemId + '/status'
            try:
                status = self._handleError(self.MakeUserInfoPortalRequest(statusUrl, None), ['status'])
            except Exception as err:
                statusException = err
        else:
            try:
                status = self._handleError(self.hostedgp.GetItemStatus(itemId, properties), ['status'])
            except GPCloudExec as errorGp:
                statusException = OfflineException('ItemStatusError', {'itemId': itemId, 'error': errorGp.errmsg})
            except Exception as err:
                statusException = OfflineException('ItemStatusError', {'itemId': itemId, 'error': str(err)})

        if statusException is None:
            if status is not None:
                if "status" in status:
                    if status["status"] == 'completed':
                        return 1
                    elif status["status"] == 'processing':
                        return 0
                    elif len(status["status"]) > 0:  # status["status"] == 'failed' or 'partial':
                        if "statusMessage" in status:
                            errorMsg = status['statusMessage']
                        else:
                            errorMsg = json.dumps(status, ensure_ascii=False)
                else:
                    errorMsg = json.dumps(status, ensure_ascii=False)
                statusException = OfflineException('ItemStatusError', {'itemId': itemId, 'error': errorMsg})
            else:
                # GW returning weird response
                statusException = OfflineException('ItemStatusError', {'itemId': itemId, 'error': "Call failed"})
        raise statusException

    def ShareItem(self, itemId, isSharedWithEveryone, isSharedWithOrg, Groups, properties):
        param = {'everyone': isSharedWithEveryone, 'org': isSharedWithOrg}
        if Groups is not None and len(Groups) > 0:
            # make it comma separated
            param['groups'] = ",".join(Groups)

        if self.userInfo is not None:
            shareUrl = self._GetPrivateOwningSystem() + "/sharing/rest/content/users/" + self.GetSelf()['user'][
                'username']
            if properties is not None and 'folderId' in properties:
                shareUrl += '/' + properties['folderId']

            shareUrl += '/items/' + itemId + '/share'
            try:
                self._handleError(self.MakeUserInfoPortalRequest(shareUrl, param), [])
            except Exception as err:
                raise OfflineException('ShareItemFailed', {'itemId': itemId, 'error': str(err)})
        else:
            # using hosted gp
            selfJson = self.GetSelf()
            shareUrl = "content/users/" + selfJson["user"]["username"]
            if properties is not None and 'folderId' in properties:
                shareUrl += '/' + properties['folderId']

            shareUrl += '/items/' + itemId + '/share'
            try:
                self._handleError(self.hostedgp.GenericSharingRequest(shareUrl, param), [])
            except GPCloudExec as errorGp:
                raise OfflineException('ShareItemFailed', {'itemId': itemId, 'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('ShareItemFailed', {'itemId': itemId, 'error': str(err)})

    def GetItem(self, itemId):
        if self.userInfo is not None:
            try:
                portalUrl = self._GetPrivateOwningSystem()
                itemUrl = portalUrl + '/sharing/rest/content/items/' + itemId
                return self._handleError(self.MakeUserInfoPortalRequest(itemUrl, None), ['name'])
            except Exception as err:
                raise OfflineException('GetItemFailed', {'itemId': itemId, 'error': str(err)})
        else:
            try:
                return self.hostedgp.GetItem(itemId)
            except GPCloudExec as errorGp:
                raise OfflineException('GetItemFailed', {'itemId': itemId, 'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('GetItemFailed', {'itemId': itemId, 'error': str(err)})

    def AddItem(self, param, properties):
        if self.userInfo is not None:
            try:
                return self.AddUpdateItemHelper(None, param, properties)
            except Exception as err:
                raise OfflineException('AddItemFailed', {'error': str(err)})
        else:
            try:
                return self.hostedgp.AddItem(param, properties)
            except GPCloudExec as errorGp:
                raise OfflineException('AddItemFailed', {'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('AddItemFailed', {'error': str(err)})

    def UpdateItem(self, itemId, param, properties):
        if self.userInfo is not None:
            try:
                self.AddUpdateItemHelper(itemId, param, properties)
            except Exception as err:
                raise OfflineException('UpdateItemFailed', {'itemId': itemId, 'error': str(err)})
        else:
            try:
                self.hostedgp.UpdateItem(itemId, param, properties)
            except GPCloudExec as errorGp:
                raise OfflineException('UpdateItemFailed', {'itemId': itemId, 'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('UpdateItemFailed', {'itemId': itemId, 'error': str(err)})

    def DeleteItem(self, itemId, properties):
        if self.userInfo is not None:
            delUrl = self._GetPrivateOwningSystem() + '/sharing/rest/content/users/' + self.GetSelf()['user'][
                'username']
            if properties is not None and 'folderId' in properties:
                delUrl += '/' + properties['folderId']
            delUrl += '/items/' + itemId + '/delete'
            try:
                self._handleError(self.MakeUserInfoPortalRequest(delUrl, None), ['success', 'itemId'])
            except Exception as err:
                raise OfflineException('DeleteItemFailed', {'itemId': itemId, 'error': str(err)})
            # ignore response
        else:
            try:
                self._handleError(self.hostedgp.DeleteItem(itemId, properties), ['success', 'itemId'])
            except GPCloudExec as errorGp:
                raise OfflineException('DeleteItemFailed', {'itemId': itemId, 'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('DeleteItemFailed', {'itemId': itemId, 'error': str(err)})

    def AddRelationShip(self, sourceItemId, destinationItemId, relationshipType):
        param = {
            'originItemId': sourceItemId,
            'destinationItemId': destinationItemId,
            'relationshipType': relationshipType
        }
        if self.userInfo is not None:
            usercontentUrl = self._GetPrivateOwningSystem() + "/sharing/rest/content/users/" + self.GetSelf()['user'][
                'username'] + '/addRelationship'
            try:
                self._handleError(self.MakeUserInfoPortalRequest(usercontentUrl, param), ['success'])
            except Exception as err:
                raise OfflineException('AddRelationFailed',
                                       {'source': sourceItemId, 'destination': destinationItemId, 'error': str(err)})
        else:
            # using hosted gp
            try:
                selfJson = self.GetSelf()
                usercontentUrl = "content/users/" + selfJson["user"]["username"] + '/addRelationship'
                self._handleError(self.hostedgp.GenericSharingRequest(usercontentUrl, param), ['success'])
            except GPCloudExec as errorGp:
                raise OfflineException('AddRelationFailed',
                                       {'source': sourceItemId, 'destination': destinationItemId,
                                        'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('AddRelationFailed',
                                       {'source': sourceItemId, 'destination': destinationItemId, 'error': str(err)})

    def DeleteRelationShip(self, sourceItemId, destinationItemId, relationshipType):
        param = {
            'originItemId': sourceItemId,
            'destinationItemId': destinationItemId,
            'relationshipType': relationshipType
        }
        if self.userInfo is not None:
            usercontentUrl = self._GetPrivateOwningSystem() + "/content/users/" + self.GetSelf()['user'][
                'username'] + '/deleteRelationship'
            try:
                self._handleError(self.MakeUserInfoPortalRequest(usercontentUrl, param), ['success'])
            except Exception as err:
                raise OfflineException('DeleteRelationFailed',
                                       {'source': sourceItemId, 'destination': destinationItemId, 'error': str(err)})
        else:
            # using hosted gp
            try:
                selfJson = self.GetSelf()
                usercontentUrl = "content/users/" + selfJson["user"]["username"] + '/deleteRelationship'
                self._handleError(self.hostedgp.GenericSharingRequest(usercontentUrl, param), ['success'])
            except GPCloudExec as errorGp:
                raise OfflineException('DeleteRelationFailed',
                                       {'source': sourceItemId, 'destination': destinationItemId,
                                        'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('DeleteRelationFailed',
                                       {'source': sourceItemId, 'destination': destinationItemId, 'error': str(err)})

    def GetResourceAsFile(self, resourceKey, fileName, itemId=None):
        if self.userInfo is not None:
            if itemId is None:
                resourceUrl = self._GetPrivateOwningSystem() + "/sharing/rest/portals/self/resources/" + resourceKey
            else:
                resourceUrl = self._GetPrivateOwningSystem() + "/sharing/rest/content/items/" \
                              + itemId + "/resources/" + resourceKey
            param = {}
            if 'token' in self.userInfo:
                param['token'] = self.userInfo['token']
            header = {}
            if 'referer' in self.userInfo:
                header['referer'] = self.userInfo['referer']
            try:
                req = requests.get(resourceUrl, params=param, headers=header, stream=True)
                with open(fileName, 'wb') as f:
                    for chunk in req.iter_content(chunk_size=1024 * 1024):
                        if chunk:  # filter out keep-alive new chunks
                            f.write(chunk)
            except Exception as err:
                if itemId is None:
                    raise OfflineException('GetResourceAsFileFailed',
                                           {'resourceKey': resourceKey, 'itemId': '', 'error': str(err)})
                else:
                    raise OfflineException('GetResourceAsFileFailed',
                                           {'resourceKey': resourceKey, 'itemId': itemId, 'error': str(err)})
        else:
            try:
                self.hostedgp.GetResourceAsFile(resourceKey, fileName, itemId)
            except GPCloudExec as errorGp:
                if itemId is None:
                    raise OfflineException('GetResourceAsFileFailed',
                                           {'resourceKey': resourceKey, 'itemId': '', 'error': errorGp.errmsg})
                else:
                    raise OfflineException('GetResourceAsFileFailed',
                                           {'resourceKey': resourceKey, 'itemId': itemId, 'error': errorGp.errmsg})
            except Exception as err:
                if itemId is None:
                    raise OfflineException('GetResourceAsFileFailed',
                                           {'resourceKey': resourceKey, 'itemId': '', 'error': str(err)})
                else:
                    raise OfflineException('GetResourceAsFileFailed',
                                           {'resourceKey': resourceKey, 'itemId': itemId, 'error': str(err)})

    def AddResource(self, file, prefix, resourceUrl=None, fileName=None, itemId=None, folderId=None):
        params = {'f': 'json'}
        if resourceUrl is not None:
            params['url'] = resourceUrl
        else:
            params['file'] = file
        if prefix is not None:
            params['resourcesPrefix'] = prefix
        if fileName is not None:
            params['fileName'] = fileName
        props = {}
        if folderId is not None:
            props['folderId'] = folderId
        if self.userInfo is not None:
            try:
                self._handleError(self.AddUpdateResourceHelper(itemId, params, props, False), ['success'])
            except Exception as err:
                x = file
                if resourceUrl is not None:
                    x = resourceUrl
                if itemId is None:
                    raise OfflineException('AddResourceFailed', {'resourceKey': x, 'itemId': '', 'error': str(err)})
                else:
                    raise OfflineException('AddResourceFailed', {'resourceKey': x, 'itemId': itemId, 'error': str(err)})
        else:
            try:
                self.hostedgp.AddResource(params, props, itemId)
            except GPCloudExec as errorGp:
                x = file
                if resourceUrl is not None:
                    x = resourceUrl
                if itemId is None:
                    raise OfflineException('AddResourceFailed', {'resourceKey': x, 'itemId': '',
                                                                 'error': errorGp.errmsg})
                else:
                    raise OfflineException('AddResourceFailed', {'resourceKey': x, 'itemId': itemId,
                                                                 'error': errorGp.errmsg})
            except Exception as err:
                x = file
                if resourceUrl is not None:
                    x = resourceUrl
                if itemId is None:
                    raise OfflineException('AddResourceFailed', {'resourceKey': x, 'itemId': '', 'error': str(err)})
                else:
                    raise OfflineException('AddResourceFailed', {'resourceKey': x, 'itemId': itemId, 'error': str(err)})

    def DeleteResource(self, itemId, resource, deleteAll=False, folderId=None):
        if self.userInfo is not None:
            delUrl = self._GetPrivateOwningSystem() + '/sharing/rest/content/users/' + self.GetSelf()['user'][
                'username']
            if itemId is not None:
                if folderId is not None:
                    delUrl += '/' + folderId
                delUrl += '/items/' + itemId + '/removeResources'
            params = {'f': 'json'}
            if deleteAll:
                params['deleteAll'] = True
            params['resource'] = resource
            try:
                self._handleError(self.MakeUserInfoPortalRequest(delUrl, params), ['success'])
            except Exception as err:
                raise OfflineException('DeleteResourceFailed',
                                       {'resourceKey': resource, 'itemId': itemId, 'error': str(err)})
            # ignore response
        else:
            try:
                props = {}
                if folderId is not None:
                    props['folderId'] = folderId
                self._handleError(self.hostedgp.DeleteResource(resource, deleteAll, itemId, props), ['success'])
            except GPCloudExec as errorGp:
                raise OfflineException('DeleteResourceFailed',
                                       {'resourceKey': resource, 'itemId': itemId, 'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('DeleteResourceFailed',
                                       {'resourceKey': resource, 'itemId': itemId, 'error': str(err)})

    def GetResources(self, itemId, start=None, num=None, sortField=None, sortOrder=None):
        params = {'f': 'json'}
        if start is not None:
            params['start'] = start
        if num is not None:
            params['num'] = num
        if sortField is not None:
            params['sortField'] = sortField
            if sortOrder is not None:
                params['sortOrder'] = sortOrder

        if self.userInfo is not None:
            getUrl = self._GetPrivateOwningSystem() + '/sharing/rest/content/items/' + itemId + '/resources'
            try:
                return self._handleError(self.MakeUserInfoPortalRequest(getUrl, params), ['total'])
            except Exception as err:
                raise OfflineException('GetResourcesFailed', {'itemId': itemId, 'error': str(err)})
        else:
            try:
                return self._handleError(self.hostedgp.GetResources(itemId, params), ['total'])
            except GPCloudExec as errorGp:
                raise OfflineException('GetResourcesFailed', {'itemId': itemId, 'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('GetResourcesFailed', {'itemId': itemId, 'error': str(err)})

    def GetItemDataAsFile(self, itemId, fileName):
        if self.userInfo is not None:
            dataUrl = self._GetPrivateOwningSystem() + '/sharing/rest/content/items/' + itemId + '/data'
            referer = None
            if 'token' in self.userInfo:
                dataUrl = dataUrl + '?token=' + self.userInfo['token']
            if 'referer' in self.userInfo:
                referer = self.userInfo['referer']
            try:
                if referer is not None:
                    req = Request(dataUrl, headers={'Referer': referer})
                else:
                    req = Request(dataUrl)
                with self._myUrlOpen(req) as response, open(fileName, "wb") as out_file:
                    shutil.copyfileobj(response, out_file)
            except Exception as err:
                raise OfflineException('GetItemDataAsFileFailed', {'itemId': itemId, 'error': str(err)})
        else:
            try:
                self.hostedgp.GetItemDataAsFile(itemId, fileName)
            except GPCloudExec as errorGp:
                raise OfflineException('GetItemDataAsFileFailed', {'itemId': itemId, 'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('GetItemDataAsFileFailed', {'itemId': itemId, 'error': str(err)})

    def ScheduleMapAreaJob(self, itemId, schedule):
        param = {
            'jobType': "generateMapAreaPackage",
            'jobParameters': {'itemId': itemId},
            'cronExpression': schedule
        }
        if self.userInfo is not None:
            userContentUrl = self._GetPrivateOwningSystem() + "/sharing/rest/content/users/" + self.GetSelf()['user'][
                'username'] + '/scheduleJob'
            try:
                resp = self._handleError(self.MakeUserInfoPortalRequest(userContentUrl, param), ['jobId'])
            except Exception as err:
                raise OfflineException('ScheduleMapAreaJobFailed',
                                       {'itemId': itemId, 'error': str(err)})
        else:
            # using hosted gp
            try:
                selfJson = self.GetSelf()
                userContentUrl = "content/users/" + selfJson["user"]["username"] + '/scheduleJob'
                resp = self._handleError(self.hostedgp.GenericSharingRequest(userContentUrl, param), ['jobId'])
            except GPCloudExec as errorGp:
                raise OfflineException('ScheduleMapAreaJobFailed',
                                       {'itemId': itemId, 'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('ScheduleMapAreaJobFailed',
                                       {'itemId': itemId, 'error': str(err)})
        if 'jobId' in resp:
            return resp['jobId']

    def GetScheduledMapAreaJob(self, jobId):
        param = {'f': 'json'}
        if self.userInfo is not None:
            userContentUrl = self._GetPrivateOwningSystem() + "/sharing/rest/content/users/" + self.GetSelf()['user'][
                'username'] + '/jobs/' + jobId
            try:
                resp = self._handleError(self.MakeUserInfoPortalRequest(userContentUrl, param), ['id'])
            except Exception as err:
                raise OfflineException('GetScheduledMapAreaJobFailed',
                                       {'jobId': jobId, 'error': str(err)})
        else:
            # using hosted gp
            try:
                selfJson = self.GetSelf()
                userContentUrl = "content/users/" + selfJson["user"]["username"] + '/jobs/' + jobId
                resp = self._handleError(self.hostedgp.GenericSharingRequest(userContentUrl, param), ['id'])
            except GPCloudExec as errorGp:
                raise OfflineException('GetScheduledMapAreaJobFailed',
                                       {'jobId': jobId, 'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('GetScheduledMapAreaJobFailed',
                                       {'jobId': jobId, 'error': str(err)})
        return resp

    def UpdateScheduledMapAreaJob(self, jobId, itemId, schedule):
        param = {
            'jobType': "generateMapAreaPackage",
            'jobParameters': {'itemId': itemId},
            'cronExpression': schedule
        }
        if self.userInfo is not None:
            userContentUrl = self._GetPrivateOwningSystem() + "/sharing/rest/content/users/" + self.GetSelf()['user'][
                'username'] + '/jobs/' + jobId + '/update'
            try:
                self._handleError(self.MakeUserInfoPortalRequest(userContentUrl, param), ['success'])
            except Exception as err:
                raise OfflineException('UpdateScheduledMapAreaJobFailed',
                                       {'jobId': jobId, 'error': str(err)})
        else:
            # using hosted gp
            try:
                selfJson = self.GetSelf()
                userContentUrl = "content/users/" + selfJson["user"]["username"] + '/jobs/' + jobId + '/update'
                self._handleError(self.hostedgp.GenericSharingRequest(userContentUrl, param), ['success'])
            except GPCloudExec as errorGp:
                raise OfflineException('UpdateScheduledMapAreaJobFailed',
                                       {'itemId': jobId, 'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('UpdateScheduledMapAreaJobFailed',
                                       {'itemId': jobId, 'error': str(err)})

    def PortalSearch(self, param):
        if self.userInfo is not None:
            searchUrl = self._GetPrivateOwningSystem() + '/search'
            try:
                self.MakeUserInfoPortalRequest(searchUrl, param)
            except Exception as err:
                raise OfflineException('SearchFailed', {'error': str(err)})
        else:
            searchUrl = 'search'
            try:
                return self.hostedgp.GenericSharingRequest(searchUrl, param)
            except GPCloudExec as errorGp:
                raise OfflineException('SearchFailed', {'error': errorGp.errmsg})
            except Exception as err:
                raise OfflineException('SearchFailed', {'error': str(err)})

    def GetPrivateServerUrl(self, serverUrl):
        if self._IsOnline():
            return serverUrl

        if self.userInfo is not None:
            selfJson = self.GetSelf()
            accId = None
            if 'id' in selfJson:
                accId = selfJson['id']
            else:
                return serverUrl

            getUrl = self._GetPrivateOwningSystem() + '/sharing/portals/' + accId + '/servers/computePrivateServiceUrl'
            params = {'f': 'json', 'serviceUrl': serverUrl}
            try:
                resp = self._handleError(self.MakeUserInfoPortalRequest(getUrl, params), ['privateServiceUrl'])
                if serverUrl != resp['privateServiceUrl']:
                    self._addToIgnoreCertServers(resp['privateServiceUrl'])
                return resp['privateServiceUrl']
            except Exception:
                pass

        else:
            try:
                x = self.hostedgp.GetPrivateUrl(serverUrl)
                if serverUrl != x:
                    self._addToIgnoreCertServers(x)
                return x
            except Exception as err:
                pass
        return serverUrl

    def MakeUserInfoPortalRequest(self, url, params):
        if params is None:
            params = {}
        if 'f' not in params:
            params['f'] = 'json'
        referer = None
        if 'token' in self.userInfo:
            params['token'] = self.userInfo['token']
        if 'referer' in self.userInfo:
            referer = self.userInfo['referer']
        return self.MakeRESTRequest(url, params, referer)

    def MakeRESTRequest(self, url, params, ref=None):
        # if params not there use GET
        u = url
        if params is None:
            p = {'f': 'json'}
            u = u + "?" + urlencode(p)
            p = None
        else:
            p = params
            if 'f' not in p:
                p['f'] = 'json'
            p = urlencode(p).encode('utf-8')

        req = Request(u, p)
        if ref is not None:
            req.add_header('Referer', ref)
        resp = None
        try:
            resp = self._myUrlOpen(req, timeout=self.timeout)
        except Exception as err:
            # add to error
            raise OfflineException('URLAccessError', {'url': url, 'error': str(err)})

        if resp is None:
            return None
        return json.load(self.reader(resp))

    def AddUpdateItemHelper(self, itemId, param, properties):
        forUpdate = False
        filePresent = False
        isEsriMultiPart = False
        baseUrl = self._GetPrivateOwningSystem() + '/sharing/rest/content/users/' + self.GetSelf()['user']['username']

        if properties is not None and 'folderId' in properties:
            baseUrl = baseUrl + '/' + properties['folderId']
        maxSingleRequestSize = 10 * 1024 * 1024  # 10 MB
        if itemId is not None:
            forUpdate = True
        files = []
        if 'file' in param:
            # file is present
            # multipart or esri multipart
            filePresent = True
            f = open(param['file'], 'rb')
            filesize = getsize(param['file'])
            if filesize > maxSingleRequestSize:
                isEsriMultiPart = True
            files.append({'pname': 'file', 'fileobject': f})
            # else:
            # fread = f.read() # binary array
            # files.append('file',f.name(),fread)
            del param['file']
        if isEsriMultiPart:
            # multiple multipart requests
            # start with addItem(filename,multipart)
            paramStart = {'multipart': True, 'filename': basename(files[0]['fileobject'].name), 'f': 'json'}
            if forUpdate:
                itemUrl = baseUrl + '/items/' + itemId + '/update'
            else:
                itemUrl = baseUrl + '/addItem'

            resp = self.MakeUserInfoPortalRequest(itemUrl, paramStart)
            self._handleError(resp, ['success', 'id'])

            newItemId = resp['id']
            # change url
            itemUrl = baseUrl + '/items/' + newItemId  # change for addPart
            itemUrl = itemUrl + '/addPart'
            index = 1
            while True:
                filePart = files[0]['fileobject'].read(maxSingleRequestSize)
                if not filePart:
                    break
                # write this chunk
                fileParam = []
                fileParam.append((files[0]['pname'], basename(files[0]['fileobject'].name), filePart))
                partParam = {'partNum': index}
                resp = self.create_multipart_rest_request(itemUrl, partParam, fileParam)
                self._handleError(resp, ['success'])
                index = index + 1
            # make final commit call
            # pass actual parameters
            files[0]['fileobject'].close()
            if 'async' in param:
                del param['async']
            if 'multipart' in param:
                del param['multipart']
            commitUrl = baseUrl + '/items/' + newItemId + '/commit'
            resp = self.MakeUserInfoPortalRequest(commitUrl, param)
            self._handleError(resp, ['success'])
            if not forUpdate:
                # return itemid
                return newItemId
        elif filePresent:
            # single multipart request
            if forUpdate:
                url = baseUrl + '/items/' + itemId + '/update'
            else:
                url = baseUrl + '/addItem'
                # make files param
            fileParam = []
            for file in files:
                fread = file['fileobject'].read()  # binary array
                fileParam.append((file['pname'], basename(file['fileobject'].name), fread))
            resp = self.create_multipart_rest_request(url, param, fileParam)
            self._handleError(resp, ['success', 'id'])
            for file in files:
                file['fileobject'].close()

            if not forUpdate:
                return resp['id']
        else:
            # regular rest request no file
            if forUpdate:
                url = baseUrl + '/items/' + itemId + '/update'
            else:
                url = baseUrl + '/addItem'
            resp = self.MakeUserInfoPortalRequest(url, param)
            self._handleError(resp, ['success', 'id'])
            if not forUpdate:
                return resp['id']

    def AddUpdateResourceHelper(self, itemId, param, properties, forUpdate):
        filePresent = False
        isEsriMultiPart = False

        baseUrl = self._GetPrivateOwningSystem()
        if itemId is not None:
            baseUrl += '/sharing/rest/content/users/' + self.GetSelf()['user']['username']

            if properties is not None and 'folderId' in properties:
                baseUrl = baseUrl + '/' + properties['folderId']
            baseUrl += '/items/' + itemId
        else:
            baseUrl += '/sharing/rest/portals/self'

        maxSingleRequestSize = 10 * 1024 * 1024  # 10 MB
        files = []
        if 'file' in param:
            # file is present
            # multipart or esri multipart
            filePresent = True
            f = open(param['file'], 'rb')
            filesize = getsize(param['file'])

            # if filesize > maxSingleRequestSize:
            # isEsriMultiPart = True

            files.append({'pname': 'file', 'fileobject': f})

            del param['file']
        if isEsriMultiPart:
            # multiple multipart requests
            # start with addItem(filename,multipart)
            paramStart = {'multipart': True, 'filename': basename(files[0]['fileobject'].name), 'f': 'json'}
            if forUpdate:
                itemUrl = baseUrl + '/updateResources'
            else:
                itemUrl = baseUrl + '/addResources'

            self.MakeUserInfoPortalRequest(itemUrl, paramStart)
            # change url
            itemUrl = baseUrl + '/items/' + id  # change for addPart
            itemUrl = itemUrl + '/addPart'
            index = 1
            while True:
                filePart = files[0]['fileobject'].read(maxSingleRequestSize)
                if not filePart:
                    break
                # write this chunk
                fileParam = [(files[0]['pname'], basename(files[0]['fileobject'].name), filePart)]
                partParam = {'partNum': index}
                self.create_multipart_rest_request(itemUrl, partParam, fileParam)
                index = index + 1
            # make final commit call
            # pass actual parameters
            files[0]['fileobject'].close()
            if 'async' in param:
                del param['async']
            if 'multipart' in param:
                del param['multipart']
            commitUrl = baseUrl + '/items/' + id + '/commit'
            resp = self.MakeUserInfoPortalRequest(commitUrl, param)
            return resp
        elif filePresent:
            # single multipart request
            if forUpdate:
                requrl = baseUrl + '/updateResources'
            else:
                requrl = baseUrl + '/addResources'
                # make files param
            fileParam = []
            for file in files:
                fread = file['fileobject'].read()  # binary array
                fileParam.append((file['pname'], basename(file['fileobject'].name), fread))
            resp = self.create_multipart_rest_request(requrl, param, fileParam)
            for file in files:
                file['fileobject'].close()
            return resp
        else:
            # regular rest request no file
            if forUpdate:
                requrl = baseUrl + '/updateResource'
            else:
                requrl = baseUrl + '/addResources'
            return self.MakeUserInfoPortalRequest(requrl, param)

    def create_multipart_rest_request(self, url, params, files):
        LIMIT = '----------lImIt_of_THE_fIle_eW_$'
        CRLF = '\r\n'.encode('utf-8')
        L = []
        startBlock = '--' + LIMIT
        endBlock = '--' + LIMIT + '--'
        if params is None:
            params = {}
        if 'f' not in params:
            params['f'] = 'json'
        if 'token' in self.userInfo:
            params['token'] = self.userInfo['token']

        paramsList = list(params.items())
        for (key, value) in paramsList:
            L.append(startBlock.encode('utf-8'))
            fieldBlock = 'Content-Disposition: form-data; name="%s"' % key
            L.append(fieldBlock.encode('utf-8'))
            L.append(b'')
            L.append(str(value).encode('utf-8'))
        for (key, filename, value) in files:
            L.append(startBlock.encode('utf-8'))
            fileBlock = 'Content-Disposition: form-data; name="%s"; filename="%s"' % (key, filename)
            L.append(fileBlock.encode('utf-8'))
            contentTypeHdr = 'Content-Type: application/octet-stream'
            # L.append('Content-Type: %s' % get_content_type(filename))
            L.append(contentTypeHdr.encode('utf-8'))
            L.append(b'')
            L.append(value)
        L.append(endBlock.encode('utf-8'))
        L.append(b'')
        body = CRLF.join(L)
        portalReq = Request(url, data=body)
        portalReq.add_header('content-type', 'multipart/form-data; boundary=%s' % LIMIT)
        if 'referer' in self.userInfo:
            portalReq.add_header('Referer', self.userInfo['referer'])
        try:
            resp = self._myUrlOpen(portalReq, timeout=self.timeout)
        except Exception as err:
            # add to error
            raise OfflineException('URLAccessError', {'url': url, 'error': str(err)})

        if resp is None:
            return None
        return json.load(self.reader(resp))

    def EncodeUrl(self, urlToEncode):
        if urlToEncode is None:
            return urlToEncode

        if len(urlToEncode) == 0:
            return urlToEncode
        # also change to private url if not AGOL
        t = urlToEncode
        if not self._IsOnline():
            t = self.GetPrivateServerUrl(urlToEncode)

        return quote(t, "/:")


class ServiceTaskBase(RESTHandler):
    def __init__(self, hostedgp, url, extent, area, userInfo):
        super(ServiceTaskBase, self).__init__(hostedgp, userInfo)

        self.url = url
        self.encodedUrl = self.EncodeUrl(url)
        self.token = None  # for service could be portaltoken, server token
        self.referer = None
        self.serviceDef = None
        self.title = None

        # common members
        self.state = None  # new, updated, unchanged

        self.extent = extent

        self.area = area  # can be by ref or value
        self.areaValue = None  # always by value

        self.error = ""
        self.step = 1
        self.lastFunction = ""
        self.itemSRName = None
        self.itemExtent = None
        self.itemId = None
        self.folderId = None
        self.gpExtent = None
        self.mapAreaItemId = None
        self.mapAreaItemSharing = None
        self.isUpdate = False  # used for status in output
        self.isShared = False  # used for status in output
        self.usePackageSharing = False  # flag to do lockup of existing matching package

        self.isSecuredProxy = False # flag to indicate service proxy, token is in querystring
        self.isOwningSystemMatch = False
        # convert extent JSON to gp envelope and Spatial Reference inside to GP SR

        if self.extent is not None:
            extentSR = None
            if 'spatialReference' in self.extent:
                if 'wkt' in self.extent['spatialReference']:
                    extentSR = arcpy.SpatialReference()
                    extentSR.loadFromString(self.extent['spatialReference']['wkt'])
                elif 'wkid' in self.extent['spatialReference']:
                    extentSR = arcpy.SpatialReference(self.extent['spatialReference']['wkid'])
                elif 'latestWkid' in self.extent['spatialReference']:
                    extentSR = arcpy.SpatialReference(self.extent['spatialReference']['latestWkid'])

            if 'xmin' in self.extent and 'ymin' in self.extent and \
                    'xmax' in self.extent and 'ymax' in self.extent:

                self.gpExtent = arcpy.Extent(float(self.extent['xmin']), float(self.extent['ymin']),
                                             float(self.extent['xmax']),
                                             float(self.extent['ymax']))
                if extentSR is not None:
                    self.gpExtent.spatialReference = extentSR

        # get rest info for IsSecuredProxy check
        self._checkRESTInfo()

    def _checkRESTInfo(self):
        if self.encodedUrl is None:
            return
        findstr = '/rest/services/'
        pos = self.encodedUrl.find(findstr)
        if pos == -1:
            findstr = '/rest/admin/services/'
            pos = self.encodedUrl.find(findstr)
            if pos == -1:
                return
        temp = self.encodedUrl.partition(findstr)
        restInfoUrl = temp[0] + '/rest/info'

        try:
            resp = self.MakeRESTRequest(restInfoUrl, None)
        except Exception as err:
            return

        if resp is None:
            return

        self.isSecuredProxy = resp.get('isSecuredProxy',False)

        # owning system compare

        if 'owningSystemUrl' in resp:
            self.GetOwningSystem()
            myParse = urlparse(self.portalUrl)
            svcParse = urlparse(resp["owningSystemUrl"])

            if myParse.hostname.lower() == svcParse.hostname.lower():
                self.isOwningSystemMatch = True

    def _manageToken(self):
        # check if user passed token for service
        if self.token is None:
            # we have to get server token or portal token
            if self.userInfo is None:
                if self.isOwningSystemMatch:
                    self.token, self.referer = self.GenerateToken(self.url)
            else:
                if 'token' in self.userInfo:
                    self.token = self.userInfo['token']
                if 'referer' in self.userInfo:
                    self.referer = self.userInfo['referer']

    def GetServiceDef(self):
        resp = self.RESTRequestWithRetry(self.encodedUrl, None)
        if resp is not None and "error" in resp:
            raise OfflineException('URLAccessError', {'url': self.url, 'error': str(resp)})
        self.serviceDef = resp
        return

    def RESTRequestWithRetry(self, url, params):
        # if service is secured, add the token
        # otherwise try with token first
        # and retry with token on failure  
        if params is None:
            params = {}
        newUrl = url
        if self.token is not None:
            # add token/referer explicitly passed
            if self.isSecuredProxy:
                newUrl = newUrl + "?token=" + self.token
            else:
                params['token'] = self.token

        elif self.userInfo is not None and 'token' in self.userInfo:
            # use portal token provided with param
            if self.isSecuredProxy:
                newUrl = newUrl + "?token=" + self.token
            else:
                params['token'] = self.userInfo['token']
            # use the token\referer for all future calls
            self.token = self.userInfo['token']
            if 'referer' in self.userInfo:
                self.referer = self.userInfo['referer']

        resp = None
        if self.token is not None:
            resp = self.MakeRESTRequest(newUrl, params, self.referer)
            return resp
        else:
            # either free or servertoken
            resp = self.MakeRESTRequest(newUrl, params, None)
            orgErr = resp

            if resp is not None and 'error' not in resp:
                return resp
            self._manageToken()
            if self.token is not None:
                if self.isSecuredProxy:
                    newUrl = newUrl + "?token=" + self.token
                else:
                    params['token'] = self.token
                return self.MakeRESTRequest(newUrl, params, self.referer)
            else:
                return orgErr

    def GetExportTileUrl(self):
        parseUrl = urlparse(self.url)
        toolUrl = None
        # check self for helperServices/packaging/exportTilesMap
        portalSelf = self.GetSelf()
        exportTilesMap = portalSelf.get("helperServices",{}).get("packaging",{}).get("exportTilesMap")

        internalTileMap = {}
        if exportTilesMap is not None:
            for tileSrv in exportTilesMap:
                tileUrl = tileSrv.get('source')
                exportTileUrl = tileSrv.get('export')
                if tileUrl is not None and exportTileUrl is not None:
                    # get hostname for all listings
                    tileUrlParse = urlparse(tileUrl)
                    exportTileUrlParse = urlparse(exportTileUrl)
                    if tileUrlParse is not None and exportTileUrlParse is not None:
                        if tileUrlParse.netloc and exportTileUrlParse.netloc:
                            internalTileMap[tileUrlParse.netloc.lower()] = exportTileUrlParse.netloc

        # search for server in our list
        toolUrl = internalTileMap.get(parseUrl.netloc.lower())
        if toolUrl is not None:
            toolUrl = urlunparse([parseUrl[0], toolUrl, parseUrl[2], parseUrl[3], parseUrl[4], parseUrl[5]])
            arcpy.AddMessage("Export URL:" + toolUrl)

        return toolUrl

    def HandleItemExtent(self):
        if self.gpExtent is None:
            return 0
        # extent is set on arcpy
        # project it to wgs 84
        try:
            wgs84SR = arcpy.SpatialReference(4326)
            projectedExtent = self.gpExtent.projectAs(wgs84SR)
            self.itemExtent = json.dumps({'xmin': projectedExtent.XMin,
                                          'ymin': projectedExtent.YMin,
                                          'xmax': projectedExtent.XMax,
                                          'ymax': projectedExtent.YMax})
            self.itemSRName = wgs84SR.name
        except Exception:
            raise OfflineException('SRError', {'extent': json.dumps(self.extent)})
        return 0

    def DeletePackageItem(self):
        properties = {}
        if self.itemId is None:
            return
        # delete relationship with mapAreaItem
        # return any errors
        # self.DeleteRelationShip(self.mapAreaItemId, self.itemId,'Area2Package')

        if self.folderId is not None:
            properties["folderId"] = self.folderId

        self.DeleteItem(self.itemId, properties)

    def PostAddItem(self):
        # do sharing if required

        if self.mapAreaItemSharing is not None:
            isSharedWithEveryone = False
            isSharedWithOrg = False
            groups = None
            if 'access' in self.mapAreaItemSharing:
                if self.mapAreaItemSharing['access'] == 'public':
                    isSharedWithEveryone = True
                    isSharedWithOrg = True
                elif self.mapAreaItemSharing['access'] == 'org':
                    isSharedWithEveryone = False
                    isSharedWithOrg = True
            if 'groups' in self.mapAreaItemSharing:
                groups = self.mapAreaItemSharing['groups']

            if isSharedWithEveryone or isSharedWithOrg or (groups is not None and len(groups) > 0):
                properties = {}

                if self.folderId is not None:
                    properties["folderId"] = self.folderId

                self.ShareItem(self.itemId, isSharedWithEveryone, isSharedWithOrg, groups, properties)

                # do relationship with map area item
        # doing here as additem(byurl) cannot handle it.
        if self.mapAreaItemId is not None:
            self.AddRelationShip(self.mapAreaItemId, self.itemId, "Area2Package")

    def HandleAreaByRef(self):
        # downloads resource if by ref and not already downloaded
        if self.area is None or self.areaValue is not None:
            return
        if 'resource' not in self.area:
            self.areaValue = self.area
            return
        # check if value is already there in area
        # setupmaparea optimization
        if 'polygon' in self.area:
            self.areaValue = {'polygon': self.area['polygon']}
            del self.area['polygon']
            return

        if 'itemId' not in self.area:
            # error
            raise OfflineException("MissingProperty", {"name": "MapItemId/Area"})

        fileName = arcpy.env.scratchFolder + '/' + str(uuid4()) + '.txt'
        self.GetResourceAsFile(self.area['resource'], fileName, self.area['itemId'])
        itemArea = None
        try:
            with open(fileName, "r") as out_file:
                itemArea = json.load(out_file)
        except Exception as err:
            # raise OfflineException('GetResourcesFailed', {'itemId': item['id'], 'error': str(err)})
            pass  # ignore this exception
        if itemArea is None:
            # raise error
            raise OfflineException('InvalidArea', {})
        self.areaValue = itemArea

    def CompareDict(self, dictA, dictB):
        if not type(dictB) is dict:
            return False
        if not type(dictA) is dict:
            return False

        for k in dictA.keys():
            if k not in list(dictB.keys()):
                return False
            else:
                if type(dictA[k]) is dict:
                    if not self.CompareDict(dictA[k], dictB[k]):
                        return False
                else:
                    if dictA[k] != dictB[k]:
                        return False
        return True

    def Compare(self, serviceObj):
        # compare return True if same
        if UrlForCompare(self.url) == UrlForCompare(serviceObj.url):
            if self.area is not None or serviceObj.area is not None:
                # check  for area json
                if self.area is not None and serviceObj.area is not None:
                    if self.area == serviceObj.area:
                        return True
            elif self.extent == serviceObj.extent:
                return True
        return False
