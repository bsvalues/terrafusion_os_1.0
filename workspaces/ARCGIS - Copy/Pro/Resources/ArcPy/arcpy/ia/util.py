#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com


import arcpy
import logging
from typing import Optional
from datetime import datetime
from os.path import join, dirname
from urllib.parse import urljoin
import requests


def _is_polygon_feature_class(data):
    desc = arcpy.Describe(data)
    if not _is_feature_class(data) or desc.shapeType != 'Polygon':
        return False
    return True


def _is_feature_class(data):
    desc = arcpy.Describe(data)
    if desc.dataType in ['ShapeFile', 'FeatureClass', 'FeatureService', 'FeatureLayer']:
        return True
    return False


def _is_raster(data):
    try:
        arcpy.Raster(data, is_multidimensional=False)
        return True
    except Exception as e:
        try:
            arcpy.Raster(data, is_multidimensional=True)
            return True
        except Exception as e:
            return False


def _get_aoi_from_data_path(data_path):
    if _is_raster(data_path):
        aoi = data_path
    elif _is_polygon_feature_class(data_path):  # not a raster, must be a feature class
        return _get_polygon_from_feature_class(data_path)
    else:
        raise ValueError('{} is neither raster nor polygon feature class'.format(data_path))
    return aoi


def _get_aoi_from_layer(layer):
    if layer.isRasterLayer:
        return layer.dataSource
    elif layer.isFeatureLayer:
        return _get_polygon_from_feature_class(layer)
    else:
        raise ValueError("invalid data layer object")


def _get_polygon_from_feature_class(data):
    geometry = _get_geometry_from_feature_class(data)
    if not isinstance(geometry, arcpy.Polygon):
        raise ValueError("The geometry type is not polygon")
    return geometry


def _get_geometry_from_feature_class(data):
    geometry=None
    cursor = arcpy.da.SearchCursor(data, ["SHAPE@"])
    for row in cursor:
        geometry = geometry.union(row[0]) if geometry else row[0]
    return geometry


def get_aoi(aoi):
    if isinstance(aoi, str):
        aoi = _get_aoi_from_data_path(aoi)
    elif isinstance(aoi, arcpy.Result):  # make layer gp result
        aoi = _get_aoi_from_layer(aoi.getOutput(0))
    elif isinstance(aoi, arcpy.Raster) or \
            isinstance(aoi, arcpy.Extent) or \
            isinstance(aoi, arcpy.Polygon):
        aoi = aoi
    else:
        raise TypeError("invalid parameter: aoi")

    return aoi

def get_geometry(data):
    if data is None:
        return None
    if isinstance(data, str):
        if _is_raster(data):
            return arcpy.Raster(data).extent
        elif _is_feature_class(data):
            return _get_geometry_from_feature_class(data)
        else:
            raise ValueError('can\'t get geometry from data')
    elif isinstance(data, arcpy.Result):
        output = data.getOutput(0)
        if output.isRasterLayer:
            extent=arcpy.Raster(output.dataSource).extent
            return extent
        elif output.isFeatureLayer:
            return _get_geometry_from_feature_class(output)
        else:
            raise ValueError('invalid data layer object')
    elif isinstance(data, arcpy.Geometry) or isinstance(data, arcpy.Extent):
        return data
    else:
        raise ValueError("can\'t get geometry from data")


def convert_string_to_date_time(date_time_value, date_time_format=None, drop_tzinfo=False):
    from datetime import datetime
    date_time_object = ""
    if date_time_format is None:
        try:
            date_time_object =  datetime.strptime(date_time_value, '%Y-%m-%dT%H:%M:%S')
        except Exception as e:
            pass

    elif isinstance(date_time_format, str):
            try:
                date_time_object = datetime.strptime(date_time_value, date_time_format)
            except Exception as e:
                pass

    if date_time_object == "":
        try:
            import dateutil.parser
            date_time_object = dateutil.parser.parse(date_time_value)
            if drop_tzinfo:
                date_time_object = date_time_object.replace(tzinfo=None)
        except Exception as e:
            raise RuntimeError('Failed to parse ' + str(date_time_value))

    return date_time_object

def _get_stac_metadata_file(item, context=None):
    """
    This method is used to retrieve the metadata file of a valid STAC item.
    :param item: input STAC Item (JSON dictionary)
    :return string (URL of the STAC Item metadata file)
    """
    planetary_computer_map = {
        **dict.fromkeys(
            [
                "3dep-seamless",
                "3dep-lidar-dsm",
                "cop-dem-glo-30",
                "cop-dem-glo-90",
                "3dep-lidar-hag",
                "3dep-lidar-intensity",
                "3dep-lidar-pointsourceid",
                "noaa-c-cap",
                "3dep-lidar-returns",
                "3dep-lidar-dtm-native",
                "3dep-lidar-classification",
                "3dep-lidar-dtm",
                "gap",
                "alos-dem",
                "io-lulc",
                "drcog-lulc",
                "chesapeake-lc-7",
                "chesapeake-lc-13",
                "chesapeake-lu",
                "io-lulc-9-class",
                "io-biodiversity",
                "ecmwf-forecast",
            ],
            "data",
        ),
        **dict.fromkeys(
            [
                "sentinel-1-rtc",
                "hgb",
                "gnatsgo-rasters",
                "mobi",
                "chloris-biomass",
                "jrc-gsw",
                "hrea",
                "noaa-nclimgrid-monthly",
                "usda-cdl",
                "esa-cci-lc",
                "noaa-climate-normals-gridded",
                "noaa-cdr-sea-surface-temperature-whoi",
                "noaa-cdr-ocean-heat-content",
                "esa-worldcover",
                "modis-64A1-061",
                "modis-17A2H-061",
                "modis-11A2-061",
                "modis-17A2HGF-061",
                "modis-17A3HGF-061",
                "modis-09A1-061",
                "modis-16A3GF-061",
                "modis-21A2-061",
                "modis-43A4-061",
                "modis-09Q1-061",
                "modis-14A1-061",
                "modis-13Q1-061",
                "modis-14A2-061",
                "modis-15A2H-061",
                "modis-11A1-061",
                "modis-15A3H-061",
                "modis-13A1-061",
                "modis-10A2-061",
                "modis-10A1-061",
                "aster-l1t",
            ],
            "All COGs",
        ),
        **dict.fromkeys(
            [
                "daymet-annual-pr",
                "daymet-daily-hi",
                "gridmet",
                "daymet-annual-na",
                "daymet-monthly-na",
                "daymet-annual-hi",
                "daymet-monthly-hi",
                "daymet-monthly-pr",
                "terraclimate",
                "daymet-daily-pr",
                "daymet-daily-na",
            ],
            "zarr-https",
        ),
        **dict.fromkeys(
            [
                "sentinel-1-grd",
                "sentinel-3-olci-wfr-l2-netcdf",
                "sentinel-3-synergy-v10-l2-netcdf",
                "sentinel-3-olci-lfr-l2-netcdf",
                "sentinel-3-slstr-lst-l2-netcdf",
                "sentinel-3-slstr-wst-l2-netcdf",
                "sentinel-3-synergy-syn-l2-netcdf",
                "sentinel-3-synergy-vgp-l2-netcdf",
                "sentinel-3-synergy-vg1-l2-netcdf",
            ],
            "safe-manifest",
        ),
        **dict.fromkeys(
            [
                "esa-cci-lc-netcdf",
                "noaa-climate-normals-netcdf",
                "noaa-cdr-sea-surface-temperature-whoi-netcdf",
                "noaa-cdr-ocean-heat-content-netcdf",
            ],
            "netcdf",
        ),
        **dict.fromkeys(
            [
                "noaa-mrms-qpe-24h-pass2",
                "noaa-mrms-qpe-1h-pass1",
                "noaa-mrms-qpe-1h-pass2",
            ],
            "cog",
        ),
        **dict.fromkeys(["landsat-c2-l2", "landsat-c2-l1"], "mtl.txt"),
        **dict.fromkeys(["sentinel-2-l2a"], "product-metadata"),
        **dict.fromkeys(["mtbs"], "burn-severity"),
        **dict.fromkeys(["alos-fnf-mosaic"], "C"),
        **dict.fromkeys(["nrcan-landcover"], "landcover"),
        **dict.fromkeys(["nasadem"], "elevation"),
        **dict.fromkeys(["naip"], "image"),
    }
    earth_search_map = {
        **dict.fromkeys(["sentinel-s2-l2a-cogs", "sentinel-2-l2a"], 1),
        **dict.fromkeys(
            ["sentinel-s2-l2a", "sentinel-s2-l1c", "sentinel-2-l1c"],
            ("visual", "productInfo.json"),
        ),
        **dict.fromkeys(["naip"], "image"),
        **dict.fromkeys(["landsat-c2-l2"], "mtl.txt"),
        **dict.fromkeys(["sentinel-1-grd"], "safe-manifest"),
        **dict.fromkeys(["cop-dem-glo-30", "cop-dem-glo-90"], "data"),
    }
    sentinel_hub_map = {
        **dict.fromkeys(["sentinel-2"], ("data", "productInfo.json")),
        **dict.fromkeys(["sentinel-1"], ("s3", "manifest.safe")),
    }
    geoportal_azure_map = {
        "sentinel": ("S2_Level-2A_Product_Metadata", "MTD_MSIL2A.xml")
    }

    product_file_map = {
        "planetarycomputer.microsoft.com/api/stac": planetary_computer_map,
        "earth-search.aws.element84.com": earth_search_map,
        "services.sentinel-hub.com/api": sentinel_hub_map,
        "landsatlook.usgs.gov/stac-server": "self_href",
        "gpt.geocloud.com/sentinel/stac": "self_href",
        "geoportalstac.azurewebsites.net/stac": geoportal_azure_map,
    }
    processing_template = None
    if isinstance(context, dict) and context:
        context_lower = {k.lower(): v for k, v in context.items()}
        processing_template = context_lower.get("processingtemplate")
        asset_management = context_lower.get("assetmanagement")
        if asset_management:
            hrefs = _find_stac_asset_hrefs(item["assets"], context_lower)
            href_list = [href for href in hrefs.values() if href is not None]
            if not href_list:
                raise RuntimeError(
                    "No valid asset hrefs found. Please review the assetManagement parameter."
                )
            else:
                href_list = href_list if len(href_list) != 1 else href_list[0]
                if isinstance(href_list, str) and isinstance(processing_template, str):
                    href_list += rf"\{processing_template}"
                return href_list

    stacs = list(product_file_map.keys())

    self_link = next(
        (link["href"] for link in item["links"] if link["rel"] == "self"), None
    )

    if self_link is None:
        return

    item_stac = next((stac for stac in stacs if stac in self_link), None)

    if item_stac is None:
        return

    collection_id = (
        item["collection"]
        if "collection" in item
        else (
            item["properties"]["constellation"] if item_stac == stacs[2] else item["id"]
        )
    )

    target = (
        product_file_map[item_stac].get(collection_id)
        if isinstance(product_file_map[item_stac], dict)
        else product_file_map[item_stac]
    )

    href = None
    if isinstance(target, str):
        href = (
            f"StacItemHref/{self_link}"
            if target == "self_href"
            else (
                [
                    cog["href"]
                    for cog in item["assets"].values()
                    if cog["href"].endswith((".tif", ".tiff"))
                ]
                if target == "All COGs"
                else item["assets"][target]["href"]
            )
        )
    elif isinstance(target, int):
        href = item["links"][target]["href"]
    elif isinstance(target, tuple):
        directory = dirname(item["assets"][target[0]]["href"])
        if collection_id in ("sentinel", "sentinel-s2-l2a"):
            directory = dirname(directory)
        href = f"{directory}/{target[1]}"

    href = (
        rf"/vsis3{href[4:]}"
        if href is not None and isinstance(href, str) and href.startswith("s3")
        else href
    )

    if processing_template is None and (
        collection_id.startswith(
            ("sentinel-2", "sentinel-s2", "landsat-c2l2", "landsat-c2-", "sentinel_v1")
        )
        or collection_id == "sentinel"
    ):
        processing_template = "Multiband"

    if isinstance(href, str) and isinstance(processing_template, str):
        href += rf"\{processing_template}"

    return href


def _get_stac_links(stac_json, cat_filename, rel):
    """
    This method is used to retrieve all the links matching the specified relation type from a STAC Item or Catalog.
    :param stac_json: input STAC Item or Catalog (JSON dictionary).
    :param rel: relationship type used to filter  the links.
    :return list (of URLs matching the rel filter)
    """
    if "links" not in stac_json:
        raise RuntimeError(f"Invalid STAC Item/Catalog-\n{stac_json}")
    links = stac_json["links"]
    rel_links = [l for l in links if l["rel"] == rel]
    link_hrefs = [l["href"] for l in rel_links]

    all_links = []
    for l in link_hrefs:
        if l.startswith("http"):
            link = l
        else:
            source_href = dirname(cat_filename) + "/"
            link = (source_href, l)
        all_links.append(link)
    return all_links


def _get_all_stac_catalog_items(stac_json, filename, request_params={}, context=None):
    """
    This method is used to get all items from a STAC catalog and all its subcatalogs. Will traverse any subcatalogs recursively.
    :param stac_json: input Static STAC (Catalog - JSON dictionary)
    :param request_params: requests.get() method parameters used for the STAC Item and Catalog requests (passed through the RasterCollection.from_stac_catalog() method call).
    :return generator (of all items retrived in the Catalog)
    """
    for item_link in _get_stac_links(stac_json, filename, "item"):
        request_link = (
            urljoin(*item_link) if not isinstance(item_link, str) else item_link
        )
        item_resources = _get_static_catalog_item_resources(
            request_link, request_params, context
        )
        yield item_resources

    children = _get_stac_links(stac_json, filename, "child")
    for child in children:
        request_link = urljoin(*child) if not isinstance(child, str) else child
        child_res = requests.get(request_link, **request_params)
        if child_res.status_code != 200 or child_res.headers.get(
            "content-type"
        ) not in [
            "application/json",
            "application/geo+json",
            "application/json;charset=utf-8",
            "application/json; charset=utf-8",
            "binary/octet-stream",
            "application/octet-stream",
            "text/plain; charset=utf-8",
            "text/plain",
        ]:
            raise RuntimeError(f"Invalid STAC Catalog-\n{child_res.text}")
        child_json = child_res.json()
        yield from _get_all_stac_catalog_items(
            child_json, request_link, request_params, context
        )


def _get_static_catalog_item_resources(request_link, request_params={}, context=None):

    if isinstance(request_link, str):
        item_res = requests.get(request_link, **request_params)
        if item_res.status_code != 200 or item_res.headers.get("content-type") not in [
            "application/json",
            "application/geo+json",
            "application/json;charset=utf-8",
            "application/json; charset=utf-8",
            "application/octet-stream",
            "text/plain; charset=utf-8",
            "text/plain",
            "binary/octet-stream",
        ]:
            raise RuntimeError(f"Invalid STAC Item-\n{item_res.text}")
        item = item_res.json()
    else:
        request_link, item = request_link

    assets = item["assets"]

    processing_template = None
    if isinstance(context, dict) and context:
        context_lower = {k.lower(): v for k, v in context.items()}
        processing_template = context_lower.get("processingtemplate")
        asset_management = context_lower.get("assetmanagement")
        if asset_management:
            hrefs = _find_stac_asset_hrefs(assets, context_lower)
            href_list = [href for href in hrefs.values() if href is not None]
            if not href_list:
                raise RuntimeError(
                    "No valid asset hrefs found. Please review the assetManagement parameter."
                )
            else:
                href_list = href_list if len(href_list) != 1 else href_list[0]
                if isinstance(href_list, str) and isinstance(processing_template, str):
                    href_list += rf"\{processing_template}"
                return item, href_list

    product_file = None
    self_link_products = [
        "https://maxar-opendata.s3.amazonaws.com/events",
        "https://capella-open-data.s3.us-west-2.amazonaws.com/stac",
        "https://bdc-sentinel-2.s3.us-west-2.amazonaws.com",
    ]
    cog_composite_products = [
        "https://pta.data.lit.fmi.fi/stac",
        "https://storage.googleapis.com/cfo-public",
    ]

    if any(link in request_link for link in self_link_products):
        product_file = f"StacItemHref/{request_link}"
    elif "https://datacloud.icgc.cat/stac-catalog" in request_link:
        product_file = f"/vsicurl/{assets['visual']['href']}"
    elif "https://dop-stac.opengeodata.lgln.niedersachsen.de" in request_link:
        product_file = f"/vsicurl/{assets['rgbi']['href']}"
    elif "https://nz-imagery.s3-ap-southeast-2.amazonaws.com" in request_link:
        product_file = urljoin(request_link, assets["visual"]["href"])
    elif "https://raw.githubusercontent.com/m-mohr/oam-example/main" in request_link:
        product_file = assets["data"]["href"]
    elif any(link in request_link for link in cog_composite_products):
        product_file = [
            f"/vsicurl/{cog['href']}"
            for cog in item["assets"].values()
            if cog["href"].endswith((".tif", ".tiff"))
        ]

    if isinstance(product_file, str) and isinstance(processing_template, str):
        product_file += rf"\{processing_template}"

    return item, product_file


def _find_stac_asset_hrefs(assets, context):
    hrefs = {}
    asset_management = context.get("assetmanagement", {})
    if not isinstance(asset_management, list):
        asset_management = [asset_management]
    for asset_info in asset_management:
        if isinstance(asset_info, str):
            asset_key = asset_info
            asset_info = {"key": asset_key}
        else:
            asset_key = asset_info["key"]
        hrefs[asset_key] = _find_stac_asset_href(assets, asset_info)
    return hrefs


def _find_stac_asset_href(assets, asset_info):
    asset_key = asset_info["key"]
    href_key = asset_info.get("hrefKey", "href")
    asset_path = asset_info.get("path")

    if asset_key in assets:
        value = assets[asset_key]
        if asset_path:
            for key in asset_path:
                if key in value:
                    value = value[key]
                else:
                    return None
        if href_key in value:
            href = value[href_key]
            if href is not None and isinstance(href, str):
                if href.startswith("s3"):
                    href = rf"/vsis3{href[4:]}"
                elif ".blob.core.windows.net" in href or ".amazonaws.com" in href:
                    pass
                elif href.lower().startswith(
                    ("https://", "http://")
                ) and href.lower().endswith((".tiff", ".tif")):
                    href = f"/vsicurl/{href}"
            return href
    else:
        for value in assets.values():
            if isinstance(value, dict):
                href = _find_stac_asset_href(value, asset_info)
                if href:
                    return href
    return None


class ArcpyHandler(logging.Handler):
    """
    A class to handle logs for ArcPy.
    GP and Python script tools errors can be handled using arcpy.AddWarning and similar methods.
    This handler is designed to be used with the logging module for other arcpy methods.
    """
    def __init__(self, level=10):
        super().__init__(level=level)

    def emit(self, record):
        """
        Custom emit method that logs the record for this handler.
        This simply prints the message in order to work with the Python
        kernel in the Pro environment.
        """
        msg = self.format(record)
        print(msg)


def _get_logger(
    logger_name: Optional[str] = "arcpy_logger",
    log_level: Optional[str] = 10,
    log_format: Optional[logging.Formatter] = None,
    log_file: Optional[str] = None
):
    """
    This method creates a logger object that has two handlers: an ArcpyHandler and a FileHandler.
    This should be used if you need to log messages when using ArcPy. For GP tools, use
    arcpy.AddWarning and similar to get messages instead.
    """

    logger = logging.getLogger(name=logger_name)
    logger.setLevel(level=log_level)

    if log_file is None:
        temp_dir = arcpy.env.scratchFolder
        now = datetime.now()
        current_time = int(now.timestamp())
        file_name = f"{logger_name}_{current_time}.log"
        log_file = join(temp_dir, file_name)

    arcpy_handler = ArcpyHandler(level=log_level)
    arcpy_handler.setFormatter(log_format)
    logger.addHandler(arcpy_handler)
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(log_format)
    logger.addHandler(file_handler)

    return logger, log_file

def get_available_device(max_memory=0.8):
    """
    This method is used to select available device based on the memory utilization status of the device
    :param max_memory: the maximum memory utilization ratio that is considered available
    :return: GPU id that is available, -1 means no GPU is available/uses CPU, if GPUtil package is not installed, will
    return -1
    """

    try:
        import GPUtil
    except ModuleNotFoundError:
        return get_available_device_with_nvml(max_memory)

    GPUs = GPUtil.getGPUs()
    freeMemory = 0
    available = 0
    for GPU in GPUs:
        if GPU.memoryUtil > max_memory:
            continue
        if GPU.memoryFree >= freeMemory:
            freeMemory = GPU.memoryFree
            available = GPU.id

    return available

def get_available_device_with_nvml(max_memory=0.8):
    """
    This method is used to select available device based on the memory utilization status of the device using pynvml
    :param max_memory: the maximum memory utilization ratio that is considered available
    :return: GPU id that is available, -1 means no GPU is available/uses CPU, if pynvml package is not installed, will
    return -1
    """
    try:
        from pynvml import nvmlInit, nvmlDeviceGetCount, nvmlDeviceGetHandleByIndex, nvmlDeviceGetMemoryInfo

        max_memory = max_memory * (1024**3) # convert to bytes
        freeMemory = 0
        nvmlInit()
        deviceCount = nvmlDeviceGetCount()
        available = 0 if deviceCount > 0 else -1
        for i in range(deviceCount):
            handle = nvmlDeviceGetHandleByIndex(i)
            info = nvmlDeviceGetMemoryInfo(handle)
            if info.used > max_memory:
                continue
            if info.free >= freeMemory:
                freeMemory = info.free
                available = i

        return available
    except Exception:
        return -1
    
def GetSTACInfo(stac_url, verbose=False):
    """
    Retrieves information from a `STAC (SpatioTemporal Asset Catalog) <https://stacspec.org/en>`__ URL.

    This function fetches and parses information from a given STAC URL.
    It supports STAC `Catalogs <https://github.com/radiantearth/stac-spec/blob/master/catalog-spec/catalog-spec.md>`__,
    `Collections <https://github.com/radiantearth/stac-spec/blob/master/collection-spec/collection-spec.md>`__,
    `Items <https://github.com/radiantearth/stac-spec/blob/master/item-spec/item-spec.md>`__, and
    `ItemCollections <https://github.com/radiantearth/stac-api-spec/blob/release/v1.0.0/fragments/itemcollection/README.md>`__.
    The information is returned in a dictionary format.

    ====================================     ====================================================================
    **Parameter**                             **Description**
    ------------------------------------     --------------------------------------------------------------------
    stac_url                                 Required string. The URL of the STAC resource to fetch information from.
    ------------------------------------     --------------------------------------------------------------------
    verbose                                  Optional boolean. If set to True, detailed information is returned.
                                             If set to False, only essential information is returned.
                                             (The default is False)
    ====================================     ====================================================================

    :return: Dictionary containing the parsed information from the STAC URL.

    .. code-block:: python

        import arcpy

        # Example 1: Fetching detailed information from a STAC API (Planetary Computer)
        stac_info = arcpy.GetSTACInfo("https://planetarycomputer.microsoft.com/api/stac/v1", verbose=True)
        print(stac_info)

        # Example 2: Fetching essential information from a STAC Collection (Landsat C2-L2 collection on Planetary Computer)
        stac_info = arcpy.GetSTACInfo("https://planetarycomputer.microsoft.com/api/stac/v1/collections/landsat-c2-l2", verbose=False)
        print(stac_info)

        # Example 3: Fetching essential information from a STAC Item (NAIP data on Planetary Computer)
        stac_info = arcpy.GetSTACInfo("https://planetarycomputer.microsoft.com/api/stac/v1/collections/naip/items/wa_m_4712125_sw_10_060_20191029_20191217")
        print(stac_info)

        # Example 4: Fetching detailed information from an ItemCollection (NAIP data on Earth Search)
        stac_info = arcpy.GetSTACInfo("https://earth-search.aws.element84.com/v1/collections/naip/items", verbose=True)
        print(stac_info)
    """
    info = {}

    try:
        response = requests.get(stac_url)
        response.raise_for_status()
        data = response.json()

        if "stac_version" in data or stac_url.endswith("/collections"):
            if ("type" in data and data["type"] == "Catalog") or stac_url.endswith(
                "/collections"
            ):
                # It's a STAC Catalog or collections URL
                info["type"] = "Catalog"
                info["title"] = data.get("title")

                if stac_url.endswith("/collections"):
                    collections_url = stac_url
                else:
                    collections_url = f"{stac_url}/collections"

                collections_response = requests.get(collections_url)
                if collections_response.status_code == 200:
                    collections_data = collections_response.json()
                    collections = collections_data.get("collections", [])
                    if verbose:
                        info["collections"] = []
                        for collection in collections:
                            collection_info = collection
                            # Fetch queryables for each collection
                            queryables_url = (
                                f"{stac_url}/collections/{collection['id']}/queryables"
                            )
                            query_response = requests.get(queryables_url)
                            if query_response.status_code == 200:
                                queryables = query_response.json()
                                collection_info["queryables"] = queryables
                            info["collections"].append(collection_info)
                        info["links"] = collections_data.get("links", [])
                        info["miscellaneous"] = {
                            key: val for key, val in data.items() if key not in info
                        }
                    else:
                        info["collections"] = [
                            collection["id"] for collection in collections
                        ]
                        info["links"] = [
                            link["href"] for link in collections_data.get("links", [])
                        ]
                else:
                    info["collections"] = []
                    info["links"] = [link["href"] for link in data.get("links", [])]
                    info["miscellaneous"] = {
                        key: val for key, val in data.items() if key not in info
                    }
            elif "extent" in data:
                # It's a STAC Collection
                info["type"] = "Collection"
                info["id"] = data["id"]
                info["title"] = data.get("title")
                if verbose:
                    info["description"] = data.get("description")
                    info["properties"] = data.get("properties", {})
                    info["item_assets"] = data.get("item_assets", {})
                    info["assets"] = data.get("assets", {})
                    info["summaries"] = data.get("summaries", {})
                    info["links"] = data.get("links", [])

                    # Fetch queryables
                    queryables_url = f"{stac_url}/queryables"
                    query_response = requests.get(queryables_url)
                    if query_response.status_code == 200:
                        info["queryables"] = query_response.json()
                    info["miscellaneous"] = {
                        key: val for key, val in data.items() if key not in info
                    }
                else:
                    info["item_assets"] = list(data.get("item_assets", {}).keys())
                    info["assets"] = list(data.get("assets", {}).keys())
                    info["links"] = [link["href"] for link in data.get("links", [])]

                    # Fetch queryables
                    queryables_url = f"{stac_url}/queryables"
                    query_response = requests.get(queryables_url)
                    if query_response.status_code == 200:
                        queryables = query_response.json()
                        info["queryables"] = list(
                            queryables.get("properties", {}).keys()
                        )
            elif "type" in data and data["type"] == "Feature":
                # It's a STAC Item
                info["type"] = "Item"
                info["id"] = data["id"]
                info["title"] = data.get("title")
                info["bbox"] = data.get("bbox", [])
                if verbose:
                    info["geometry"] = data.get("geometry", {})
                    info["properties"] = data.get("properties", {})
                    info["assets"] = data.get("assets", {})
                    info["links"] = data.get("links", [])
                    info["miscellaneous"] = {
                        key: val for key, val in data.items() if key not in info
                    }
                else:
                    info["properties"] = list(data.get("properties", {}).keys())
                    info["assets"] = list(data.get("assets", {}).keys())
                    info["links"] = [link["href"] for link in data.get("links", [])]
            elif "type" in data and data["type"] == "FeatureCollection":
                # It's a STAC ItemCollection
                info = _parse_feature_collection(data, verbose)
            else:
                info["error"] = "Unknown STAC resource type"
        else:
            if "type" in data and data["type"] == "FeatureCollection":
                info = _parse_feature_collection(data, verbose)
            else:
                info["error"] = "Not a valid STAC resource"

    except requests.exceptions.RequestException as e:
        info["error"] = str(e)

    return info

def _parse_feature_collection(data, verbose):
    """This helper method is used to parse a STAC Feature/ItemCollection."""
    info = {"type": "FeatureCollection", "title": data.get("title")}
    if verbose:
        info["features"] = []
        for feature in data.get("features", []):
            feature_info = {
                "id": feature["id"],
                "geometry": feature.get("geometry", {}),
                "bbox": feature.get("bbox", []),
                "assets": feature.get("assets", {}),
            }
            feature_info["miscellaneous"] = {
                key: val for key, val in feature.items() if key not in feature_info
            }
            info["features"].append(feature_info)
        info["links"] = data.get("links", [])
    else:
        info["features"] = [
            {
                "id": feature["id"],
                "bbox": feature.get("bbox", []),
                "assets": list(feature.get("assets", {}).keys()),
            }
            for feature in data.get("features", [])
        ]
        info["links"] = [link["href"] for link in data.get("links", [])]
    return info
