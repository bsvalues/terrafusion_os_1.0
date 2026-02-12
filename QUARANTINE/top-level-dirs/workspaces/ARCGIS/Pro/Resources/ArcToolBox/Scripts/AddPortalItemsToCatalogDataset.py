"""-------------------------------------------------------------------------
    Tool:               Add Items to Catalog Dataset (Data Management Tools)
    Source Name:        AddItemsToCatalogDataset.py
    Version Added:      ArcGIS Pro 3.1
    Author:             Esri, Inc.    
    Description:        Adds items to catalog Dataset.
    Last Updated Ver:   ArcGIS Pro 3.1
------------------------------------------------------------------------"""
import arcpy
import CatalogDatasetUtil as cdutils
import concurrent.futures
import json
from math import floor, ceil
from arcgis.gis import GIS
from arcgis.auth import ArcGISProAuth, EsriSession

# Class representing a portal item, with relevant helper functions
class PortalItem:
    descProperties = ["extent","fullExtent", "minScale", "maxScale", "layers", "serviceVersion"]

    def __init__(self, catalogItemDesc, outSRS, portalUrl):
        self.itemURL = catalogItemDesc['url']
        self.inSRS = None
        self.outSRS = outSRS
        self.itemType = catalogItemDesc['type']
        self.itemId = catalogItemDesc['id']
        self.itemTitle = catalogItemDesc['title']
        self.projectedPolygon = None
        self.catalogItemDesc = catalogItemDesc
        self.portalUrl = portalUrl
        
        computeFootprintFromTemplate = True
        if self.itemType == 'Scene Service':
            serviceVersion = catalogItemDesc['serviceVersion']
            # for services at or after 1.8 service version fullExtent is reliable so use it
            useZ = serviceVersion is not None and len(serviceVersion) > 0 and (float(serviceVersion) >= 1.8)

            layers = catalogItemDesc['layers']
            if  layers:
                self.footprintHeight, self.footprint = PortalItem.buildSceneServiceFootprint(useZ, layers, self.outSRS)
                if self.footprint:
                    self.itemExtent = self.footprint.extent
                    computeFootprintFromTemplate = False
            if not useZ:

                arcpy.AddIDMessage("INFORMATIVE", 3945, self.itemTitle)

        if computeFootprintFromTemplate or self.itemExtent is None:
            jsonExtent = catalogItemDesc.get("fullExtent") or self.catalogItemDesc['extent']
            if jsonExtent is None:
                raise Exception(arcpy.GetIDMessage(3695))
            self.itemExtent =  cdutils.CatalogDataset.build_extent(jsonExtent)
            hasZ = self.itemExtent.ZMin is not None or self.itemExtent.ZMax is not None
            footprintGen = cdutils.Footprint(self.itemExtent, self.outSRS, hasZ)
            self.footprintHeight,self.footprint = footprintGen.get_footprint_info()
            
        #check whether the item is within the extent
        env_extent = arcpy.env.extent
        if not PortalItem.satisfiesExtentEnv(self.itemExtent,outSRS):
            raise Exception(f"OutsideExtentEnv")

        self.drawOrder = 4000
        self.minScale = catalogItemDesc['minScale']
        self.maxScale = catalogItemDesc['maxScale']

    @staticmethod
    def __getAgreggatedServiceResources(layerURL, session, queryParams=None):
        if not queryParams:
            queryParams = {}
        try:
            queryParams.update({'f': 'json'})
            response = session.get(layerURL, params = queryParams, timeout = 3)
        except Exception as e:
            return {'error':{'message':str(e)}}
        try:
            responseJSON = response.json()
            # For voxel, layer information is a <SceneServer>/layer resource,
            # so aggregate that resource for extent metadata needed            
            if 'layer' not in responseJSON:
                if ('layerType' in responseJSON) and (responseJSON['layerType'] == "Voxel") :
                    layerResponse = session.get(layerURL+"/layer", params = queryParams, timeout = 3)
                    layerJSON = layerResponse.json()
                    responseJSON['layers'] = [layerJSON]
        except Exception as e:
            return {'error':{'message':str(e)}}
        return responseJSON

    # Gets a dictionary with necessary item info to create the PortalItem
    @staticmethod
    def getCatalogItemDesc(item, session, portalUrl):
        catalogItemDesc = {}
        try:
            query_params = {}
            catalogItemDesc = {"url" : item.url, "title" : item.title, "id" : item.id, "type" : item.type}
            if item.type in AddPortalItemsToCatalogDataset.ogcItemTypes:
                dataURL = '{}/sharing/rest/content/items/{}/data'.format(portalUrl, item.id)
                response = session.get(dataURL, params={'f':'json'})
                responseJSON = None
                try:
                    responseJSON = response.json()
                    if not responseJSON or responseJSON.get('error'):
                        raise Exception(arcpy.GetIDMessage(3704))
                    responseDesc = {k : responseJSON.get(k) for k in PortalItem.descProperties}
                    if not (responseDesc.get('fullExtent') or responseDesc.get('extent')):
                        raise Exception(arcpy.GetIDMessage(3695))
                    catalogItemDesc.update(responseDesc)
                except:
                    if item.extent:
                        xMin, yMin, xMax, yMax = item.extent[0][0], item.extent[0][1], item.extent[1][0], item.extent[1][1]
                        if PortalItem.isExtentWithinWGS84(xMin, yMin, xMax, yMax):
                            catalogItemDesc['extent'] = {'xmin' : xMin,
                                                         'ymin' : yMin,
                                                         'xmax' : xMax,
                                                         'ymax' : yMax,
                                                         'spatialReference' : {'wkid' : 4326}}
                            catalogItemDesc['minScale'] = 0
                            catalogItemDesc['maxScale'] = 0
            else:
                responseJSON = PortalItem.__getAgreggatedServiceResources(item.url, session, queryParams=query_params)
                if not responseJSON or responseJSON.get('error'):
                    if responseJSON and responseJSON.get('error'):
                        catalogItemDesc["error"] = responseJSON.get('error')
                    else:
                        catalogItemDesc["error"] = {'message':'Unknown error'}
                    return catalogItemDesc
                responseDesc = {k : responseJSON.get(k) for k in PortalItem.descProperties}                

                catalogItemDesc.update(responseDesc)
            return catalogItemDesc
        except Exception as e:
            catalogItemDesc["error"] = str(e)
        return catalogItemDesc

    @staticmethod
    def isExtentWithinWGS84(xmin, ymin, xmax, ymax):
        return (ceil(xmin) >= -180) and (ceil(ymin) >= -90) and (floor(xmax) <= 180) and (floor(ymax) <= 90)

    @staticmethod
    def buildSceneServiceFootprint(useZ, jsonLayers, outSRS):
        unionFootprint = None
        maxFootprintHeight = 0

        for layer in jsonLayers:
            layerExtent = None
            if (layer.get('fullExtent') or layer.get('extent')):
                jsonExtent = layer.get("fullExtent") or layer.get('extent')
                layerSR = layer.get('spatialReference')
                if (not jsonExtent.get('spatialReference')) and (layerSR):
                    jsonExtent['spatialReference'] = layerSR
                layerExtent =  cdutils.CatalogDataset.build_extent(jsonExtent, useZ)
            else:
                layerExtent = PortalItem.buildExtentFromSceneLayer(layer, useZ)
            if not layerExtent:
                raise Exception(arcpy.GetIDMessage(3695))
            if layerExtent and layerExtent.spatialReference is None:
                raise Exception(arcpy.GetIDMessage(3695))
            hasZ = layerExtent.ZMin is not None or layerExtent.ZMax is not None
            footprintGen = cdutils.Footprint(layerExtent, outSRS, hasZ)
            footprintHeight, footprint = footprintGen.get_footprint_info()
            if footprint is None:
                continue
            if not unionFootprint:
                unionFootprint = footprint
            else:
                unionFootprint.union(footprint)
            maxFootprintHeight = max(footprintHeight, maxFootprintHeight)
        return (maxFootprintHeight, unionFootprint)
    
    @staticmethod
    def buildExtentFromSceneLayer(layer, useZ):
        extent = None
        jsonSRS = None        

        if layer.get('spatialReference'):
            jsonSRS = layer['spatialReference']
        
        if jsonSRS is None:
            raise Exception(arcpy.GetIDMessage(3705))
        
        jsonFullExtent = layer.get('fullExtent')
        if jsonFullExtent :
           extent = cdutils.CatalogDataset.build_extent(jsonFullExtent, useZ)

        if extent is None and layer.get('store') and layer['store'].get('extent'):
            srs = cdutils.CatalogDataset.build_sr(jsonSRS)
            extent = arcpy.Extent(layer['store']['extent'][0], layer['store']['extent'][1],
                                  layer['store']['extent'][2], layer['store']['extent'][3],
                                  spatial_reference = srs)            

        return extent
    
    @staticmethod
    def satisfiesExtentEnv(itemExtent, outSRS):
        env_extent = arcpy.env.extent
        if env_extent and not isinstance(env_extent,str):
            env_extent = env_extent.projectAs(outSRS)
            item_extent = itemExtent.projectAs(outSRS)
            return item_extent.within(env_extent)
        return True

    # Gets row (in list format) to insert into Catalog Dataset
    def getRow(self):
        return [
                self.footprint,
                self.itemTitle,
                json.dumps(dict(itemId = self.itemId, portalUrl = self.portalUrl)),
                self.itemType,
                self.minScale,
                self.maxScale,
                self.drawOrder,
                self.footprintHeight
                ]

class PortalConn:
    def __init__(self, portalUrl):
        self.portalUrl = portalUrl
        self.username = None
        self.orgID = None
        self.gis = None
        if portalUrl is not None:
            self.gis = GIS('pro')
            portalDesc = arcpy.GetPortalDescription()
            if portalDesc is not None:
                user = portalDesc.get('user')
                if user is not None:
                    self.username = user.get('username')
                self.orgID = portalDesc.get('id')
        return
    
    def getPortalUrl(self):
        return self.portalUrl

    def getGIS(self):
        return self.gis

    def getUsername(self):
        return self.username

    def getOrgID(self):
        return self.orgID

class AddPortalItemsToCatalogDataset(object):
    itemTypeMap = {"FEATURE_SERVICE" : "Feature Service",
                  "MAP_SERVICE" : "Map Service", 
                  "IMAGE_SERVICE" : "Image Service", 
                  "SCENE_SERVICE" : "Scene Service", 
                  "VECTOR_TILE_SERVICE" : "Vector Tile Service",
                  "WFS" : "WFS",
                  "WMS" : "WMS",
                  "WMTS" : "WMTS"}
    ogcItemTypes = ["WFS", "WMS", "WMTS"]
    accessLevelMap = {"PUBLIC" : "public",
                      "ORG" : "org",
                      "SHARED" : "shared",
                      "PRIVATE" : "private"}

    def __init__(self):
        self.catalog_dataset = arcpy.GetParameterAsText(0)
        self.item_types = set([AddPortalItemsToCatalogDataset.itemTypeMap.get(k) for k in arcpy.GetParameter(1)])
        self.content_filter = arcpy.GetParameter(2)
        self.access_filter = AddPortalItemsToCatalogDataset.accessLevelMap.get(arcpy.GetParameter(5))
        self.portalConn = PortalConn(arcpy.GetActivePortalURL())
        return

    def getGroup(self, groupName):
        gis = self.portalConn.getGIS()
        groups = gis.users.me.groups
        filteredGroups = [g for g in groups if g.title == groupName]
        if filteredGroups:
            return filteredGroups[0]
        return None

    def getFolder(self, folderName):
        gis = self.portalConn.getGIS()
        loggedInUser = gis.users.me
        folders = loggedInUser.folders
        filteredFolders = [f for f in folders if f['title'] == folderName]
        if filteredFolders:
            return filteredFolders[0]
        return None

    def getGroupIDs(self):
        groupNames = arcpy.GetParameter(4)
        groupIDs = []
        if (self.content_filter == "MY_GROUPS"):
            if not groupNames:        
                gis = self.portalConn.getGIS()
                groups = gis.users.me.groups
                groupNames = [group.title for group in groups]
            for groupName in groupNames:
                group = self.getGroup(groupName)
                groupIDs.append(group.id)
        return groupIDs

    def getFolderIDs(self):
        folderNames = arcpy.GetParameter(3)
        folderIDs = []
        if (self.content_filter == "MY_CONTENT"):
            if len(folderNames) > 0:
                for folderName in folderNames:
                    folder = self.getFolder(folderName)
                    folderIDs.append(folder["id"])
        return folderIDs

    # Get the full query to filter by item types, groups and folders
    def buildQuery(self, itemTypes):
        groupIDs = self.getGroupIDs()
        groupQuery = ''
        for groupID in groupIDs:
            if len(groupQuery) == 0:
                groupQuery += 'group: ({}'.format(groupID)
            else:
                groupQuery += ' OR {}'.format(groupID)
        if len(groupQuery) > 0:
            groupQuery += ')'
        folderIDs = self.getFolderIDs()
        folderQuery = ''
        for folderID in folderIDs:
            if len(folderQuery) == 0:
                folderQuery += 'ownerfolder: ({}'.format(folderID)
            else:
                folderQuery += ' OR {}'.format(folderID)
        if len(folderQuery) > 0:
            folderQuery += ')'
        

        typeQuery = ''
        if not itemTypes:
            itemTypes = AddPortalItemsToCatalogDataset.itemTypeMap.values()
        for itemType in itemTypes:
            if len(typeQuery) == 0:
                typeQuery = '(type: (\"' + itemType + '\"'
            else:
                typeQuery += ' OR \"{}\"'.format(itemType)
        if len(typeQuery) > 0:
            typeQuery += '))'
        query = ''
        if len(groupQuery) > 0:
            query += (groupQuery + ' AND ')
        if len(folderQuery) > 0:
            query += (folderQuery + ' AND ')

        query += typeQuery
        query +=' -typekeywords:("CatalogLayer" OR "Elevation 3D Layer")'

        username = self.portalConn.getUsername()
        orgID = self.portalConn.getOrgID()
        if (username is not None) and (orgID is not None):
            contentQuery = ''
            if (self.content_filter == "MY_CONTENT"):
                contentQuery = ' AND owner: {} AND orgid: {}'.format(username, orgID)
            elif  (self.content_filter == "MY_ORGANIZATION"):
                contentQuery = ' AND orgid: {}'.format(orgID)
            query += contentQuery
        
        accessQuery = ' AND access: {}'.format(self.access_filter)
        query += accessQuery

        return query

    # Queries for items in the portal and adds them to the catalog dataset
    def addPortalItems(self, itemTypes):
        datasetDesc = arcpy.Describe(self.catalog_dataset)

        supportsVersion = hasattr(datasetDesc,'extensionProperties') and hasattr(datasetDesc.extensionProperties, 'version')
        if supportsVersion and datasetDesc.extensionProperties.version < cdutils.CatalogDataset.curr_ver:
            arcpy.AddIDMessage("ERROR",3843, self.catalog_dataset)
            return 0

        #check versioning and request to update
        outSRS = datasetDesc.spatialReference
        rowCount = 0
        skippedRowCount = 0
        edit = cdutils.CatalogDataset.start_editing(self.catalog_dataset)
        try:
            gis = self.portalConn.getGIS()
            importFields = cdutils.CatalogDataset.fields
            with arcpy.da.InsertCursor(self.catalog_dataset, importFields) as fcCursor:
                query = self.buildQuery(itemTypes)
                totalItemCount = gis.content.advanced_search(query, return_count=True)
            
                if totalItemCount == 0:
                    arcpy.AddIDMessage("INFORMATIVE",86603,"0")
                    return rowCount
                else:
                    arcpy.AddIDMessage("INFORMATIVE",86603,str(totalItemCount))
                pageSize = 100
                itemCount = 1
                while (itemCount <= totalItemCount):
                    res = gis.content.advanced_search(query, max_items=pageSize, start=itemCount)
                    items = res.get('results')
                    itemCount += len(items)

                    if not items:
                        return rowCount

                    with EsriSession(auth=ArcGISProAuth(), verify_cert=True) as session:
                        max_workers = cdutils.CatalogDataset.max_workers()
                        with concurrent.futures.ThreadPoolExecutor(max_workers) as executor:
                            jobs = {executor.submit(PortalItem.getCatalogItemDesc, item, session, self.portalConn.getPortalUrl()): item for item in items}
                            for future in concurrent.futures.as_completed(jobs):
                                catalogItemDesc = future.result()
                                if catalogItemDesc and not ("error" in catalogItemDesc):
                                    try:
                                        if cdutils.CatalogDataset.find_item(self.catalog_dataset, self.lookup_table if hasattr(self, 'lookup_table') else None, catalogItemDesc['id'], "", False):
                                             arcpy.AddIDMessage("INFORMATIVE",3961,catalogItemDesc['title'])
                                             skippedRowCount += 1
                                             continue
                                        portalItem = PortalItem(catalogItemDesc, outSRS, self.portalConn.getPortalUrl())
                                        row = portalItem.getRow()
                                        if row:
                                            fcCursor.insertRow(row)
                                            rowCount += 1
                                            if hasattr(self, 'lookup_table'):
                                                self.lookup_table.add(catalogItemDesc['id'])
                                    except Exception as e:
                                        if str(e) == "OutsideExtentEnv":
                                            arcpy.AddIDMessage("WARNING", 3707, catalogItemDesc["title"], arcpy.GetIDMessage(3696))
                                        else:
                                            arcpy.AddIDMessage("WARNING", 3707, catalogItemDesc["title"], str(e))
                                        continue
                                elif catalogItemDesc is not None:
                                    arcpy.AddIDMessage("WARNING", 3707,catalogItemDesc["title"], catalogItemDesc["error"]["message"])
        except Exception as e:
            arcpy.AddIDMessage("ERROR",999998)
            arcpy.AddError(str(e))
        cdutils.CatalogDataset.stop_editing(edit)
        
        if skippedRowCount > 0:
            arcpy.AddIDMessage("INFORMATIVE",3960,str(skippedRowCount))

        return rowCount

    def execute(self):
        # Build lookup table for finding duplicates
        self.lookup_table = cdutils.CatalogDataset.getCatalogDatasetLookupTable(self.catalog_dataset)
        if self.portalConn.getGIS() and self.portalConn.getUsername():
            count = self.addPortalItems(self.item_types)
            if count > 0:
                #manually recalculate extent since gp doesn't do it.
                try:
                    arcpy.management.RecalculateFeatureClassExtent(self.catalog_dataset)
                except:
                    pass
                arcpy.AddIDMessage("INFORMATIVE",86602,str(count))
            else:
                arcpy.AddIDMessage("WARNING",3708)
        else:
            arcpy.AddIDMessage("ERROR",2119)

        return
    
if __name__ == '__main__':
    addPItems = AddPortalItemsToCatalogDataset()
    addPItems.execute()