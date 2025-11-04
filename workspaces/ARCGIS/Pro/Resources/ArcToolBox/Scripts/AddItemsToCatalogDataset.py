"""-------------------------------------------------------------------------
    Tool:               Add Items to Catalog Dataset (Data Management Tools)
    Source Name:        AddItemsToCatalogDataset.py
    Version Added:      ArcGIS Pro 3.1
    Author:             Esri, Inc.    
    Description:        Adds items to catalog Dataset.
    Last Updated Ver:   ArcGIS Pro 3.1
------------------------------------------------------------------------"""
import arcpy
import os
import json
from itertools import chain

from arcpy.management import CreateCatalogDataset
from CatalogDatasetUtil import CatalogDataset
from CatalogDatasetUtil import CatalogDatasetItem
from CatalogDatasetUtil import CatalogDatasetItemSvc
from CatalogDatasetUtil import Footprint
from CatalogDatasetUtil import CDServiceItems
from arcgis.auth._auth._token import ArcGISServerAuth
from arcgis.gis.server import ServicesDirectory
import concurrent.futures


class CatalogDatasetItemFC(CatalogDatasetItem):

    def __init__(self, item_desc, catalog_dataset_desc, isConvexHull=False):
        """Processes Feature Class input items"""
        self.isConvexHull = isConvexHull
        super().__init__(item_desc=item_desc, catalog_dataset_desc=catalog_dataset_desc)

    def validate(self):
        """overridden validate for featureType"""
        super().validate()  # generic validation for all datasets
        if self.desc.get("featureType") == "CatalogDatasetItem":
            msg = arcpy.GetIDMessage(3700)
            raise ValueError(
                f"Catalog Dataset feature class {msg}")
        pth = self.catalogDataPath
        if pth.startswith("http://") or pth.startswith("https://"):
            #the url has a weird backward slash, account for it
            pth = pth.replace("\\", "/")
            pth = pth.replace("\\\\", "/")
            self.catalogDataPath = pth
        return True

    def get_item_name(self):
        pth = self.catalogDataPath
        if pth.startswith("http://") or pth.startswith("https://"):
            return self.desc.get("aliasName") # returns Service layer name
        else:
            return super().get_item_name()

    def get_item_source(self):
        """Returns path for item_source: special case for FSvc/MSvc Layers"""
        pth = self.catalogDataPath
        if pth.startswith("http://") or pth.startswith("https://"):
            return json.dumps(dict(url = pth), ensure_ascii=False)
        else:
            return super().get_item_source()

    def get_itemtype(self):
        """Returns item type based on url or dataset type"""
        pth = self.catalogDataPath
        if pth.startswith("http://") or pth.startswith("https://"):
            splits = pth.rstrip("/").split("/")
            dt = splits[-2]
        else:
            dt = self.desc.get("datasetType")
        return CatalogDataset.descDatasetType_itemTypes.get(dt)

    def get_drawOrder(self):
        """overridden drawOrder for feature class shapeTypes"""
        shpType = self.desc.get("shapeType")
        if shpType == "Point" or shpType == "Multipoint":
            return 1000
        if shpType == "Polyline":
            return 2000
        if shpType == "Polygon":
            return 3000
        return 4000

    def get_footprint_info(self):
        """overridden footprint_info to accomodate convex_hull calculation"""
        cd_sr = self.catalog_dataset_desc.get("spatialReference")
        hasZ = self.catalog_dataset_desc.get("hasZ")
        fprnt = Footprint(self.item_extent, cd_sr, hasZ)
        return fprnt.get_footprint_info(self.catalogDataPath, self.isConvexHull)

class CatalogDatasetItemLayerFile(CatalogDatasetItem):

    unsupported_layers = ["CIMGroupLayer", "CIMCatalogLayer"]

    item_types_datasets = {
        "esriDTRasterDataset" : "RASTER_DATASET",
        "esriDTFeatureClass" : "FEATURE_CLASS",
        "esriDTRasterBand" : "RASTER_DATASET", #not very common
        "esriDTTin" : "TIN",
        "esriDTCadDrawing": "CAD_DRAWING",
        "esriDTNetworkDataset": "NETWORK_DATASET",
        "esriDTMosaicDataset": "MOSAIC_DATASET",
        "esriDTLasDataset":"LAS_DATASET",
        "esriDTUtilityNetwork": "UTILITY_NETWORK",
        "esriDTBIMFile": "BIM_FILE_WORKSPACE" #may not be in a lyrx
        }

    svc_conns = ["CIMAGSServiceConnection"]

    def __init__(self, item_desc, catalog_dataset_desc):
        """Process Layer File input items"""
        self.layer_defn = None  # stores layer definition
        self.layer_type = None  # layer type
        self.dataset_type = None # dataset type in dataConnectioon
        super().__init__(item_desc=item_desc, catalog_dataset_desc=catalog_dataset_desc)

    def validate(self):
        """Overridden validate for multiple layers and group layer"""
        try:
            with open(self.catalogDataPath) as f:
                lyr = json.load(f)
                # convert keys to lower()
                lyr = CatalogDataset.lower_keys(lyr)
                lyrCIMPaths  = lyr.get("layers")
                layer_defns = lyr.get("layerdefinitions", [])
            if len(lyrCIMPaths) > 1:
                raise ValueError(arcpy.GetIDMessage(3701))
            # check the layer type
            # we get the CIMPathURI from layers and look for the layerdefinition with the same URI
            layer_URI = lyrCIMPaths[0]
            for layer_defn in layer_defns:
                #convert keys to lower
                layer_defn = CatalogDataset.lower_keys(layer_defn)
                if layer_defn["uri"] == layer_URI:
                    self.layer_defn = layer_defn
                    self.layer_type = self.layer_defn.get("type")
                    break
            if self.layer_type in CatalogDatasetItemLayerFile.unsupported_layers:
                msg = arcpy.GetIDMessage(3700)
                lyr_type = self.layer_type[3:]
                raise ValueError(
                    f"{lyr_type} {msg}")
            #validate datatypes
            data_conn = self.layer_defn.get("dataconnection")
            feature_table = self.layer_defn.get("featuretable")
            #ignoring serviceConnection layer files for now
            #needs reserach and will pick it up in next PR
            if not data_conn: #check featuretable
                if feature_table:
                    feature_table = CatalogDataset.lower_keys(feature_table)
                    data_conn = feature_table.get("dataconnection")
                else:
                    raise ValueError(arcpy.GetIDMessage(3712))
            data_conn = CatalogDataset.lower_keys(data_conn)
            dataset_type = data_conn.get("datasettype")
            if not dataset_type or \
                dataset_type not in CatalogDatasetItemLayerFile.item_types_datasets.keys():
                raise ValueError(arcpy.GetIDMessage(3712))
            self.dataset_type = dataset_type
            super().validate()
        except ValueError as e:
            raise ValueError(str(e))
        except Exception as e:
            raise ValueError(arcpy.GetIDMessage(3702))

    def get_item_name(self):
        """overridden item_name to get name from layer doc"""
        return self.layer_defn.get("name") or self.desc.get("basename")

    def get_itemtype(self):
        """overridden item_type to get type from layer doc"""
        return CatalogDatasetItemLayerFile.item_types_datasets[self.dataset_type]

    def get_minScale(self):
        """overridden minScale to get from layer doc"""
        return self.layer_defn.get("minscale", 0)

    def get_maxScale(self):
        """overridden maxScale to get from layer doc"""
        return self.layer_defn.get("maxscale", 0)

class CatalogDatasetItemBIMFile(CatalogDatasetItem):

    def __init__(self, item_desc, catalog_dataset_desc):
        """Processes BIM File based Catalog Dataset items"""
        #Assign appropriate extent from children if BIM File
        self.catalogDataPath = item_desc.get("catalogPath")
        if item_desc.get("dataType") == "BimFileWorkspace":
            self.BIM_type = "BIMFile"
        else:
            self.BIM_type = "BIMFloorPlan"
        super().__init__(item_desc=item_desc, catalog_dataset_desc=catalog_dataset_desc)

    def get_item_name(self):
        """Returns an appropriate name for the item"""
        if self.BIM_type == "BIMFloorPlan":
            rvt_path = os.path.dirname(self.catalogDataPath)
            rvt_name = os.path.basename(rvt_path).rstrip(".rvt")
            return f"{rvt_name} FloorPlan"
        else:
            return super().get_item_name()

    def get_itemtype(self):
        """Returns an item type for the item"""
        if self.BIM_type == "BIMFile":
            return "BIM_FILE_WORKSPACE"
        else:
            return "BIM_FILE_FLOORPLAN"

class CDWorkspace():

    # only mosaic, featureclass and raster can be in gdb in the current set of supported datasets
    supported_datasets = {".sde": ["FEATURE_CLASS", "MOSAIC_DATASET", "RASTER_DATASET"],
                          ".gdb": ["FEATURE_CLASS", "MOSAIC_DATASET", "RASTER_DATASET"],
                          ".sqlite": ["FEATURE_CLASS"],
                          ".geopackage": ["FEATURE_CLASS"],
                          ".geodatabase":["FEATURE_CLASS"]
                          }

    def __init__(self, catalogPath, item_types):
        """Processes workspace(except folder) and generates list of  input items
           based on the item_types specified by the user
        """
        self.catalogPath = catalogPath
        self.item_types = item_types

    def get_catalogitems(self):
        """Uses walk method to retrieve individual items in the workspace"""
        items = []
        wksp_ext_type = os.path.splitext(self.catalogPath)[1]
        supported_dt = CDWorkspace.supported_datasets.get(wksp_ext_type, [])
        item_type_to_walk_dt = {
            "FEATURE_CLASS": "FeatureClass",
            "RASTER_DATASET": "RasterDataset",
            "MOSAIC_DATASET": "MosaicDataset"
            }
        # iterate through only if the workspace can have supported datasets types
        for item_type in supported_dt:
            if item_type in self.item_types:
                dt = item_type_to_walk_dt.get(item_type)
                item_list = arcpy.da.Walk(self.catalogPath, datatype=dt, followlinks=True)
                items = chain(items, item_list)
        if items:
            return items
        else:
            return chain([("","","")])  # returns empty tuple

class CDFolderWorkspace():

    # extensions to find in folder workspaces based on itemtypes.
    itemtypes_extension = {
        "FEATURE_CLASS": [".shp"],
        "LAS_DATASET": [".lasd"],
        # splitting lasfile and lasdataset allow users to ignore las files already in lasd
        "LAS_FILE": [".las", ".zlas"],
        "LAYER_FILE": [".lyrx"],
        "CAD_DRAWING": [".dwg", ".dxf", ".dgn"],
        "RASTER": [],  # use list rasters instead
        "MOSAIC_DATASET": [],  # use list rasters instead
        "SCENE_LAYER_PACKAGE":[".slpk"],
        "BIMFileWorkspace":[".rvt"], # processed as workspace - not itemtype
        "FeatureOnlyWorkspace": [".sqlite", ".geopackage", ".geodatabase"], # processed as workspace - not item type
        "Workspace": [".sde"]
    }
    # supported item types in a gdb right now
    gdb_itemtypes = ["FEATURE_CLASS",
                    "RASTER_DATASET",
                    "MOSAIC_DATASET"]

    def __init__(self, catalogPath, item_types, include_subfolders=True):
        """Processes subfolders, other workspaces(eg:gdb) and input items in a folder"""
        self.catalogPath = catalogPath
        self.item_types = item_types
        self.include_subfolders = include_subfolders
        self.output = chain()  # holds the list of iterators/generators
        # need to list rasters seperately since it's too hard to use file extensions
        self.include_rasters = "RASTER_DATASET" in self.item_types

    def get_catalogitems(self):
        """Builds a list of items in subfolders, other workspaces and file-based items in current folder"""
        list_fileext = []
        for item_type in self.item_types:
            list_fileext.extend(
                CDFolderWorkspace.itemtypes_extension.get(item_type, []))
        list_fileext = tuple(list_fileext)  # immutable
        if self.include_subfolders:
            return self.crawl_workspace(list_fileext)
        else:
            item_list = list()
            r = self.process_rasters(self.catalogPath)
            if r is not None:
                item_list.append(r)
            d = self.process_datasets(self.catalogPath)
            if d is not None:
                item_list.append(d)
            item_list.append((self.catalogPath, [], list(
                filter(lambda f: f.endswith(list_fileext), os.listdir(self.catalogPath)))))
            return item_list

    def crawl_workspace(self, list_fileext):
        """Utility method to support get_catalogitems"""
        wksp_file_ext = []  # do we need to look for workspaces file extensions and which ones?
        gdb_wksp = False  # process gdb folders if item_types has FC, raster and mosaic
        if any(item_type in CDFolderWorkspace.gdb_itemtypes for item_type in self.item_types):
            # add sde file extension
            wksp_file_ext.extend(
                CDFolderWorkspace.itemtypes_extension.get("Workspace", []))
            gdb_wksp = True
        if "FEATURE_CLASS" in self.item_types:
            # add sqlite and geopackage
            wksp_file_ext.extend(CDFolderWorkspace.itemtypes_extension.get(
                "FeatureOnlyWorkspace", []))
        if "BIM_FILE_WORKSPACE" in self.item_types or "BIM_FILE_FLOORPLAN" in self.item_types:
            wksp_file_ext.extend(CDFolderWorkspace.itemtypes_extension.get(
                "BIMFileWorkspace", []))

        wksp_file_ext = tuple(wksp_file_ext)
        items_list = []
        # it's important to use os.walk for two reasons
        # 1. performance 2. we process CADDataset and BIMWorkspaces differently than arcpy.da.Walk
        # 3. good to make it multithreaded or multiprocess later to improve performance
        for item in os.walk(self.catalogPath):
            directory, subFolder, files = item
            try:
                if gdb_wksp and directory.endswith(".gdb"):
                    gdb_output = CDWorkspace(
                        directory, self.item_types).get_catalogitems()
                    self.output = chain(self.output, gdb_output)
                    continue
                if files:
                    # filter and process workspace files
                    for currfile in list(filter(lambda f: f.endswith(wksp_file_ext), files)):
                        fullpath = os.path.join(directory, currfile)
                        #check for rvt
                        if currfile.endswith(".rvt"):
                            wksp_output = CDBIMWorkspace(
                                fullpath, self.item_types).get_catalogitems()
                        else:
                            wksp_output = CDWorkspace(
                                fullpath, self.item_types).get_catalogitems()
                        self.output = chain(self.output, wksp_output)
                    #process all other requested file items
                    items_list.append((directory, subFolder, list(
                        filter(lambda f: f.endswith(list_fileext), files))))
                # process rasters in this directory
                r = self.process_rasters(directory)
                if r is not None:
                    items_list.append(r)
                d = self.process_datasets(directory)
                if d is not None:
                    items_list.append(d)
            except Exception as e:
                arcpy.AddIDMessage("WARNING", 3709, directory)
        if len(items_list) > 0:
            self.output = chain(self.output, items_list)
        return self.output

    def process_rasters(self, currentFolder):
        """Builds a list of rasters items in a folder, 
           does not crawl through subfolders
        """
        if self.include_rasters:
            env_wksp = arcpy.env.workspace
            arcpy.env.workspace = currentFolder
            rasters = [r for r in arcpy.ListRasters()]
            arcpy.env.workspace = env_wksp
            if len(rasters) > 0:
                return ((currentFolder, [], rasters))
        return None
    
    def process_datasets(self, currentFolder):
        """Builds a list of TIN dataset items in a folder, 
           does not crawl through subfolders
        """
        if "TIN" in self.item_types:
            env_wksp = arcpy.env.workspace
            arcpy.env.workspace = currentFolder
            tins = list(arcpy.ListDatasets("","Tin"))
            arcpy.env.workspace = env_wksp
            if len(tins) > 0:
                return ((currentFolder, [], tins))
        return None
    

class CDSvcConnWorkspace():

    supported_itemtypes = ("MAP_SERVICE",
                          "FEATURE_SERVICE",
                          "IMAGE_SERVICE")
    exclude_folders = ("System", "Utilities")

    def __init__(self, catalogPath, item_types, include_subfolders=True):
        """Processes ags connection file and generates list of URLs"""
        self.catalogPath = catalogPath
        self.item_types = item_types
        self.include_folders = include_subfolders
        auth = ArcGISServerAuth(self.catalogPath)
        self.base_url = auth.url

    def get_catalogitems(self):
        """Gets all the service URLS based on the item types and includes_folder parameter"""
        requested_itemtypes = [CatalogDataset.item_type_descDatasetType[item_type]
                               for item_type in CDSvcConnWorkspace.supported_itemtypes if item_type in self.item_types]
        if not requested_itemtypes:
            return []  # do not unnecessarily process ags if not requested
        try:
            sd = ServicesDirectory(ags_file=self.catalogPath)
            json_resp = sd.list(as_dict=True)
            folders_list = json_resp.get("folders")
            services = json_resp.get("services")
            if not services:
                raise Exception
            service_urls = [self.base_url + "/" + service.get("name") + "/" + service.get("type")
                            for service in services if service.get("type") in requested_itemtypes]
            # remove exclude folders
            for folder in CDSvcConnWorkspace.exclude_folders:
                if folder in folders_list:
                    folders_list.remove(folder)
            if folders_list and self.include_folders:
                # run concurrent request for every folder and gather svc urls
                max_workers = CatalogDataset.max_workers()
                with concurrent.futures.ThreadPoolExecutor(max_workers) as executor:
                    jobs = {executor.submit(
                        sd.list, folder, as_dict=True): folder for folder in folders_list}
                    for future in concurrent.futures.as_completed(jobs):
                        folder_resp = future.result()
                        services = folder_resp.get("services")
                        if services is None:
                            curr_folder = jobs[future]
                            arcpy.AddIDMessage("WARNING",3703, curr_folder)
                        folder_svc_urls = [self.base_url + "/" + service.get("name") + "/" + service.get("type")
                                           for service in services if service.get("type") in requested_itemtypes]
                        service_urls.extend(folder_svc_urls)
            #arcpy.AddMessage(f"No.of Services:{len(service_urls)}")
            return service_urls
        except Exception as e:
            raise ValueError(arcpy.GetIDMessage(3704))

class CDBIMWorkspace():

    def __init__(self, catalogPath, item_types):
        """
        Processes BIM files and creates two items, 
        one for the .rvt file and 
        the other for the floor plan as requested by the team
        """
        self.catalogPath = catalogPath
        self.item_types = item_types

    def get_catalogitems(self):
        """Creates two items list based on supported item types"""
        par_dir = os.path.dirname(self.catalogPath)
        rvt_file = os.path.basename(self.catalogPath)
        itemList = []
        if "BIM_FILE_WORKSPACE" in self.item_types:
            itemList.append(rvt_file)
        if "BIM_FILE_FLOORPLAN" in self.item_types:
            itemList.append(os.path.join(rvt_file, "FloorPlan"))
        return [(par_dir, [], itemList)]

class CDACSWorkspace():

    # only mosaic, featureclass and raster can be in gdb in the current set of supported datasets
    supported_datasets = { ".acs": ["RASTER_DATASET"] }
    # exclude the following extensions from traversal, since aio doesn't catch them
    excluded_exts = ("i3srest", "tiles", "vtiles", "i3srest", "crf")
    # ignore directory for traversal if any of the following files are detected
    excluded_files = ("root.json", "conf.cdi", "0")

    def __init__(self, catalogPath, item_types, include_subfolders):
        """Processes workspace(except folder) and generates list of  input items
           based on the item_types specified by the user
        """
        self.catalogPath = catalogPath
        self.item_types = item_types
        self.include_subfolders = include_subfolders

    def get_catalogitems(self):
        """Uses walk method to retrieve individual items in the workspace"""
        items = []
        if ("RASTER_DATASET" not in self.item_types):
            return chain([("","","")])  # returns empty tuple
        
        r = self.process_rasters(self.catalogPath+r"\\")
        if r is not None:
            items.append(r)

        aio = arcpy.AIO(self.catalogPath);
        dir_list = [(self.catalogPath+r"/",1)]
        catalog_path_len = len(self.catalogPath+r"/")
        if self.include_subfolders:
            while len(dir_list) > 0:
                if arcpy.env.isCancelled:
                    return items
                currentDir,currentDepth = dir_list.pop()
                if len(currentDir) < catalog_path_len:
                    continue
                itemit = aio.scandir(currentDir[catalog_path_len:-1], depth=0, type=arcpy.CloudPathType.ACS)
                for itemi in itemit:
                    if arcpy.env.isCancelled:
                        return items
                    if itemi.is_dir():
                        # ignoring any paths that have excluded extensions or cache datasets
                        if self.is_excluded(aio, itemi.path[catalog_path_len:-1]):
                            continue
                        r = self.process_rasters(itemi)
                        if r is not None:
                            items.append(r)
                        dir_list.append((itemi.path, currentDepth + 1))
            
        if items:
            return items
        else:
            return chain([("","","")])  # returns empty tuple

    def process_rasters(self, currentFolder):
        """Builds a list of rasters items in a folder, 
           does not crawl through subfolders
        """
        env_wksp = arcpy.env.workspace
        if isinstance(currentFolder, str):
            arcpy.env.workspace = currentFolder
        else:
            arcpy.env.workspace = currentFolder.path
        try:
            rasters = [r for r in arcpy.ListRasters() if ".tpkx" not in r]
        except:
            rasters = []
        arcpy.env.workspace = env_wksp
        if len(rasters) > 0:
            if isinstance(currentFolder, str):
                return ((os.path.normpath(currentFolder), [], rasters))
            else:
                return ((os.path.normpath(currentFolder.path), [], rasters))
        return None
    
    def is_excluded(self, aio, dirpath):
        for ex_file in self.excluded_files:
            if aio.exists(dirpath+"/"+ex_file):
                return True
        return dirpath.split(".")[-1].rstrip("\\/") in self.excluded_exts

class AddItemsToCatalogDataset(object):
    def __init__(self):
        """ A simple class to get parameters and handle execution of the tool"""

        self.catalog_dataset = arcpy.GetParameterAsText(0)
        input_items = arcpy.GetParameterAsText(1)
        self.input_items = input_items.strip("'").split(";")

        #define tool progressor
        num_items = len(self.input_items)
        self.step_progressor = False
        if num_items > 1 :
            # step progressor only if there are more than 1 item 
            # otherwise it's the default progressor
            self.step_progressor = True
            arcpy.SetProgressor("step", f"No of input items : {num_items}", 0, num_items + 1, 1)
        else:
            arcpy.SetProgressor("default", "Initializing parameters")

        item_types = arcpy.GetParameterAsText(2)
        if item_types:
            self.item_types = item_types.strip("'").split(";")
        else:
            self.item_types = list(CatalogDataset.item_type_descDatasetType.keys())
        if not item_types:
            self.dataset_types = CatalogDataset.descDatasetType_itemTypes.keys()
        else:
            self.dataset_types = []
            for item_type in self.item_types:
                dataset_type = CatalogDataset.item_type_descDatasetType.get(item_type)
                if dataset_type is not None:
                    self.dataset_types.append(dataset_type)
        self.dataset_types = set(self.dataset_types)  # remove duplicates
        self.include_subfolders = arcpy.GetParameter(3)
        footprint_type = arcpy.GetParameterAsText(4) or "ENVELOPE"
        self.isConvexHull = (footprint_type == "CONVEX_HULL")
        self.cd_desc = arcpy.da.Describe(self.catalog_dataset)
        self.cd_sr = self.cd_desc.get("spatialReference")
        # track items added
        self.added_items = 0
        self.skippedRowCount = 0
        return


    def add_items(self, cursor, catalogPath):
        """Adds individual items based on their dataset types """
        try:
            item_desc = CatalogDataset.Describe(catalogPath)
            catalogPath = item_desc.get("catalogPath")
            datasetType = item_desc.get("datasetType")
            dataType = item_desc.get("dataType")
            baseName = item_desc.get("baseName")
            cd_wksp_desc = self.cd_desc.get("workspace")
            uniquePathForLookup = ""
            if catalogPath.endswith((".lyr", ".lyrx")):
                catalogItem = CatalogDatasetItemLayerFile(
                        item_desc, self.cd_desc)
            elif datasetType == "FeatureClass":
                catalogItem = CatalogDatasetItemFC(item_desc, self.cd_desc, self.isConvexHull)
            elif dataType == "BimFileWorkspace" or \
                   (datasetType == "FeatureDataset" and \
                   baseName == "FloorPlan" and \
                   (os.path.split(catalogPath)[0].endswith(".rvt"))):
                catalogItem = CatalogDatasetItemBIMFile(item_desc, self.cd_desc)
            elif dataType == "ImageServer":
                item_desc = CatalogDataset.process_imagesvr(catalogPath)
                catalogItem = CatalogDatasetItemSvc(item_desc, self.cd_desc)
            else:
                catalogItem = CatalogDatasetItem(item_desc, self.cd_desc)

            useToChar = False
            try:
                if (cd_wksp_desc is not None and hasattr(cd_wksp_desc.connectionProperties, 'dbClient')):
                    useToChar = cd_wksp_desc.connectionProperties.dbClient == "oracle"
            except:
                pass
            if CatalogDataset.find_item(self.catalog_dataset, self.lookup_table if hasattr(self, 'lookup_table') else None, catalogItem.catalogDataPath, catalogItem.get_item_source(), True, useToChar):
                arcpy.AddIDMessage("INFORMATIVE",3961,catalogItem.get_item_name())
                self.skippedRowCount += 1
                return
            
            row = catalogItem.get_fields()
            cursor.insertRow(row)
            self.added_items = self.added_items + 1
            if hasattr(self, 'lookup_table'):
                self.lookup_table.add(catalogItem.catalogDataPath)
        except ValueError as ve:
            arcpy.AddIDMessage("WARNING", 3707, catalogPath, str(ve))
        except Exception as e:
            #arcpy.AddWarning(str(e)) #uncomment for debugging
            arcpy.AddIDMessage("WARNING", 3709, catalogPath)

    def workspace_factory(self, catalogPath, wksp_type):
        """assigns the proper workspace factory to gather individual items"""
        if wksp_type == "folder":
            return CDFolderWorkspace(catalogPath, self.item_types, self.include_subfolders)
        elif wksp_type == "rvt":  # BIM File workspace
            return CDBIMWorkspace(catalogPath, self.item_types)
        elif wksp_type == "acs":
            return CDACSWorkspace(catalogPath, self.item_types, self.include_subfolders)
        else:
            return CDWorkspace(catalogPath, self.item_types)

    def get_wksp_type(self, catalogPath):
        """gets the supported workspace types"""
        if os.path.isdir(catalogPath):
            if catalogPath.endswith(".gdb"):
                return "gdb"
            catalogPath_desc = arcpy.Describe(catalogPath)
            if (catalogPath_desc is not None) and (catalogPath_desc.dataType == "Tin"):
                return None
            return "folder"
        file_ext = os.path.splitext(catalogPath)[1]
        if file_ext in [".sde", ".geopackage", ".sqlite", ".rvt", ".geodatabase", ".acs"]:
            return file_ext[1:]
        return None

    def execute(self):
        #check for extension version
        if self.cd_desc["extensionProperties"]["version"] < CatalogDataset.curr_ver:
            arcpy.AddIDMessage("ERROR",3843,self.catalog_dataset)
            arcpy.AddIDMessage("WARNING", 3708)
            return
        # Build lookup table for finding duplicates
        self.lookup_table = CatalogDataset.getCatalogDatasetLookupTable(self.catalog_dataset)
        """Processes the input items one by one and adds it to the catalog Dataset"""
        edit = CatalogDataset.start_editing(self.catalog_dataset)
        try:
            with arcpy.da.InsertCursor(self.catalog_dataset, CatalogDataset.fields) as cursor:
                progressor_pos = 0
                for curr_data in self.input_items:
                    #remove single quotes if any - gp adds them for path with spaces
                    #remove any accidental spaces user may have entered
                    curr_data = curr_data.lstrip("'").rstrip("'").lstrip().rstrip()
                    # increment step progressor 
                    progressor_pos = progressor_pos + 1
                    msg = arcpy.GetIDMessage(86601)
                    arcpy.SetProgressorLabel(f"{msg} {progressor_pos} : {curr_data}")
                    if self.step_progressor:
                        #increment progressor position
                        arcpy.SetProgressorPosition(progressor_pos)
                    try:
                        wksp_type = self.get_wksp_type(curr_data)
                        if not wksp_type:  # not a workspace
                            # arcpy.Describe errors on MapServer root urls, so we handle it separately for now
                            if CDServiceItems.is_map_server_root_url(curr_data):
                                auth = None
                                cd_item = [curr_data]
                                # add to catalog dataset (total_new_items will be 0 or 1)
                                total_new_items, skipped_item_count = CDServiceItems(self.cd_desc, cursor, self.catalog_dataset, self.lookup_table).add_items(
                                    auth, cd_item)
                                self.added_items = self.added_items + total_new_items
                                self.skippedRowCount = self.skippedRowCount + skipped_item_count
                                if total_new_items > 0:
                                    arcpy.AddIDMessage("INFORMATIVE", 86598, curr_data)
                            else:
                                curr_data_desc = arcpy.Describe(curr_data)
                                # check for ServerConnection
                                if curr_data_desc.dataType == "ServerConnection":
                                    catalogPath = curr_data
                                    if not curr_data.endswith(".ags"):
                                        catalogPath = curr_data + ".ags"  # DEServerConnections drops extension
                                    cd_wksp = CDSvcConnWorkspace(
                                        catalogPath, self.item_types, self.include_subfolders)
                                    # gather service urls
                                    cd_items = cd_wksp.get_catalogitems()
                                    auth = ArcGISServerAuth(catalogPath)
                                    # add to catalog dataset
                                    total_new_items, skipped_item_count = CDServiceItems(self.cd_desc, cursor, self.catalog_dataset, self.lookup_table).add_items(
                                        auth, cd_items)
                                    arcpy.AddIDMessage("INFORMATIVE", 86597, total_new_items, curr_data)
                                    #we would have added service items
                                    self.added_items = self.added_items + total_new_items
                                    self.skippedRowCount = self.skippedRowCount + skipped_item_count
                                else:
                                    # process as individual datasets items
                                    curr_no_items = self.added_items
                                    self.add_items(cursor, curr_data)
                                    if self.added_items > curr_no_items:
                                        arcpy.AddIDMessage("INFORMATIVE", 86598, curr_data)
                        else:  # gather items in workspace
                            cd_wksp = self.workspace_factory(curr_data, wksp_type)
                            cd_items = cd_wksp.get_catalogitems()
                            start_skipped_count = self.skippedRowCount
                            start_num = self.added_items
                            for directory, subfolder, files in cd_items:
                                if directory and len(files) > 0:
                                    for f in files:
                                        catalogPath = os.path.join(directory, f)
                                        self.add_items(cursor, catalogPath)
                            num_items = self.added_items - start_num
                            num_skipped_items =  self.skippedRowCount - start_skipped_count
                            if num_skipped_items > 0 :
                               arcpy.AddIDMessage("INFORMATIVE",3960,str(num_skipped_items))
                            if num_items > 0 :
                                arcpy.AddIDMessage("INFORMATIVE", 86597, num_items, curr_data)
                            else:
                                arcpy.AddIDMessage("WARNING", 3706, curr_data)
                    except ValueError as ve:
                        arcpy.AddIDMessage("WARNING", 3707, curr_data, str(ve))
                        continue
                    except Exception as e:
                        #arcpy.AddWarning(str(e)) #uncomment for debugging
                        arcpy.AddIDMessage("WARNING", 3709, curr_data)
                        continue
            if self.added_items > 0:
                #manually recalculate extent since gp doesn't do it.
                try:
                    arcpy.management.RecalculateFeatureClassExtent(self.catalog_dataset)
                except:
                    pass
                arcpy.AddIDMessage("INFORMATIVE", 86602, self.added_items)
            else:
                arcpy.AddIDMessage("WARNING", 3708)
            del cursor
        except Exception as e:
            arcpy.AddIDMessage("ERROR",999998)
        CatalogDataset.stop_editing(edit)
        return


# run the script
if __name__ == '__main__':
    # Run the main script
    addItems = AddItemsToCatalogDataset()
    addItems.execute()
