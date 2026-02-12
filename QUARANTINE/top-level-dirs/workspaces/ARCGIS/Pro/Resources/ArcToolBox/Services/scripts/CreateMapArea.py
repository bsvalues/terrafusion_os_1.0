import arcpy
import json
import MapAreaUtil

from MapAreaServiceTaskBase import OfflineException
from MapAreaServiceTaskBase import RESTHandler
from MapAreaServiceTaskBase import ServiceTaskBase
from MapAreaServiceTaskBase import ProcessExtent, ProcessPolygon

import hostedgp as agolgp
from uuid import uuid4
from datetime import datetime, timedelta
from math import floor

# MapItemId
# bookmark
# extent
# areaType
#   BOOKMARK,ENVELOPE,POLYGON
# area
# {'name' : 'bookmarkname' or 'xmin' ... or 'rings' ...}
# outputName(folderId)
# mapAreaItemId(output)

# {
# "resource" : "resourcename",
# or
# "polygon" : {"rings": {},"spatialreference":{} }
# }

try:
    hgp = agolgp.HostedGP(None, None, False)
    mapBookmark = None
    mapItemSharing = None
    MAX_POLYGON_PROP_SIZE = 1  # force to create resource
    MAX_POLYGON_LIMIT = 100000

    conn = RESTHandler(hgp, None)
    # get map item id
    mapItemId = arcpy.GetParameterAsText(0)

    mapItem = conn.GetItem(mapItemId)

    # check item type
    if 'type' not in mapItem or mapItem['type'] != 'Web Map':
        raise OfflineException('InvalidParam', {'name': 'mapItemId'})

    # make a generic item rest call for sharing 
    itemUrl = 'content/users/' + mapItem['owner']
    if 'ownerFolder' in mapItem and mapItem['ownerFolder'] is not None and len(mapItem['ownerFolder']) > 0:
        itemUrl = itemUrl + "/" + mapItem['ownerFolder']
    itemUrl = itemUrl + '/items/' + mapItemId

    try:
        resp = hgp.GenericSharingRequest(itemUrl)
    except Exception:
        raise OfflineException('ItemAccessError', {'itemId': mapItemId})

    mapItem = resp['item']
    if 'sharing' in resp:
        mapItemSharing = resp['sharing']

    # bookmark parameter
    mapBookmark = arcpy.GetParameterAsText(1)

    # extent parameter
    extent = arcpy.GetParameterAsText(2)

    # Area Type parameter
    areaType = arcpy.GetParameterAsText(3)

    # Area Parameter
    area = arcpy.GetParameterAsText(4)
    if area is not None and len(area) > 0:
        if len(area) > MAX_POLYGON_LIMIT:
            raise OfflineException('InvalidParam', {'name': 'area'})
        if areaType is None or len(areaType) == 0:
            raise OfflineException('AreaMissing', {})

    # Validate input
    if (mapBookmark is None or len(mapBookmark) == 0) and (extent is None or len(extent) == 0)\
            and (area is None or len(area) == 0):
        raise OfflineException('AreaMissing', {})

    try:
        mapItemData = hgp.GetItemDataAsJSON(mapItemId)
    except Exception:
        raise OfflineException('MapMissingData', {'itemId': mapItemId})

    # preference polygon then extent then bookmark
    extentJSON = None
    areaJSON = None
    storeAsResource = False
    if area is not None and len(area) > 0:
        tempJSON = None
        try:
            tempJSON = json.loads(area.replace('\\n', ''))
        except Exception:
            raise OfflineException('InvalidParam', {'name': 'Area'})

        if tempJSON is None:
            raise OfflineException('InvalidParam', {'name': 'Area'})

        if areaType == "BOOKMARK":
            if 'name' not in tempJSON:
                raise OfflineException('InvalidParam', {'name': 'Area'})
            else:
                mapBookmark = tempJSON["name"]
                try:
                    extentJSON = MapAreaUtil.GetBookmarkExtent(mapItemData, mapBookmark)
                except Exception:
                    raise OfflineException('BookmarkMissing', {'itemId': mapItemId, 'bookmark': mapBookmark})
                if extentJSON is None:
                    raise OfflineException('BookmarkMissing', {'itemId': mapItemId, 'bookmark': mapBookmark})
        elif areaType == "ENVELOPE":
            extentJSON = ProcessExtent(tempJSON)
            if extentJSON is None:
                raise OfflineException('InvalidParam', {'name': 'Area'})
        elif areaType == "POLYGON":
            extentJSON, areaJSON = ProcessPolygon(tempJSON)
            if areaJSON is None:
                raise OfflineException('InvalidParam', {'name': 'Area'})
                # check length
            if len(area) > MAX_POLYGON_PROP_SIZE:
                storeAsResource = True
            # make them None to release memory
            area = None
            tempJSON = None

    elif extent is not None and len(extent) > 0:
        try:
            extentJSON = json.loads(extent.replace('\\n', ''))
        except Exception:
            raise OfflineException('InvalidParam', {'name': 'extent'})
        # extent is always returned
        extentJSON = ProcessExtent(extentJSON)
        if extentJSON is None:
            raise OfflineException('InvalidParam', {'name': 'extent'})
    elif mapBookmark is not None and len(mapBookmark) > 0:
        try:
            extentJSON = MapAreaUtil.GetBookmarkExtent(mapItemData, mapBookmark)
        except Exception:
            raise OfflineException('BookmarkMissing', {'itemId': mapItemId, 'bookmark': mapBookmark})
        if extentJSON is None:
            raise OfflineException('BookmarkMissing', {'itemId': mapItemId, 'bookmark': mapBookmark})

    # get existing map area's of map
    path, param = MapAreaUtil.GetMapToAreaParam(mapItemId)
    existingAreas = hgp.GenericSharingRequest(path, param)

    found = False
    foundId = None
    if 'total' in existingAreas and existingAreas['total'] > 0:
        # search existing ones for bookmark property with that name
        # get the property (helperServices::packaging::maxMapAreaItemsLimit)
        maxAreas = 16
        try:
            selfJson = hgp.GetSelf()
            if "helperServices" in selfJson and "packaging" in selfJson["helperServices"] and \
                "maxMapAreaItemsLimit" in selfJson["helperServices"]["packaging"]:
                maxAreas = selfJson["helperServices"]["packaging"]["maxMapAreaItemsLimit"]
        except Exception:
            pass

        if existingAreas['total'] >= maxAreas:
            raise OfflineException('ExceedingMapAreas', {'limit': maxAreas})

        for item in existingAreas['relatedItems']:
            if 'properties' in item:
                itemProps = item['properties']
                # first match extent, then further check if polygon needs to be compared
                if 'extent' in itemProps and extentJSON is not None:
                    newExtent = arcpy.Extent(extentJSON['xmin'], extentJSON['ymin'],
                                             extentJSON['xmax'], extentJSON['ymax'])
                    itemExtent = arcpy.Extent(itemProps['extent']['xmin'], itemProps['extent']['ymin'],
                                              itemProps['extent']['xmax'], itemProps['extent']['ymax'])
                    if newExtent.equals(itemExtent):
                        # check if this was for polygon
                        if 'area' in itemProps and areaJSON is not None:
                            itemArea = None
                            # check if polygon is in resource
                            if 'resource' in itemProps['area']:
                                # down load it to temp file
                                fileName = arcpy.env.scratchFolder + '/' + str(uuid4()) + '.txt'
                                hgp.GetResourceAsFile(itemProps['area']['resource'], fileName, item['id'])
                                try:
                                    with open(fileName, "r") as out_file:
                                        itemArea = json.load(out_file)

                                except Exception as err:
                                    #  raise OfflineException('GetResourcesFailed', {'itemId': item['id'],
                                    #  'error': str(err)})
                                    pass  # ignore this exception
                            else:
                                itemArea = itemProps['area']
                            # use arcpy to match polygon
                            # first check for polygon
                            if 'polygon' in itemArea and 'polygon' in areaJSON:
                                # one or both is polygon. compare polygon
                                newPoly = arcpy.AsShape(areaJSON['polygon'], True)
                                itemPoly = arcpy.AsShape(itemArea['polygon'], True)

                                if newPoly.equals(itemPoly):
                                    found = True
                                    foundId = item['id']
                                    break
                        else:
                            found = True
                            foundId = item['id']
                            break

    if found:
        # return already exists error
        raise OfflineException('MapAreaExists', {'itemId': foundId})

    # handle output name
    #    tags,title,type keywords,folderId
    tags = ""
    title = mapItem['title'] + "-" + str(uuid4())
    itemType = 'Map Area'
    typeKeywords = 'Map Area'  # + "," + "ReferenceItem#" + mapItemId
    description = None
    snippet = None
    folderId = None
    packageRefreshSchedule = None

    if 'ownerFolder' in mapItem:
        folderId = mapItem['ownerFolder']

    outputName = arcpy.GetParameterAsText(5)
    if outputName is not None and len(outputName) > 0:
        outputDict = json.loads(outputName.replace('\\n', ''))
        if 'tags' in outputDict:
            tags = outputDict['tags']
        if 'title' in outputDict:
            title = outputDict['title']
        if 'description' in outputDict:
            description = outputDict['description']
        if 'snippet' in outputDict:
            snippet = outputDict['snippet']
        if 'folderId' in outputDict:
            folderId = outputDict['folderId']
        if 'packageRefreshSchedule' in outputDict and len(outputDict['packageRefreshSchedule']) > 0:
            packageRefreshSchedule = outputDict['packageRefreshSchedule']

    # create Map Area Item
    # extent is always there for older clients
    mapAreaItem = {'title': title, 'type': itemType, 'typeKeywords': typeKeywords, 'tags': tags,
                   'properties': {'status': 'processing', 'extent': extentJSON}}
    resourceFileName = None
    if storeAsResource:
        timestamp = floor((datetime.now() - datetime(1970, 1, 1)) / timedelta(seconds=1))
        resourceFileName = "geometry-" + str(timestamp) + ".json"
    # save polygon if there
    if areaJSON is not None:
        if storeAsResource:
            mapAreaItem['properties']['area'] = {'resource': 'area/' + resourceFileName}
        else:
            mapAreaItem['properties']['area'] = areaJSON

    # add relationship if sharing is none
    if mapItemSharing is None:
        mapAreaItem['relationshipType'] = 'Map2Area'
        mapAreaItem['originItemId'] = mapItemId

    serviceTaskBase = ServiceTaskBase(hgp, None, extentJSON, areaJSON, None)
    serviceTaskBase.HandleItemExtent()
    mapAreaItem['extent'] = serviceTaskBase.itemExtent
    mapAreaItem['spatialReference'] = serviceTaskBase.itemSRName

    if description is not None:
        mapAreaItem['description'] = description
    if snippet is not None:
        mapAreaItem['snippet'] = snippet

    if packageRefreshSchedule is not None:
        mapAreaItem['properties']['packageRefreshSchedule'] = packageRefreshSchedule

    props = {}
    if folderId is not None:
        props["folderId"] = folderId

    mapAreaItemId = conn.AddItem(mapAreaItem, props)

    # store Area as resource if required
    if storeAsResource:
        # save it as file then add the resource
        try:
            fileName = arcpy.env.scratchFolder + "/" + str(uuid4()) + ".txt"
            with open(fileName, "w") as f:
                json.dump(areaJSON, f)
            conn.AddResource(fileName, "area", None, resourceFileName, mapAreaItemId, folderId)
        except Exception as err:
            # delete the item
            try:
                conn.DeleteItem(mapAreaItemId, props)
            except Exception:
                pass
            raise err
    # do sharing
    if mapItemSharing is not None:
        isSharedWithEveryone = False
        isSharedWithOrg = False
        groups = None
        if 'access' in mapItemSharing:
            if mapItemSharing['access'] == 'public':
                isSharedWithEveryone = True
                isSharedWithOrg = True
            elif mapItemSharing['access'] == 'org':
                isSharedWithEveryone = False
                isSharedWithOrg = True
        if 'groups' in mapItemSharing:
            groups = mapItemSharing['groups']

        if isSharedWithEveryone or isSharedWithOrg or (groups is not None and len(groups) > 0):
            try:
                conn.ShareItem(mapAreaItemId, isSharedWithEveryone, isSharedWithOrg, groups, props)
            except Exception as err:
                # delete the item
                try:
                    conn.DeleteItem(mapAreaItemId, props)
                except Exception:
                    pass
                raise err

        # do relationship after sharing
        try:
            conn.AddRelationShip(mapItemId, mapAreaItemId, 'Map2Area')
        except Exception as err:
            # delete the item
            try:
                conn.DeleteItem(mapAreaItemId, props)
            except Exception:
                pass
            raise err

    # add Offline, Offline Map Areas to map type keywords
    mapKeywords = ""

    if 'typeKeywords' in mapItem:
        mapKeywords = mapItem['typeKeywords']

    if mapKeywords is None:
        mapKeywords = ""

    if not isinstance(mapKeywords, str):
        # assume list
        mapKeywords = ",".join(mapKeywords)
    updateMap = False
    if mapKeywords.find('Offline') < 0:
        mapKeywords = mapKeywords + ', Offline'
        updateMap = True

    if mapKeywords.find('Offline Map Areas') < 0:
        mapKeywords = mapKeywords + ', Offline Map Areas'
        updateMap = True
    if updateMap:
        try:
            prop = {}

            if 'ownerFolder' in mapItem and mapItem['ownerFolder'] is not None and len(mapItem['ownerFolder']) > 0:
                prop['folderId'] = mapItem['ownerFolder']

            conn.UpdateItem(mapItemId, {'typeKeywords': mapKeywords}, prop)
        except Exception:
            pass

    if mapAreaItemId is not None:
        arcpy.SetParameterAsText(6, mapAreaItemId)
    else:
        raise OfflineException('AddItemFailed', {'error': ""})

except Exception as err:
    arcpy.AddError(str(err))
