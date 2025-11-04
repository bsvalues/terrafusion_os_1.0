import arcpy
import os
import json
import math
import concurrent.futures
import locale
from arcgis.auth import EsriSession, ArcGISProAuth
from arcgis.auth._auth._token import ArcGISServerAuth
from arcpy import Extent
from arcpy import SpatialReference
from multiprocessing import cpu_count

class CatalogDataset(object):
    #current pro version
    curr_ver = 2

    #current field schema for catalog dataset
    fields = ['SHAPE@', 'cd_itemname', 'cd_itemsource', 'cd_itemtype',
        'cd_minscale', 'cd_maxscale', 'cd_draworder', 'cd_shapeheight']

    #dict of itemtypes and corresponding datatypes
    #remember to update descDatasetType_itemTypes for any new keys
    item_type_descDatasetType = {
        "FEATURE_CLASS": "FeatureClass",
        "MOSAIC_DATASET": "MosaicDataset",
        "LAS_DATASET": "LasDataset",
        "LAS_FILE": "LasDataset",
        "RASTER_DATASET": "RasterDataset",
        "CAD_DRAWING": "CadDrawing",
        "TIN":"Tin",
        "MAP_SERVICE":"MapServer",
        "FEATURE_SERVICE":"FeatureServer",
        "IMAGE_SERVICE":"ImageServer",
        "LAYER_FILE": "",  # no corresponding dataset type
        "BIM_FILE_WORKSPACE": "", # no corresponding dataset type
        "BIM_FILE_FLOORPLAN":"", #no corresponding dataset type
        "SCENE_LAYER_PACKAGE":"" #no corresponding dataset type
    }

    #dict of descDatasetType to itemTypes, same as above
    #helps to retrieve item types based on datasetType
    #remember to update item_type_descDatasetType for any new keys
    # Note: specifically deals with datasets and ignores files and workspaces
    #hence a smaller size than above dict
    descDatasetType_itemTypes = {
        "FeatureClass": "FEATURE_CLASS",
        "MosaicDataset": "MOSAIC_DATASET",
        "LasDataset": "LAS_DATASET",
        "RasterDataset": "RASTER_DATASET",
        "CadDrawing": "CAD_DRAWING",
        "Tin":"TIN",
        "MapServer":"Map Service",
        "FeatureServer":"Feature Service",
        "ImageServer":"Image Service"
    }

    @staticmethod
    def valid_extent(extent:arcpy.Extent):
        coords = [extent.XMax, extent.XMin, extent.YMax, extent.YMin]
        if any(coord is None for coord in coords) or \
           any(math.isnan(coord) for coord in coords):
            return False
        return True

    @staticmethod
    def hasZ(extent:arcpy.Extent):
        """returns whether a dataset hasZ, checks for both Nan and None"""
        coords = [extent.ZMin, extent.ZMax]
        if any(coord is None for coord in coords) or \
            any(math.isnan(coord) for coord in coords):
            return False
        return True

    @staticmethod
    def Describe(catalogPath:str):
        """replacement for arcpy.da.Describe to avoid unnecessary properties"""
        desc_properties = ["aliasName",
                           "baseName",
                           "catalogPath",
                           "dataType",
                           "datasetType",
                           "extent",
                           "featureType",
                           "name",
                           "shapeType"
                           ]
        desc = arcpy.Describe(catalogPath)
        da_desc = {}
        for prop in desc_properties:
            da_desc[prop] = getattr(desc,prop, None)
        #children just for BimFiles.
        if da_desc.get("dataType") == "BimFileWorkspace":
            children = getattr(desc,"children", None)
            if children:
                #get the first children and extent
                #BIMFileWorkspace doesn't have it's own extent
                first_child_path = getattr(children[0], "catalogPath", None)
                first_child_desc = arcpy.Describe(first_child_path)
                da_desc["extent"] = getattr(first_child_desc, "extent", None)
        if da_desc["extent"]:
            da_desc["extent"] = CatalogDataset.clip_extent(da_desc["extent"])
        return da_desc

    @staticmethod
    def max_workers():
        max_workers = 2
        cpus = cpu_count()
        if cpus > 2:
            max_workers = (cpus - 1) * 2
        return max_workers

    # Clip extents to within the spatial reference bounds
    @staticmethod
    def clip_extent(extent):
        # need to set this for other non-english os
        locale.setlocale(locale.LC_ALL, '')
        sr = extent.spatialReference                
        if sr:
            xydomain = sr.domain.split(" ")            
            if len(xydomain) >= 4:
                xmin1 = locale.atof(xydomain[0])
                ymin1 = locale.atof(xydomain[1])
                xmax1 = locale.atof(xydomain[2])
                ymax1 = locale.atof(xydomain[3])
                xmin = extent.XMin
                ymin = extent.YMin
                xmax = extent.XMax
                ymax = extent.YMax
                zmin = extent.ZMin
                zmax = extent.ZMax
                clip = False
                if xmin < xmin1:
                    xmin = xmin1
                    clip = True
                if ymin < ymin1:
                    ymin = ymin1
                    clip = True
                if xmax > xmax1:
                    xmax = xmax1
                    clip = True
                if ymax > ymax1:
                    ymax = ymax1
                    clip = True
                if clip:
                    extent = arcpy.Extent(xmin, ymin, xmax, ymax, spatial_reference = sr)
                    if zmin:
                        extent.ZMin = zmin
                    if zmax:
                        extent.ZMax = zmax
        return extent

    @staticmethod
    def build_extent(extent_json, useZ = True):
        """ create arcpy.Extent using web extent JSON
        - extent_json = web extent JSON
        - returns arcpy.Extent object
        """
        sr_json = extent_json.get("spatialReference")
        
        zmin = extent_json.get("zmin")        
        zmax = extent_json.get("zmax")

        sr = CatalogDataset.build_sr(sr_json)

        #z enabled envolope
        if zmin and zmax and useZ:
            extent = Extent(
                XMin = extent_json.get("xmin"),
                YMin = extent_json.get("ymin"),
                XMax = extent_json.get("xmax"),
                YMax = extent_json.get("ymax"),
                ZMin = zmin,
                ZMax = zmax,
                spatial_reference = sr)
        #non-z enabled envelope    
        else:
            extent = Extent(
                XMin = extent_json.get("xmin"),
                YMin = extent_json.get("ymin"),
                XMax = extent_json.get("xmax"),
                YMax = extent_json.get("ymax"),
                spatial_reference = sr)
        
        if extent:
            extent = CatalogDataset.clip_extent(extent)
        return extent

    @staticmethod
    def build_sr (sr_json:dict):
        """ create arcpy.SpatialReference using web sr JSON
        - sr_json = web spatial reference JSON
        - returns arcpy.SpatialReference object
        """
        sr_wkid = sr_json.get("latestWkid") or sr_json.get("wkid")
        sr_wkt = sr_json.get("wkt")
        sr_vcs_wkid = sr_json.get("latestVcsWkid") or sr_json.get("vcsWkid")
        if sr_wkid:
            sr = SpatialReference(sr_wkid, vcs=sr_vcs_wkid)
        elif sr_wkt:
            sr = SpatialReference(vcs = sr_vcs_wkid ,text=sr_wkt)
        else:
            raise ValueError(arcpy.GetIDMessage(3705))
        XYTolerance = sr.XYTolerance
        MTolerance = sr.MTolerance
        ZTolerance = sr.ZTolerance
        sr.XYTolerance = sr_json.get("xyTolerance", XYTolerance)
        sr.MTolerance = sr_json.get("mTolerance", MTolerance)
        sr.ZTolerance = sr_json.get("zTolerance", ZTolerance)
        # test and research a bit more and uncomment
        '''false_x = sr_json.get("falseX")
        false_y = sr_json.get("falseY")
        xy_units = sr_json.get("xyUnits")
        sr.setFalseOriginAndUnits(false_x, false_y, xy_units)
        false_z = sr_json.get("falseZ")
        z_units = sr_json.get("zUnits")
        sr.setZFalseOriginAndUnits(false_z, z_units)
        false_m = sr_json.get("falseM")
        m_units = sr_json.get("mUnits")
        sr.setMFalseOriginAndUnits(false_m, m_units)'''
        return sr

    @staticmethod
    def lower_keys(in_dict:dict):
        """ lower case conversion of all dictionary keys
        """
        return {k.lower() : v for k, v in in_dict.items()}

    @staticmethod
    def process_imagesvr(catalogPath:str):
        """
        ImageServer can come from ags connection file,
        Living atlas, or from current portal.
        We need to create proper session obj and url
        """
        try:
            if catalogPath.startswith(("http://", "https://")):
                url = catalogPath
                auth = None
                #Pro Auth if signed into portal
                if arcpy.GetSigninToken():
                    auth = ArcGISProAuth()
            else:
                #ags conn file
                tmp = os.path.split(catalogPath)
                svc_name = tmp[-1]
                ags_conn_file = tmp[0]
                folder = None
                if not ags_conn_file.endswith(".ags"):
                    #check for folder
                    tmp = os.path.split(ags_conn_file)
                    folder = tmp[-1]
                    ags_conn_file = tmp[0]
                auth = ArcGISServerAuth(ags_conn_file)
                url = auth.url
                if folder:
                    url = url + "/" + folder 
                url = url + "/" + svc_name.replace(".", "/")
        except Exception as e:
            arcpy.AddIDMessage("WARNING", 3699, catalogPath)
            raise Exception

        with EsriSession(auth, verify_cert=True) as session:
            item_desc = CDServiceItems.get_service_info(url, session)
            # raise Exception if error
            if "error" in item_desc:
                arcpy.AddIDMessage("WARNING", 3699, url)
                raise Exception
            return item_desc

    @staticmethod
    def start_editing(catalog_dataset):
        desc = arcpy.Describe(catalog_dataset)
        cdpath = desc.catalogPath
        workspace = os.path.dirname(cdpath)
        if not desc.isVersioned:
            multiuser_mode = False
        else:
            multiuser_mode = True
        edit = None
        if (not arcpy.IsBeingEdited(cdpath)) and (desc.isVersioned):
            edit = arcpy.da.Editor(workspace)
            edit.startEditing(False, multiuser_mode)
            edit.startOperation()
        return edit

    @staticmethod
    def stop_editing(edit):
        if (edit is not None)  and (edit.isEditing):
            edit.stopOperation()
            edit.stopEditing(save_changes=True)
    
    @staticmethod
    def getCatalogDatasetLookupTable(catalog_dataset):
        lookup_table = None
        catalog_dataset_wksp, catalog_dataset_name = os.path.split(catalog_dataset)
        try:
            with arcpy.da.SearchCursor(catalog_dataset, ["cd_itemsource"]) as searchCursor:
                env_wksp = arcpy.env.workspace
                arcpy.env.workspace = catalog_dataset_wksp
                count = arcpy.management.GetCount(catalog_dataset_name)
                arcpy.env.workspace = env_wksp
                if (int(count[0]) > 1e6):
                    return None
                lookup_table = set(list(json.loads(row[0]).values())[0] for row in searchCursor)
        except Exception as e:
            #arcpy.AddWarning(e) # Uncomment for debugging
            return None
        return lookup_table

    @staticmethod
    def find_item(catalog_dataset:str, lookup_table:set, target_identifier:str, target_itemsource:str, exact_match:bool, useToChar:bool = False):
        foundItem = False
        if (lookup_table is not None):
            if exact_match:
                foundItem = target_identifier in lookup_table
            else:
                for itemsource in lookup_table:
                    if (itemsource.find(target_identifier) >= 0):
                        foundItem = True
                        break
        else:
            if useToChar:
                if exact_match:
                    whereClause = "to_char(cd_itemsource) = '" + target_itemsource + "'"
                else:
                    whereClause = "to_char(cd_itemsource) LIKE '%" + target_identifier + "%'"
            else:
                if exact_match:
                    whereClause = "cd_itemsource = '" + target_itemsource + "'"
                else:
                    whereClause = "cd_itemsource LIKE '%" + target_identifier + "%'"
            result_cursor = arcpy.da.SearchCursor(catalog_dataset, ["cd_itemname"], where_clause=whereClause) 
            foundItem = False
            for row in result_cursor:
                foundItem = True
                break
            del result_cursor
        return foundItem
    
class Footprint(object):

    def __init__(self, item_extent: Extent, cd_sr: SpatialReference, cd_hasZ: bool):
        """Manages the footprint calculations - params:
           - item_extent :Provide the item's extent
           - cd_sr : catalog Dataset's spatial reference
           - cd_hasZ : catalog Dataset's hasZ property
         """
        self.item_extent = item_extent
        self.cd_sr = cd_sr
        self.cd_hasZ = cd_hasZ
        self.item_hasZ = CatalogDataset.hasZ(self.item_extent)
        self.item_sr = item_extent.spatialReference

    def get_footprint_info(self, catalogDataPath:str = None, convex_hull:bool = False):
        """Returns a tuple of footprint height, footprint polygon.
            - convex_hull : whether we need to calculate convex_hull
            Exception: ValueError
         """
        env_transformation = "" #empty quotes uses default transformation.
        if arcpy.env.geographicTransformations: # Check value - if None will be None transformation and not default.
            env_transformation = arcpy.env.geographicTransformations
        # handle Z polygons from items
        footprint_height = 0
        footprint_extent = self.item_extent.projectAs(self.cd_sr, env_transformation)
        footprint_polygon = footprint_extent.polygon
        if convex_hull:
            try:
                result = arcpy.MinimumBoundingGeometry_management(catalogDataPath, arcpy.Geometry(), "CONVEX_HULL", "ALL")
                footprint_polygon = result[0]
            except arcpy.ExecuteError as e:
                #arcpy.AddMessage(str(e)) for debugging
                raise ValueError(arcpy.GetIDMessage(3693))
        if self.item_hasZ:
            #capture footprint height
            footprint_height = footprint_extent.depth
            if self.cd_sr.VCS and self.item_sr.VCS:
                if self.cd_hasZ:
                    #project it to proper VCS
                    projected_polygon = self.projectZ(self.item_extent.polygon, env_transformation)
                    zMin = projected_polygon.extent.ZMin
                    #retain convex_hull polygon but use ZMin from projection
                    if not convex_hull:
                        footprint_polygon = projected_polygon
                    footprint_height = projected_polygon.extent.depth * self.cd_sr.VCS.metersPerUnit
            else:
                # can't project the z coordinates with no proper VCS,
                # so will be using the default projected 2D Extent
                #but, flatten the z values of the extent
                zMin = footprint_extent.ZMin
                #Manual conversion of ZMin and footprint height to proper units
                # Step 1: Convert to meters
                if self.item_sr.VCS:
                    # convert to meters from VCS units
                    footprint_height = footprint_extent.depth * self.item_sr.VCS.metersPerUnit
                    zMin = footprint_extent.ZMin * self.item_sr.VCS.metersPerUnit
                else:
                    # convert to meters from sr units if projected
                    if self.item_sr.type == "Projected": # if projected must be in SR units, convert to meters
                        zMin = zMin * self.item_sr.metersPerUnit
                        footprint_height = footprint_height * self.item_sr.metersPerUnit
                #Step 2: Convert ZMin alone to proper units based on CD
                if self.cd_hasZ:
                    if self.cd_sr.VCS: # convert to VCS units
                        zMin = zMin /self.cd_sr.VCS.metersPerUnit
                    elif self.cd_sr.type == "Projected": #if projected SR convert to CD SR units
                        zMin = zMin/self.cd_sr.metersPerUnit
                    # Step 3: update the ZMin value in footprint
                    geom_str = footprint_polygon.JSON
                    return (footprint_height, self.flattenZPolygon(geom_str,zMin))
        if convex_hull:
            return footprint_height, footprint_polygon
        else:
            #create a new extent without z and m values
            new_extent = arcpy.Extent(
                XMin = footprint_extent.XMin,
                YMin = footprint_extent.YMin,
                XMax = footprint_extent.XMax,
                YMax = footprint_extent.YMax,
                spatial_reference = self.cd_sr)
            return (footprint_height, new_extent.polygon)

    def projectZ(self, curr_poly:arcpy.Polygon, transformation):
        """Returns a projected 3D polygon projected to the given cd_sr:
            - curr_poly :3D polygon 
            - cd_sr : Spatial reference to which it's projected
            - Exception : ValueError
        """
        overwrite = arcpy.env.overwriteOutput
        arcpy.env.overwriteOutput = True
        temp_fc = os.path.join(arcpy.env.scratchGDB, f"gp_catalogdataset_project_polygon")
        try:
            result = arcpy.management.Project(curr_poly,temp_fc, self.cd_sr,transform_method=transformation, vertical="VERTICAL")
            arcpy.env.overwriteOutput = overwrite
            project_fc = result[0]
            with arcpy.da.SearchCursor(project_fc,"SHAPE@") as cur:
                row = cur.next()
                return row[0]
        except arcpy.ExecuteError as e:
            # overwrite env
            arcpy.env.overwriteOutput = overwrite
            raise ValueError(arcpy.GetIDMessage(3694))

    def flattenZPolygon(self, geom_str: str, minZ: float):
        """set the zvalue of the polygon to its zmin value
            - geom_str: string representation of geometry object
            - minZ minimumZ value
        """
        geomJSON = json.loads(geom_str)
        rings = geomJSON["rings"]
        
        if rings is None or len(rings) == 0:
            raise ValueError(arcpy.GetIDMessage(3694))

        #Set all Zvalues of the polygon to ZMin value
        # footprint will be extruded based on minimum Zvalue and footprint height
        for ring in rings:
            for pt in ring:
                pt[2] = minZ
        # Create Polygon objects based an the array of points
        newPolyRings = list()
        for ring in rings:
            array = arcpy.Array([arcpy.Point(*pt) for pt in ring])
            newPolyRings.append(array)

        return arcpy.Polygon(array, self.cd_sr,True, False)

class CatalogDatasetItem(object):

    def __init__(self, item_desc, catalog_dataset_desc):
        """Represents an item in a Catalog Dataset"""
        self.desc = item_desc
        self.catalog_dataset_desc = catalog_dataset_desc
        self.catalogDataPath = item_desc.get("catalogPath")
        self.datasetType = item_desc.get("datasetType")
        self.item_extent =  self.desc.get("extent")
        self.item_sr = None # spatial reference, assigned value in validate()
        #validate for generic rules
        self.validate()
        #arcpy.AddMessage(self.catalogDataPath) #use only for debug, otherwise comment
        return

    def validate(self):
        """Validates the input item for the Catalog Dataset"""
        mem_wksp = ("in_memory\\", "memory\\", "in_memory/", "memory/")
        if self.catalogDataPath.startswith(mem_wksp):
            raise ValueError("memory workspace data " + arcpy.GetIDMessage(3700))
        invalid_extent = arcpy.GetIDMessage(3695)
        if self.item_extent is None:
            raise ValueError(invalid_extent)
        elif not CatalogDataset.valid_extent(self.item_extent):
            raise ValueError(invalid_extent)
        env_extent = arcpy.env.extent
        #check whether the item is within the extent
        if env_extent:
            env_transformation = ""
            if arcpy.env.geographicTransformations:
                env_transformation = arcpy.env.geographicTransformations
            cd_sr = self.catalog_dataset_desc.get("spatialReference")
            env_extent = env_extent.projectAs(cd_sr, env_transformation)
            item_extent = self.item_extent.projectAs(cd_sr, env_transformation)
            if not item_extent.within(env_extent):
                raise ValueError(arcpy.GetIDMessage(3696))
        # check Unknown SR
        self.item_sr = self.item_extent.spatialReference
        if self.item_sr.type == "Unknown":
            arcpy.AddIDMessage("WARNING", 3697, self.catalogDataPath)
        else:
            #check z and VCS
            item_hasZ = CatalogDataset.hasZ(self.item_extent)
            if item_hasZ and self.item_sr.VCS is None:
                arcpy.AddIDMessage("WARNING", 3698, self.catalogDataPath)


    def get_fields(self):
        """Returns an array of values for a row in Catalog Dataset Feature Class"""

        ft_height, ft_print = self.get_footprint_info()
        return [
                ft_print,
                self.get_item_name(),
                self.get_item_source(),
                self.get_itemtype(),
                self.get_minScale(),
                self.get_maxScale(),
                self.get_drawOrder(),
                ft_height
                ]

    def get_item_name(self):
        """Returns an appropriate name for the item"""
        item_name = self.desc.get("aliasName") or self.desc.get("name") or self.desc.get("baseName")
        #remove file extensions for physical files on disk only
        # do not remove for fc/mosaic/raster in gdb and sde
        if os.path.isfile(self.catalogDataPath):
            return item_name.split(".")[0]
        else:
            return item_name

    def get_item_source(self):
        """Returns the catalogpath as a JSON for item_source"""
        return json.dumps(dict(path = self.catalogDataPath), ensure_ascii=False)

    def get_drawOrder(self):
        """Returns an appropriate drawOrder for the item"""
        return 4000

    def get_itemtype(self):
        """Returns an item type for the item"""
        # slpks
        if self.catalogDataPath.endswith(".slpk"):
            return "SCENE_LAYER_PACKAGE"
        dt = self.desc.get("datasetType")
        # las dataset
        if dt == "LasDataset" and self.catalogDataPath.endswith((".lasz", ".las")):
            return "LAS_FILE"
        return CatalogDataset.descDatasetType_itemTypes.get(dt)

    def get_minScale(self):
        """Returns an appropriate min scale for the item"""
        return None

    def get_maxScale(self):
        """Returns an appropriate max scale for the item"""
        return None

    def get_footprint_info(self):
        """Returns an appropriate footprint polygon, footprint height for the item"""
        cd_sr = self.catalog_dataset_desc.get("spatialReference")
        hasZ = self.catalog_dataset_desc.get("hasZ")
        fprnt = Footprint(self.item_extent,cd_sr, hasZ)
        return fprnt.get_footprint_info()

class CatalogDatasetItemSvc(CatalogDatasetItem):

    def __init__(self, item_desc, catalog_dataset_desc):
        """Processes a URL catalogPath based item"""
        item_desc["catalogPath"] = item_desc.get("url")
        full_extent = item_desc.get("fullExtent")
        item_desc["extent"] =  CatalogDataset.build_extent(full_extent)
        super().__init__(item_desc=item_desc, catalog_dataset_desc=catalog_dataset_desc)
        return

    def validate(self):
        '''skip elevation layers'''
        service_dt = self.desc.get("serviceDataType")
        if service_dt == "esriImageServiceDataTypeElevation":
            raise ValueError("Elevation Layer " + arcpy.GetIDMessage(3700))
        super().validate()

    def get_item_name(self):
        """Returns service name for the item"""
        splits = self.catalogDataPath.rstrip("/").split("/")
        return splits[-2]

    def get_item_source(self):
        """return url as item source """
        return json.dumps(dict(url = self.catalogDataPath), ensure_ascii=False)

    def get_itemtype(self):
        """returns type of the service"""
        splits = self.catalogDataPath.rstrip("/").split("/")
        return CatalogDataset.descDatasetType_itemTypes.get(splits[-1])

    def get_minScale(self):
        """overridden to get value from service JSON"""
        return self.desc.get("minScale",0)

    def get_maxScale(self):
        """overridden to get value from service JSON"""
        return self.desc.get("maxScale",0)

class CDServiceItems(object):

    #properties required from a service REST endpoint response
    desc_properties = ["fullExtent", "minScale", "maxScale", "serviceDataType"]

    def __init__(self, cd_desc, cursor, catalog_dataset, lookup_table):
        """Adds URL items to Catalog Dataset"""
        self.cd_desc = cd_desc
        self.cursor = cursor
        self.catalog_dataset = catalog_dataset
        self.lookup_table = lookup_table

    @staticmethod
    def is_map_server_root_url(path:str):
        return (path.startswith(("http://", "https://")) and path.lower().rstrip("/").endswith(("mapserver")))

    @staticmethod
    def get_service_info(url:str, session:EsriSession):
        """Sends request to a URL and
           derives required values for the CD item
           from the response
           --called in worker threads
        """
        resp = response = session.get(url, params={'f': 'json'}, timeout = 3)
        if resp.status_code != 200:
            return json.loads(f'{{"error": {{"message":"{url}","details":[]}}}}')
        svc_prop = resp.json()
        item_desc = {k : svc_prop.get(k) for k in CDServiceItems.desc_properties}
        item_desc["url"] = url
        return item_desc

    def add_items(self, auth, service_urls):
        """Processes a list of URLs and adds the items to the Catalog Dataset"""
        num_items_added = 0
        skipped_row_count = 0
        with EsriSession(auth=auth, verify_cert=True) as session:
            with concurrent.futures.ThreadPoolExecutor(CatalogDataset.max_workers()) as executor:
                jobs = {executor.submit(CDServiceItems.get_service_info,url,session) : url for url in service_urls}
                for future in concurrent.futures.as_completed(jobs):
                    try:
                        curr_url = jobs[future]
                        item_desc = future.result()
                        if "error" in item_desc:
                            arcpy.AddIDMessage("WARNING", 3699, curr_url)
                        else:
                            try:
                                catalogItem  = CatalogDatasetItemSvc(item_desc, self.cd_desc)
                                if CatalogDataset.find_item(self.catalog_dataset, self.lookup_table if hasattr(self, 'lookup_table') else None, catalogItem.catalogDataPath, catalogItem.get_item_source(), True):
                                    arcpy.AddIDMessage("INFORMATIVE",3961,catalogItem.get_item_name())
                                    skipped_row_count += 1
                                    return num_items_added, skipped_row_count
                                row = catalogItem.get_fields()
                                self.cursor.insertRow(row)
                                num_items_added = num_items_added + 1
                                if hasattr(self, 'lookup_table'):
                                    self.lookup_table.add(catalogItem.catalogDataPath)
                            except Exception as e:
                                #arcpy.AddWarning(e)
                                arcpy.AddIDMessage("WARNING", 3709, curr_url)
                    except:
                        arcpy.AddIDMessage("WARNING", 3699, curr_url)
        return num_items_added, skipped_row_count
