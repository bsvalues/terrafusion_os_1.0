# parameter 0 - mapareaitemId 
# parameter 1 - layerstoadd
# parameter  2 - layerstoingore
# parameter 3 - OutputName (extent?,folderId,bookmark?)
# parameter 4 - Packages

import arcpy
import json
import MapAreaUtil
import hostedgp as agolgp
from uuid import uuid4
from MapAreaServiceTaskBase import OfflineException

try:
    hgp = agolgp.HostedGP(None, None, False)
    mapAreaItemId = arcpy.GetParameterAsText(0)
    # get map area item
    try:
        arcpy.AddMessage(f"Fetching map area item:{mapAreaItemId}")
        mapAreaItem = hgp.GetItem(mapAreaItemId)
        # make a generic rest call
        itemUrl = 'content/users/' + mapAreaItem['owner']
        if 'ownerFolder' in mapAreaItem and mapAreaItem['ownerFolder'] is not None \
                and len(mapAreaItem['ownerFolder']) > 0:
            itemUrl = itemUrl + "/" + mapAreaItem['ownerFolder']
        itemUrl = itemUrl + '/items/' + mapAreaItemId
        resp = hgp.GenericSharingRequest(itemUrl)
        mapAreaItem = resp['item']
        if 'sharing' in resp:
            mapAreaItem['sharing'] = resp['sharing']
    except Exception as err:
        raise OfflineException('ItemAccessError', {'itemId': mapAreaItemId})

    if mapAreaItem['type'] != 'Map Area':
        raise OfflineException('ItemTypeError', {'itemId': mapAreaItemId, 'type': mapAreaItem['type']})

    # property has extent
    if 'properties' not in mapAreaItem or mapAreaItem['properties'] is None:
        raise OfflineException('ItemPropMissing', {'itemId': mapAreaItemId, 'properties': 'extent or area'})

    mapAreaProperties = mapAreaItem['properties']
    if 'extent' not in mapAreaProperties and 'area' not in mapAreaProperties:
        raise OfflineException('ItemPropMissing', {'itemId': mapAreaItemId, 'properties': 'extent or area'})
    # get related map item
    path, param = MapAreaUtil.GetAreaToMapParam(mapAreaItemId)
    items = hgp.GenericSharingRequest(path, param)
    if 'total' not in items or items['total'] == 0:
        raise OfflineException('MapAreaMissingMap', {'itemId': mapAreaItemId})
    if items['total'] > 1:
        raise OfflineException('MapAreaMissingMap', {'itemId': mapAreaItemId})

    mapItem = items['relatedItems'][0]
    arcpy.AddMessage(f"Downloading map JSON:{mapItem['id']}")
    mapItemData = hgp.GetItemDataAsJSON(mapItem['id'])
    if mapItemData is None:
        raise OfflineException('MapMissingData', {'itemId': mapItem['id']})

    # get existing packages
    arcpy.AddMessage(f"Fetching existing packages for map area:{mapAreaItemId}")
    existingPackages, existingPackagesIndex = MapAreaUtil.ServiceObjFromPackages(hgp, mapAreaItem)
    # setup layers
    layers = []
    layersIndex = {}
    additionalLayers = []
    layersToIgnore = []
    # get layers to ignore
    layersToIgnoreJSON = arcpy.GetParameterAsText(1)
    if layersToIgnoreJSON is not None and len(layersToIgnoreJSON) > 0:
        layersToIgnore = json.loads(layersToIgnoreJSON.replace('\\n', ''))
    # do Map Layers
    arcpy.AddMessage("Get services from map JSON")
    layers, layersIndex = MapAreaUtil.HandleMapLayers(hgp, mapItemData, layersToIgnore)
    # do Tile Layers
    tileLayers = []
    tilelayersJSON = str(arcpy.GetParameterAsText(2))

    if tilelayersJSON is not None and len(tilelayersJSON) > 0:
        tileLayers = json.loads(tilelayersJSON.replace('\\n', ''))

    if len(tileLayers) > 0:
        arcpy.AddMessage("Add additional tile services to map services")
        MapAreaUtil.MergeAdditionalServices(tileLayers, layers, layersIndex)
    # do Additional Services
    paramJSON = arcpy.GetParameterAsText(3)
    if paramJSON is not None and len(paramJSON) > 0:
        additionalLayers = json.loads(paramJSON.replace('\\n', ''))
    if len(additionalLayers) > 0:
        arcpy.AddMessage("Add additional feature services to map services")
        MapAreaUtil.MergeAdditionalServices(additionalLayers, layers, layersIndex)

    # create service object from layers
    serviceObj, serviceObjIndex = MapAreaUtil.ServiceObjFromServices(hgp, mapAreaItem, layers)

    # if any existing package
    packagesDeleted = []
    packagesUnchanged = []
    serviceObjectsUnchanged = []  # actual object list to be removed before calling createupdatepackage
    existingPackageUnchanged = []  # save for setuprefreshcall

    outputFailures = False  # handle failures during del existing items
    if existingPackages is not None and len(existingPackages) > 0:
        for packageUrl in existingPackagesIndex:
            existingObj = existingPackages[existingPackagesIndex[packageUrl]]
            if packageUrl in serviceObjIndex:
                #  if found in new list, compare                 
                newObj = serviceObj[serviceObjIndex[packageUrl]]
                compResult = False
                error = None
                try:
                    compResult = newObj.Compare(existingObj)
                except Exception as err:
                    # we cant compare, put it in unchanged list with error?
                    compResult = True
                    error = str(err)

                if compResult:
                    # same as new add to unchanged list
                    unChangedObj = {'source': existingObj.url, 'itemId': existingObj.item['id'], 'state': 'unchanged'}
                    if error is not None:
                        unChangedObj['error'] = error

                    packagesUnchanged.append(unChangedObj)
                    # serviceObj.remove(newObj)  don't remove it, causes indexing issues in this loop
                    serviceObjectsUnchanged.append(newObj)
                    # save for checking refresh schedule
                    existingPackageUnchanged.append(existingObj)
                    continue
            # layer got removed from map or changed, delete the old package
            packagesDeleted.append({'source': existingObj.url, 'itemId': existingObj.item['id'], 'state': 'deleted'})
            try:
                existingObj.DeletePackageItem()
            except Exception as err:
                arcpy.AddError(str(err))
                outputFailures = True

    output = []
    if not outputFailures:
        for unchangedObj in serviceObjectsUnchanged:
            serviceObj.remove(unchangedObj)

        for existingUnchangedObj in existingPackageUnchanged:
            try:
                if "packageRefreshSchedule" in mapAreaProperties:
                    existingUnchangedObj.SetupPackageRefreshJob(mapAreaProperties['packageRefreshSchedule'])
            except Exception as err:
                arcpy.AddWarning(str(err))

        # setup objects if area is stored in resource
        if 'area' in mapAreaProperties and 'resource' in mapAreaProperties['area'] and len(serviceObj) > 0:
            # download to a file and update the serviceObj
            areaJSON = None
            try:
                fileName = arcpy.env.scratchFolder + "/" + str(uuid4()) + ".txt"
                arcpy.AddMessage(f"Fetching area from map area item resource:{mapAreaProperties['area']['resource']}")
                hgp.GetResourceAsFile(mapAreaProperties['area']['resource'], fileName, mapAreaItemId)
                with open(fileName) as f:
                    areaJSON = json.load(f)
            except Exception as err:
                #
                raise err
            if areaJSON is None:
                raise OfflineException("MissingProperty", {'name': 'area resource'})
            # add the resource/itemId so that service object can eventually store by ref
            areaJSON['resource'] = mapAreaProperties['area']['resource']
            if 'itemId' in mapAreaProperties['area']:
                areaJSON['itemId'] = mapAreaProperties['area']['itemId']

            for sObject in serviceObj:
                sObject.area = areaJSON

        output = MapAreaUtil.CreateUpdatePackages(serviceObj)

        # get all create/update items and add jobs for missing ones
        if "packageRefreshSchedule" in mapAreaProperties:
            for service in serviceObj:
                try:
                    service.SetupPackageRefreshJob(mapAreaProperties['packageRefreshSchedule'])
                except Exception as err:
                    arcpy.AddWarning(str(err))

        output.extend(packagesDeleted)
        output.extend(packagesUnchanged)
        arcpy.SetParameterAsText(4, json.dumps(output, ensure_ascii=False))
        # go through all to check for errors, set map area item status accordingly
        for val in output:
            if 'error' in val:
                outputFailures = True

    updateMapAreaItem = False
    if outputFailures:
        if 'status' not in mapAreaProperties or mapAreaProperties['status'] != 'failed':
            mapAreaProperties['status'] = 'failed'
            updateMapAreaItem = True
    else:
        if 'status' not in mapAreaProperties or \
         (mapAreaProperties['status'] == 'failed' or mapAreaProperties['status'] == 'processing'):
            mapAreaProperties['status'] = 'complete'
            updateMapAreaItem = True

    if updateMapAreaItem:
        updateValues = {'properties': mapAreaProperties}
        prop = {}
        if 'ownerFolder' in mapAreaItem and mapAreaItem['ownerFolder'] is not None and\
                len(mapAreaItem['ownerFolder']) > 0:
            prop['folderId'] = mapAreaItem['ownerFolder']
        arcpy.AddMessage(f"Updating overall status property on map area item:{mapAreaItemId}")
        hgp.UpdateItem(mapAreaItemId, updateValues, prop)

except Exception as err:
    arcpy.AddError(str(err))
