
import queue
import time
from MapAreaFeatureServiceHandler import FeatureServiceTask
from MapAreaTilesServiceHandler import TilesServiceTask
from MapAreaVTilesServiceHandler import VTilesServiceTask
from MapAreaServiceTaskBase import OfflineException
from MapAreaServiceTaskBase import UrlForCompare
from MapAreaServiceTaskBase import ServiceTaskBase
import uuid


def GetMapToAreaParam(mapItemId):
    param = {'relationshipType': 'Map2Area', 'direction': 'forward', 'f': 'json'}
    path = 'content/items/' + mapItemId + '/relatedItems'
    return path, param


def GetAreaToMapParam(areaItemId):
    param = {'relationshipType': 'Map2Area', 'direction': 'reverse', 'f': 'json'}
    path = 'content/items/' + areaItemId + '/relatedItems'
    return path, param


def GetAreaToPackageParam(areaItemId):
    param = {'relationshipType': 'Area2Package', 'direction': 'forward', 'f': 'json'}
    path = 'content/items/' + areaItemId + '/relatedItems'
    return path, param


def GetBookmarkExtent(mapItemData, bookmark):
    # return extent dictionary
    # check if bookmark is object or array
    if 'bookmark' in mapItemData:
        # single entry
        if 'name' in mapItemData['bookmark'] and mapItemData['bookmark']['name'] == bookmark:
            if 'extent' in mapItemData['bookmark']:
                return mapItemData['bookmark']['extent']
    elif 'bookmarks' in mapItemData:
        # multiple bookmarks
        for b in mapItemData['bookmarks']:
            if 'name' in b and b['name'] == bookmark:
                if 'extent' in b:
                    return b['extent']
                break
    return None


def GetLayerUrl(hgp, layerType, layer):
    url = None
    if layerType == 'VectorTileLayer':
        # find url from item
        if 'itemId' in layer:
            vtItem = hgp.GetItem(layer['itemId'])
            url = vtItem['url']
            url = url.rstrip('/')
        elif 'styleUrl' in layer:  # get service from style
            url = layer['styleUrl']
        # check if url is to style
        if url is not None and url.find('VectorTileServer/resources/styles') > 0:
            # get service url
            styleUrl = url
            url = None
            styleRequest = ServiceTaskBase(hgp, styleUrl, None, None)
            styleRequest.GetServiceDef()
            if styleRequest.serviceDef is not None:
                # get service url
                if 'sources' in styleRequest.serviceDef:
                    if 'esri' in styleRequest.serviceDef['sources'] \
                            and 'url' in styleRequest.serviceDef['sources']['esri']:
                        temp = styleRequest.serviceDef['sources']['esri']['url']
                        if temp.find("..") >= 0:
                            # this is relative url
                            styleSplit = styleUrl.split('/')
                            relativeSplit = temp.split('/')
                            del styleSplit[-1]
                            for x in relativeSplit:
                                if x is None or len(x) == 0:
                                    continue
                                if x == '..':
                                    del styleSplit[-1]
                                else:
                                    styleSplit.append(x)

                            url = '/'.join(styleSplit)
                        else:
                            url = temp
    elif 'url' in layer:
        url = layer['url']
        url = url.rstrip('/')

    return url


def HandleTable(hgp, mapServiceList, mapServiceIndex, actualLayersToIgnore, table):

    if 'url' not in table:
        return
    url = table['url']
    urlToCompare = UrlForCompare(url)

    if urlToCompare in actualLayersToIgnore:
        return

    serviceType = '/FeatureServer'
    fpos = url.rfind(serviceType)

    if fpos == 0:
        return  # ignore this layer

    if fpos > 0:
        # feature service
        # get layer ID
        layerId = int(url[fpos + len(serviceType) + 1:])
        serviceUrl = url[:fpos + len(serviceType)]
        layerDef = None
        if 'layerDefinition' in table:
            if 'definitionExpression' in table['layerDefinition']:
                layerDef = table['layerDefinition']['definitionExpression']
        serviceUrlForCompare = UrlForCompare(serviceUrl)
        if serviceUrlForCompare in mapServiceIndex:
            # more than one layer from same service
            fs = mapServiceList[mapServiceIndex[serviceUrlForCompare]]
            fs['layers'].append(layerId)
            if layerDef is not None:
                whereObj = {'where': layerDef}
                if 'layerDefinition' in fs:
                    fs['layerDefinition'][str(layerId)] = whereObj
                else:
                    fs['layerDefinition'] = {str(layerId): whereObj}
        else:
            # add new service
            # get service name
            s = {'url': serviceUrl, 'layers': [layerId], 'type': 'featureService'}

            temp = url[:fpos]
            pos2 = temp.rfind('/')
            s['serviceName'] = temp[pos2 + 1:]
            # saving as layerDefinition instead of LayerQueries
            # to separate map value from user provided values.
            if layerDef is not None:
                s['layerDefinition'] = {layerId: {'where': layerDef}}

            mapServiceList.append(s)
            mapServiceIndex[serviceUrlForCompare] = len(mapServiceList) - 1


def HandleLayer(hgp, mapServiceList, mapServiceIndex, mapOfflineProps, actualLayersToIgnore, layerType, layer):

        url = GetLayerUrl(hgp, layerType, layer)
        if url is None:
            return
        # remove protocol and lower case it
        urlToCompare = UrlForCompare(url)

        if urlToCompare in actualLayersToIgnore:
            return

        fsstring = '/FeatureServer'
        fpos = url.rfind(fsstring)
        msstring = '/MapServer'
        mpos = url.rfind(msstring)
        vtstring = '/VectorTileServer'
        vpos = url.rfind(vtstring)
        isstring = '/ImageServer'
        ipos = url.rfind(isstring)

        if fpos == 0 and mpos == 0 and vpos == 0 and ipos == 0:
            return  # ignore this layer

        # can't help it if name is messed up
        # feature service named mapserver?
        # if (fpos > 0 and mpos > 0):
        # if fpos > mpos:
        # mpos = 0
        # else:
        # fpos = 0

        if fpos > 0:
            # feature service
            # get layer ID , map has layer from service
            layerId = int(url[fpos + len(fsstring) + 1:])
            serviceUrl = url[:fpos + len(fsstring)]
            layerDef = None
            if 'layerDefinition' in layer:
                if 'definitionExpression' in layer['layerDefinition']:
                    layerDef = layer['layerDefinition']['definitionExpression']

            serviceUrlForCompare = UrlForCompare(serviceUrl)

            if serviceUrlForCompare in mapServiceIndex:
                # more than one layer from same service
                fs = mapServiceList[mapServiceIndex[serviceUrlForCompare]]
                if layerId in fs['layers']:
                    # handle duplicate layer case
                    if layerDef is None:
                        # if previous has any layerdef remove it
                        if 'layerDefinition' in fs and str(layerId) in fs['layerDefinition'].keys():
                            fs['layerDefinition'].pop(str(layerId), None)
                    else:
                        # if previously no layerdef then ignore this one
                        # otherwise merge them
                        if 'layerDefinition' in fs and str(layerId) in fs['layerDefinition'].keys():
                            x = fs['layerDefinition'][str(layerId)]
                            if 'where' in x:
                                x['where'] = '(' + x.pop('where', None) + ') OR (' + layerDef + ')'

                else:
                    fs['layers'].append(layerId)
                    if layerDef is not None:
                        whereObj = {'where': layerDef}
                        # saving as layerDefinition instead of LayerQueries
                        # to separate map value from user provided values.
                        if 'layerDefinition' in fs:
                            fs['layerDefinition'][str(layerId)] = whereObj
                        else:
                            fs['layerDefinition'] = {str(layerId): whereObj}
            else:
                # add new service
                # get service name
                s = {'url': serviceUrl, 'layers': [layerId], 'type': 'featureService'}
                temp = url[:fpos]
                pos2 = temp.rfind('/')
                s['serviceName'] = temp[pos2 + 1:]
                if layerDef is not None:
                    # saving as layerDefinition instead of LayerQueries
                    # to separate map value from user provided values.
                    s['layerDefinition'] = {str(layerId): {'where': layerDef}}

                if mapOfflineProps is not None:
                    s['mapOfflineProps'] = mapOfflineProps

                mapServiceList.append(s)
                mapServiceIndex[serviceUrlForCompare] = len(mapServiceList) - 1
        elif mpos > 0 or ipos > 0:
            # map service
            if mpos > 0:
                totalLength = mpos + len(msstring)
            else:
                totalLength = ipos + len(isstring)

            if len(url) == totalLength:
                # tile service
                # should not exist in services list
                serviceUrlForCompare = UrlForCompare(url)
                if serviceUrlForCompare in mapServiceIndex:
                    return
                s = {'url': url, 'type': 'tileService'}

                if mpos > 0:
                    temp = url[:mpos]
                else:
                    temp = url[:ipos]
                pos2 = temp.rfind('/')
                s['serviceName'] = temp[pos2 + 1:]
                mapServiceList.append(s)
                mapServiceIndex[serviceUrlForCompare] = len(mapServiceList) - 1
        else:
            # vector tile service
            if len(url) == vpos + len(vtstring):
                # should not exist in services list
                serviceUrlForCompare = UrlForCompare(url)
                if serviceUrlForCompare in mapServiceIndex:
                    return
                s = {'url': url, 'type': 'vectorTileService'}
                temp = url[:mpos]
                pos2 = temp.rfind('/')
                s['serviceName'] = temp[pos2 + 1:]
                mapServiceList.append(s)
                mapServiceIndex[serviceUrlForCompare] = len(mapServiceList) - 1


def HandleGroupLayer(hgp, mapServiceList, mapServiceIndex, mapOfflineProps, actualLayersToIgnore, layer):
    # this may get recursive
    # get layers array
    if 'layers' not in layer:
        return
    for layer in layer['layers']:
        layerType = None
        if 'layerType' in layer:
            layerType = layer['layerType']

        if layerType is None:
            continue

        if layerType == 'GroupLayer':
            HandleGroupLayer(hgp, mapServiceList, mapServiceIndex, mapOfflineProps, actualLayersToIgnore, layer)
            continue

        if layerType != 'ArcGISFeatureLayer' and layerType != 'ArcGISTiledMapServiceLayer' \
            and layerType != 'VectorTileLayer' and layerType != 'ArcGISTiledImageServiceLayer' \
                and layerType != 'SubtypeGroupLayer':
            continue

        HandleLayer(hgp, mapServiceList, mapServiceIndex, mapOfflineProps, actualLayersToIgnore, layerType, layer)


def HandleMapLayers(hgp, mapItemData, layersToIgnore):
    # convert map operation/base map layers to service array and service index
    mapServiceList = []
    mapServiceIndex = {}
    operationalLayers = []
    tableLayers = []

    # make them lower and remove protocol
    actualLayersToIgnore = []
    for x in layersToIgnore:
        actualLayersToIgnore.append(UrlForCompare(x))

    if 'operationalLayers' not in mapItemData and 'tables' not in mapItemData:
        return mapServiceList, mapServiceIndex

    if 'operationalLayers' in mapItemData:
        operationalLayers = mapItemData["operationalLayers"]

    if 'tables' in mapItemData:
        tableLayers = mapItemData["tables"]

    if 'baseMap' in mapItemData and 'baseMapLayers' in mapItemData['baseMap']:
        # add basemap layer to operationLayers list
        bmaplayers = mapItemData['baseMap']['baseMapLayers']
        for bmap in bmaplayers:
            operationalLayers.append(bmap)

    mapOfflineProps = None
    # handle webmap offline properties
    if 'applicationProperties' in mapItemData and 'offline' in mapItemData['applicationProperties']:
        mapOfflineProps = mapItemData['applicationProperties']['offline']

    for layer in operationalLayers:
        layerType = None
        if 'layerType' in layer:
            layerType = layer['layerType']

        if layerType is None:
            continue

        if layerType == 'GroupLayer':
            HandleGroupLayer(hgp, mapServiceList, mapServiceIndex, mapOfflineProps, actualLayersToIgnore, layer)
            continue

        if layerType != 'ArcGISFeatureLayer' and layerType != 'ArcGISTiledMapServiceLayer' \
                and layerType != 'VectorTileLayer' and layerType != 'ArcGISTiledImageServiceLayer' \
                and layerType != 'SubtypeGroupLayer':
            continue

        HandleLayer(hgp, mapServiceList, mapServiceIndex, mapOfflineProps, actualLayersToIgnore, layerType, layer)

    for table in tableLayers:
        HandleTable(hgp, mapServiceList, mapServiceIndex, actualLayersToIgnore, table)

    # check for network layer
    if 'utilityNetworks' in mapItemData:
        HandleUtilityNetworkLayer(hgp, mapItemData['utilityNetworks'],
                                  mapServiceList,mapServiceIndex, mapOfflineProps)

    return mapServiceList, mapServiceIndex


def HandleUtilityNetworkLayer(hgp, mapUtilityNetwork, mapServiceList, mapServiceIndex, mapOfflineProps):
    for utilityNetwork in mapUtilityNetwork:
        # get url
        if 'url' in utilityNetwork:
            utilityNetworkUrlForCompare = UrlForCompare(utilityNetwork['url'])
            # change to service url
            fsstring = '/featureserver'
            fpos = utilityNetworkUrlForCompare.rfind(fsstring)
            if fpos <= 0:
                continue  # ignore this layer
            UNServiceUrl = utilityNetworkUrlForCompare[:fpos + len(fsstring)]
            UNLayerId = int(utilityNetworkUrlForCompare[fpos + len(fsstring) + 1:])
            # search maplayer index
            # there should at least one operations layer belonging to UN feature service
            if UNServiceUrl in mapServiceIndex:
                # set usedAsUtilityNetwork on service object
                mapServiceList[mapServiceIndex[UNServiceUrl]]['hasUtilityNetworkLayer'] = True
                # also add this layer id to layer list
                fs = mapServiceList[mapServiceIndex[UNServiceUrl]]
                if UNLayerId not in fs['layers']:
                    fs['layers'].append(UNLayerId)


def MergeAdditionalServices(services, serviceList, serviceIndex):
    # params is list of service json (tile and feature)
    for service in services:
        if 'url' not in service or len(service['url']) == 0:
            raise OfflineException('MissingProperty', {'name': 'url'})

        url = service['url']
        url = url.rstrip('/')
        # make it lower and strip protocol
        indexUrl = UrlForCompare(url)

        # parameter url are for service
        fsstring = '/FeatureServer'
        msstring = '/MapServer'
        vtstring = '/VectorTileServer'
        isstring = '/ImageServer'

        if url.endswith(fsstring):
            # feature service
            # get layers property or check for layerId
            if 'layers' in service:
                layerIds = service['layers']
            else:
                raise OfflineException('MissingProperty', {'name': 'layers'})
            if indexUrl in serviceIndex:
                # service already exists, likely override of map 
                fs = serviceList[serviceIndex[indexUrl]]
                fs['layers'].extend(layerIds)
                # remove any duplicates
                fs['layers'] = list(set(fs['layers']))
                if 'layerQueries' in service:
                    if 'layerQueries' not in fs:
                        fs['layerQueries'] = service['layerQueries']
                    else:
                        for layerId in service['layerQueries'].keys():
                            fs['layerQueries'][str(layerId)] = service['layerQueries'][layerId]

                if 'syncDirection' in service:
                    fs['syncDirection'] = service['syncDirection']

                if 'returnAttachments' in service:
                    fs['returnAttachments'] = service['returnAttachments']

                if 'attachmentsSyncDirection' in service:
                    fs['attachmentsSyncDirection'] = service['attachmentsSyncDirection']

                if 'syncModel' in service:
                    fs['syncModel'] = service['syncModel']

                # check title, folderId
                if 'token' in service:
                    fs['token'] = service['token']

                if 'referer' in service:
                    fs['referer'] = service['referer']

                # don't handle userInfo never passed in service list
                # if 'userInfo' in service:
                # fs['userInfo'] = service['userInfo']

                if 'title' in service:
                    fs['title'] = service['title']

                if 'createPkgDeltas' in service:
                    fs['createPkgDeltas'] = service['createPkgDeltas']
            else:
                # add new service
                # get service name
                s = {'url': url, 'layers': layerIds, 'type': 'featureService'}
                if 'title' not in service:
                    # get service name
                    temp = url[:len(url) - len(fsstring)]
                    pos2 = temp.rfind('/')
                    s['serviceName'] = temp[pos2 + 1:]
                else:
                    s['title'] = service['title']

                if 'layerQueries' in service:
                    s['layerQueries'] = service['layerQueries']

                if 'folderId' in service:
                    s['folderId'] = service['folderId']

                if 'token' in service:
                    s['token'] = service['token']

                if 'referer' in service:
                    s['referer'] = service['referer']

                # if 'userInfo' in service:
                # s['userInfo'] = service['userInfo']

                if 'createPkgDeltas' in service:
                    s['createPkgDeltas'] = service['createPkgDeltas']

                serviceList.append(s)
                serviceIndex[indexUrl] = len(serviceList)

        elif url.endswith(vtstring):
            # vector tile service
            if 'levels' not in service:
                raise OfflineException('MissingProperty', {'name': 'levels'})

            if indexUrl in serviceIndex:
                # override levels,title,folder
                s = serviceList[serviceIndex[indexUrl]]
                if 'levels' in service:
                    s['levels'] = service['levels']

                if 'title' in service:
                    s['title'] = service['title']

                if 'folderId' in service:
                    s['folderId'] = service['folderId']

                if 'token' in service:
                    s['token'] = service['token']

                if 'referer' in service:
                    s['referer'] = service['referer']

                # if 'userInfo' in service:
                # s['userInfo'] = service['userInfo']

            else:
                # create new
                if 'title' not in service:
                    # get service name
                    temp = url[:len(url) - len(msstring)]
                    pos2 = temp.rfind('/')
                    service['serviceName'] = temp[pos2 + 1:]
                service['type'] = 'vectorTileService'
                serviceList.append(service)
                serviceIndex[indexUrl] = len(serviceList) - 1

        elif url.endswith(msstring) or url.endswith(isstring):
            # map service
            if 'levels' not in service:
                raise OfflineException('MissingProperty', {'name': 'levels'})

            if indexUrl in serviceIndex:
                # override levels,title,folder
                s = serviceList[serviceIndex[indexUrl]]
                if 'levels' in service:
                    s['levels'] = service['levels']
                if 'compressionQuality' in service:
                    s['compressionQuality'] = service['compressionQuality']
                if 'title' in service:
                    s['title'] = service['title']
                if 'folderId' in service:
                    s['folderId'] = service['folderId']
                if 'token' in service:
                    s['token'] = service['token']
                if 'referer' in service:
                    s['referer'] = service['referer']
            else:
                if 'title' not in service:
                    # get service name
                    temp = url[:len(url) - len(msstring)]
                    pos2 = temp.rfind('/')
                    service['serviceName'] = temp[pos2 + 1:]
                service['type'] = 'tileService'
                serviceList.append(service)
                serviceIndex[indexUrl] = len(serviceList) - 1


def ServiceObjFromServices(hgp, mapAreaItem, serviceList):
    # return object array and dictionary index
    # handle folderId, extent, title(using service name)
    serviceObjList = []
    serviceObjIndex = {}

    folderId = None
    if 'ownerFolder' in mapAreaItem:
        folderId = mapAreaItem['ownerFolder']

    for s in serviceList:
        if 'title' not in s and 'serviceName' in s:
            s['title'] = s['serviceName'] + "-" + str(uuid.uuid4()).replace('-', '')
        if folderId is not None and 'folderId' not in s:
            s['folderId'] = folderId

        if 'area' in mapAreaItem['properties']:
            s['area'] = mapAreaItem['properties']['area']
            #check if it is by ref, so put MA item id in it
            if 'resource' in s['area']:
                s['area']['itemId'] = mapAreaItem['id']

        if 'extent' in mapAreaItem['properties']:
            s['extent'] = mapAreaItem['properties']['extent']

        # used for adding relationship
        s['mapAreaItemId'] = mapAreaItem['id']

        if 'sharing' in mapAreaItem:
            s['mapAreaItemSharing'] = mapAreaItem['sharing']
        userInfo = None
        if 'userInfo' in s:
            userInfo = s['userInfo']
        if s['type'] == 'tileService':
            # we will generate levels
            # if 'levels' not in s:
            # continue
            # handle level for map service
            # HandleMapServiceLevel(hgp,s)
            # map service
            obj = TilesServiceTask(hgp, s, None, userInfo)
        elif s['type'] == 'featureService':
            # feature service
            obj = FeatureServiceTask(hgp, s, None, userInfo)
        elif s['type'] == 'vectorTileService':
            # vector tile service
            # we will generate levels
            # if 'levels' not in s:
            # continue
            obj = VTilesServiceTask(hgp, s, None, userInfo)
        else:
            continue
        serviceObjList.append(obj)
        serviceObjIndex[UrlForCompare(s['url'])] = len(serviceObjList) - 1

    return serviceObjList, serviceObjIndex


def ServiceObjFromPackages(hgp, mapAreaItem):
    # get packages for mapareaitem
    # build ServiceObjects
    existingPackage = []
    existingPackageIndex = {}
    # find Area2Package related items
    path, param = GetAreaToPackageParam(mapAreaItem['id'])
    try:
        existingPackages = hgp.GenericSharingRequest(path, param)
    except Exception:
        raise OfflineException('GetPackagesFailed', {'itemId': mapAreaItem['id']})

    if 'total' in existingPackages and existingPackages['total'] > 0:
        # search existing ones for bookmark property with that name
        for item in existingPackages['relatedItems']:
            itemType = item['type']
            itemInfo = {'item': item, 'mapAreaItemId': mapAreaItem['id']}
            if 'properties' in item:
                # url and #extent should be there
                if 'url' not in item['properties']:
                    continue
                if  'extent' not in item['properties'] and 'area' not in item['properties']:
                    continue

                if itemType == 'Tile Package':
                    ms = TilesServiceTask(hgp, None, itemInfo, None)
                    existingPackage.append(ms)
                    existingPackageIndex[UrlForCompare(ms.url)] = len(existingPackage) - 1
                elif itemType == 'SQLite Geodatabase':
                    fs = FeatureServiceTask(hgp, None, itemInfo, None)
                    existingPackage.append(fs)
                    existingPackageIndex[UrlForCompare(fs.url)] = len(existingPackage) - 1
                elif itemType == 'Vector Tile Package':
                    vt = VTilesServiceTask(hgp, None, itemInfo, None)
                    existingPackage.append(vt)
                    existingPackageIndex[UrlForCompare(vt.url)] = len(existingPackage) - 1
    return existingPackage, existingPackageIndex


def CreateUpdatePackages(servicesList):
    pendingQueue = queue.Queue()
    completedQueue = queue.Queue()
    failedQueue = queue.Queue()

    for s in servicesList:
        pendingQueue.put(s)

    while True:
        try:
            task = pendingQueue.get(False)
        except queue.Empty:
            break
        # process it
        ret = task.ProcessTask()
        if ret == 1:
            pendingQueue.put(task)
        else:
            if ret == -1:
                # can confuse with job failed
                failedQueue.put(task)
            else:
                if ret == 0:
                    completedQueue.put(task)

        time.sleep(3)
    # proces failed/completed Queue 
    failedQueueEmpty = False
    completedQueueEmpty = False
    Output = []
    while not failedQueueEmpty or not completedQueueEmpty:
        try:
            if not failedQueueEmpty:
                failedTask = failedQueue.get(False)
                # add failed entry in output
                ft = {
                    'source': failedTask.url,
                    'error': failedTask.error
                    # ,'status' : 'failed'
                }
                if failedTask.itemId is not None:
                    ft['itemId'] = failedTask.itemId
                Output.append(ft)
        except queue.Empty:
            failedQueueEmpty = True

        try:
            if not completedQueueEmpty:
                completedTask = completedQueue.get(False)
                # add success entry in output
                ct = {'source': completedTask.url, 'itemId': completedTask.itemId, 'state': completedTask.state}

                Output.append(ct)
        except queue.Empty:
            completedQueueEmpty = True

    return Output
