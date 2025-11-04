"""-----------------------------------------------------------------------------
Name:              rasterutils.py
Purpose:           Helper methods for raster analysis scripts
Author:            Esri Inc.
Created:           9/1/2015
Copyright:   (c)   Esri, Inc. 2015
ArcGIS Version:    10.4
-----------------------------------------------------------------------------"""

import os
import re
import json
import ast
import shutil
from copy import deepcopy
from datetime import datetime
import ssl
import requests
import socket
import time
import multiprocessing as mp
import random
import pathlib
import tempfile
from urllib.parse import urlparse
from urllib.parse import urlencode
from urllib.parse import quote
from urllib.request import Request
from urllib.request import urlopen
from urllib.error import HTTPError
from urllib.error import URLError
from typing import List, Any

import arcpy
import aolutils
import hostedgp as hgp
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# Initialize hostedgp
hostedgp = hgp.HostedGP(None, None, False)

# Error code range:
# 120001-130000
TASK_ERROR_CODES = {
    "GenerateRaster":120001,
    "CopyRaster": 120002,
    "InterpolateIrregularData":120005,
    "MosaicImage": 120306,

    # Portal WebUI accessible tools (Error codes checked in at WebGIS arcgis-js-api, do NOT change)
    "SummarizeRasterWithin":120201,
    "CalculateDensity":120202,
    "InterpolatePoints":120203,
    "CreateViewshed":120207,
    "Watershed":120208,
    "ConvertFeatureToRaster":120211,
    "ConvertRasterToFeature":120212,
    "CalculateDistance": 120213,
    "DetermineTravelCostPathAsPolyline": 120214,
    "DetermineOptimumTravelCostNetwork": 120215,
    "CalculateTravelCost": 120216,
    "DetectObjectsUsingDeepLearning": 120218,
    "ClassifyPixelsUsingDeepLearning": 120219,
    "Sample": 120220,
    "OptimalRegionConnections": 120221,
    "ZonalStatisticsAsTable": 120222,
    "DistanceAccumulation": 120223,
    "DistanceAllocation": 120224,
    "OptimalPathAsLine": 120225,
    "OptimalPathAsRaster": 120226,
    "SurfaceParameters": 120227,
    "DeriveContinuousFlow": 120228,
    "ClassifyObjectsUsingDeepLearning": 120229,
    "AggregateMultidimensionalRaster": 120230,
    "FindArgumentStatistics": 120231,
    "GenerateMultidimensionalAnomaly": 120232,
    "GenerateTrendRaster": 120233,
    "PredictUsingTrendRaster": 120234,
    "ZonalStatistics": 120235,
    "ZonalGeometryAsTable": 120236,
    "TabulateArea": 120236,
    "GeodesicViewshed": 120237,

    # Classification service
    "Segment":120009,
    "Train":120010,
    "Classify":120011,
    # Orthomapping service
    "CreateImageCollection":0,
    "AddImageToImageCollection":0,
    "DeleteImageFromImageCollection":0,
    "ComputeControlPoints":0,
    "ComputeSensorModel":0,
    "GenerateDEM":0,
    "GenerateDOM":0,
}

errorMsgs = {
    120200: "Underlying Geoprocessing tool failed.",
    120301: "Your user role doesn't include the raster analysis privilege.",
    120302: "Image Server license is unavailable.",
    120303: "Your user role doesn't include the tiled imagery privilege.",
    120304: "Your user role doesn't include the dynamic imagery privilege.",
    120305: "Your need either hosted tiled imagery or hosted dynamic imagery privilege to create hosted imagery layer.",
    120306: "Target raster is not supported. Target has to be a image service referencing CRF format raster or a CRF format raster dataset path."
}

tasksForImageBasic = [
    "AddImageToImageCollection",
    "BatchPublishRaster",
    "BuildFootprints",
    "BuildMultidimensionalTranspose",
    "BuildOverview",
    "ComputeColorCorrection",
    "CopyRaster",
    "CreateImageCollection",
    "DefineNodata",
    "DeleteImageCollection",
    "DeleteImageFromImageCollection",
    "DownloadRaster",
    "EstimateRasterAnalysisCost",
    "ExecuteRasterAnalysisTasks",
    "GenerateSeamlines",
    "ListDatastoreContent",
    "ExportToTilePackage",
    "MosaicImage",
    "TransferFiles",
    "UpdateServiceConfiguration",
]

class LicenseError(Exception):
    pass


"""Initialization"""
def getToken(isurl, timeout=60):
    """
    This method is used to generate server token
    :param isurl: the image service url string
    :return: federated server token string
    """
    retry = 5
    token = ""
    referer = ""
    rehgp = hgp.HostedGP(None, None, False)
    try:
        # arcpy.AddMessage("url used for server token generation: {}".format(isurl))
        token, referer = rehgp.GetServerToken(isurl, timeout)
        # arcpy.AddMessage("token = " + token + " referer = " + referer)
    except Exception as err:
        while retry > 0:
            token, referer = rehgp.GetServerToken(isurl, timeout)
            if not token:
                retry -= 1
    finally:
        # if not token:
        #     arcpy.AddMessage("Cannot get server token.")
        return token, referer


def getOwningSystemUrl():
    rehgp = hgp.HostedGP(None, None, False)
    owning_system_url = rehgp.GetOwningSystem()

    if owning_system_url.endswith("/"):
        owning_system_url = owning_system_url.rstrip("/")

    return owning_system_url


def getPortalProperties():
    owning_system_url = getOwningSystemUrl()
    try:
        portal_self_url = owning_system_url + "/sharing/portals/self"
        params = {'f': 'json'}
        response = requests.get(portal_self_url, params, verify=False)
        if response.status_code == 200:
            return response.json()

    except Exception as err:
        arcpy.AddWarning("getPortalProperties Exception: " + str(err))
        return None


def getServerLogSettings():
    owning_system_url = getOwningSystemUrl()
    try:
        portal_self_url = owning_system_url + "/admin/logs/settings"
        token, referer = getToken(owning_system_url)
        params = {"f": "json", "token": token, "referer": referer}
        response = requests.get(portal_self_url, params, verify=False)
        if response.status_code == 200:
            return response.json()

    except Exception as err:
        arcpy.AddWarning("getServerLogLevel Exception: " + str(err))
        return None


def isServerDebugLogs():
    logSettings = getServerLogSettings()
    if logSettings != None and "logLevel" in logSettings:
        return logSettings["logLevel"] == "DEBUG"
    return False


def isEndeavour():
    portalProps = getPortalProperties()

    if portalProps == None:
        return False

    if 'portalDeploymentType' not in portalProps:
        return False

    return portalProps['portalDeploymentType'] == 'ArcGISEnterpriseOnKubernetes'


"""ArcGIS Online utility functions"""
def getPrivateRAUrl():
    raurl = ""
    try:
        rehgp = hgp.HostedGP(None, None, False)
        helpers = json.loads(rehgp.GetHelperServices())
        if "rasterAnalytics" in helpers:
            ra = helpers["rasterAnalytics"]
            if "url" in ra:
                raurl = ra["url"]
                if raurl and raurl.find("/rest/services"):
                    if not isEndeavour():
                        raurl = rehgp.GetPrivateUrl(raurl)
                    if raurl:
                        raurl = raurl[0:raurl.find("/rest/services")]
        arcpy.AddMessage("Raster Analytics helper service: {}".format(raurl))
        return raurl
    except Exception as err:
        arcpy.AddWarning("Raster Analytic services were not registered on Portal.")
        return raurl


def getPrivateHelperServiceUrl(name="rasterAnalytics"):
    """
    Lookup the helper service URL based on name
    @param name: current helper services are "rasterAnalytics", "orthoMapping", "rasterUtilities", "realityMapping"
    @return: private URL of the helper service
    """
    helperurl = ""
    try:
        rehgp = hgp.HostedGP(None, None, False)
        helpers = json.loads(rehgp.GetHelperServices())
        if name in helpers:
            helper = helpers[name]
            if "url" in helper:
                helperurl = helper["url"]
                if helperurl and helperurl.find("/rest/services"):
                    if not isEndeavour():
                        helperurl = rehgp.GetPrivateUrl(helperurl)
                    if helperurl:
                        helperurl = helperurl[0:helperurl.find("/rest/services")]
        return helperurl
    except Exception as err:
        arcpy.AddWarning(f"Helper service: {name} were not registered on Portal.")
        return helperurl


# Check and cache Raster Analytic helper service
RASTER_ANALYTIC_HELPER = getPrivateRAUrl()


# Check user privilege
RASTER_ANALYSIS_PRIVILEGE = "premium:publisher:rasteranalysis"
TILED_IMAGERY_PRIVILEGE = "portal:publisher:publishTiledImagery"
DYNAMIC_IMAGERY_PRIVILEGE = "portal:publisher:publishDynamicImagery"
def checkPrivilege(privilege):
    """
    :param privilege: privilege keys. e.g. "premium:publisher:rasteranalysis"
    :return: return True if certain privilege is in user's profile
    """
    rehgp = hgp.HostedGP(None, None, False)
    # for ArcGIS Online Imagery 8.2 beta 1, privilege keyword is:
    # "premium:publisher:rasteranalysis"
    # for upcoming Imagery beta release, the privilege will be split to
    # "portal:publisher:publishTiledImagery"
    # "portal:publisher:publishDynamicImagery"
    selfProfile = json.loads(rehgp.GetSelf())
    if "user" in selfProfile:
        if "privileges" in selfProfile["user"]:
            if privilege in selfProfile["user"]["privileges"]:
                return True
            else:
                return False

    if "appInfo" in selfProfile:
        if "privileges" in selfProfile["appInfo"]:
            if privilege in selfProfile["appInfo"]["privileges"]:
                return True
    return False


def checkRasterAnalysisPrivilege():
    rehgp = hgp.HostedGP(None, None, False)
    """checks for Raster Analysis privilege"""
    if not rehgp.CheckPrivilege(RASTER_ANALYSIS_PRIVILEGE):
        AddErrorCode(120301, errorMsgs[120301])
        raise Exception
    else:
        arcpy.AddMessage("Raster Analysis Privilege Check: OK")


def checkHostedImageryPrivilge():
    rehgp = hgp.HostedGP(None, None, False)
    """checks for hosted imagery privilege"""
    if not rehgp.CheckPrivilege(TILED_IMAGERY_PRIVILEGE) and not rehgp.CheckPrivilege(DYNAMIC_IMAGERY_PRIVILEGE):
        AddErrorCode(120305, errorMsgs[120305])
        raise Exception
    else:
        arcpy.AddMessage("Hosted Imagery Privilege Check: OK")


def checkTiledImageryPrivilege():
    rehgp = hgp.HostedGP(None, None, False)
    """checks for Tiled Imagery privilege"""
    if not rehgp.CheckPrivilege(TILED_IMAGERY_PRIVILEGE):
        AddErrorCode(120303, errorMsgs[120303])
        raise Exception
    else:
        arcpy.AddMessage("Tiled Imagery Privilege Check: OK")


def checkDynamicImageryPrivilege():
    rehgp = hgp.HostedGP(None, None, False)
    """checks for Dynamic Imagery privilege"""
    if not rehgp.CheckPrivilege(DYNAMIC_IMAGERY_PRIVILEGE):
        AddErrorCode(120304, errorMsgs[120304])
        raise Exception
    else:
        arcpy.AddMessage("Dynamic Imagery Privilege Check: OK")


def isAGOL():
    """
    Check if Raster Analytics service is running on ArcGIS Online
    :return: True if yes, False if no
    """
    raurl = RASTER_ANALYTIC_HELPER
    try:
        if raurl:
            # Check server system properties to verify AGOL
            spropurl = "https://localhost:6443/arcgis/admin/system/properties"
            # Have to regenerate token with raster analytic service URL
            token, referer = getToken(RASTER_ANALYTIC_HELPER)
            data = {"f": "json", "token": token, "referer": referer}
            r = requests.post(spropurl, params=data, verify=False)
            msgjson = r.json()
            if msgjson and "IsOnline" in msgjson:
                if msgjson["IsOnline"] is True or msgjson["IsOnline"] == "true":
                    arcpy.AddMessage("Running on ArcGIS Online.")
                    return True
        arcpy.AddMessage("Running on ArcGIS Image Server.")
    except Exception as expt2:
        return False
    return False


# Check ArcGIS Online environment
RUN_ON_AGOL = isAGOL()
RUN_ON_K8S = isEndeavour()

def getOrgId():
    """
    Look up organization ID from ArcGIS Online service URL from self call.
    :return: organization ID
    """
    orgid = ""
    try:
        rehgp = hgp.HostedGP(None, None, False)
        portalself = json.loads(rehgp.GetSelf())
        # arcpy.AddMessage("Self: {}".format(portalself))
        if "user" in portalself and "orgId" in portalself["user"]:
            orgid = portalself["user"]["orgId"]
            # arcpy.AddMessage("User: {}".format(portalself["user"]))

        if not orgid:
            arcpy.AddWarning("Cannot lookup current organization ID.")
        return orgid
    except Exception as err:
        arcpy.AddWarning("Exception: Cannot find current organization ID.")
        return ""


# Cached ArcGIS Organization ID
ORG_ID = getOrgId()

def getUserId():
    """
    Look up user ID from ArcGIS Online service URL from self call.
    :return: user ID
    """
    orgid = ""
    try:
        rehgp = hgp.HostedGP(None, None, False)
        portalself = json.loads(rehgp.GetSelf())
        # arcpy.AddMessage("Self: {}".format(portalself))
        if "user" in portalself and "id" in portalself["user"]:
            orgid = portalself["user"]["id"]
            # arcpy.AddMessage("User: {}".format(portalself["user"]))

        if not orgid:
            arcpy.AddWarning("Cannot lookup current User ID from Portal.")
        return orgid
    except Exception as err:
        arcpy.AddWarning("Exception: Cannot find current User ID.")
        return ""


# Cached ArcGIS User ID
USER_ID = getUserId()

def getUserName():
    """
    Look up user ID from ArcGIS Online service URL from self call.
    :return: user ID
    """
    username = ""
    try:
        rehgp = hgp.HostedGP(None, None, False)
        portalself = json.loads(rehgp.GetSelf())
        # arcpy.AddMessage("Self: {}".format(portalself))
        if "user" in portalself and "username" in portalself["user"]:
            username = portalself["user"]["username"]
            # arcpy.AddMessage("User: {}".format(portalself["user"]))

        if not username:
            arcpy.AddWarning("Cannot lookup current User Name from Portal.")
        return username
    except Exception as err:
        arcpy.AddWarning("Exception: Cannot find current User Name.")
        return ""


# Cached ArcGIS User ID
USER_NAME = getUserName()

def getDataStoreRegistry():
    """
    Look up data store registry URL
    """
    dsl_reg = ""
    raurl = RASTER_ANALYTIC_HELPER
    try:
        if raurl:
            # Check server system properties to verify AGOL
            spropurl = "https://localhost:6443/arcgis/admin/system/properties"
            # Have to regenerate token with raster analytic service URL
            token, referer = getToken(RASTER_ANALYTIC_HELPER)
            data = {"f": "json", "token": token, "referer": referer}
            r = requests.post(spropurl, params=data, verify=False)
            msgjson = r.json()
            if msgjson and "DataStoreRegistryEndpoint" in msgjson:
                if msgjson["DataStoreRegistryEndpoint"]:
                    dsl_reg = msgjson["DataStoreRegistryEndpoint"]
                    arcpy.AddMessage("Read Data Store info from Registry.")
                    return dsl_reg        
        return dsl_reg
    except Exception as err:
        return dsl_reg


# Cached data store registry URL
DATA_STORE_REGISTRY = getDataStoreRegistry()


"""Progressor logger"""
def getsocket():
    try:
        # with open("c:/temp/mplog.txt", "a") as f:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # get a random available port at local host
        s.bind(('', 0))
        return s
    except Exception as err:
        return None


def ProgressLogger(s, stopper):
    arcpy.AddMessage("Log progress in subprocess")
    while not stopper.is_set():
        try:
            message = s.recv(4096).decode()
            if message:
                arcpy.AddMessage(message)
            time.sleep(1)
        except socket.timeout:
            pass


def logprogress():
    try:
        s = getsocket()
        port = s.getsockname()[1]
        arcpy.AddMessage("Acquire random port for progress message.")
        arcpy.gp.command("SetProgressListener " + str(port))
        arcpy.AddMessage("Listening to port {}...".format(str(port)))
        s.connect(("localhost", port))
        stopper = mp.Event()
        logger = mp.Process(target=ProgressLogger, args=(s, stopper))
        logger.deamon = True
        logger.start()
        return logger, stopper
    except Exception as err:
        return None, None


def stopprogress(logger):
    if logger:
        arcpy.AddMessage("Stop listening to worker's progress.")
        if isinstance(logger, mp.Process):
            stopper = mp.Event()
            stopper.set()
            logger.join()
        else:
            raise TypeError


"""General utility function"""
def lower_dict_key(input_dict):
    """
    Convert dictionary keys to lower case for case-insensitive match in the future
    @param input_dict: input python dictionary
    @return: output a python dictionary that with all keys in lower case.
    """
    try:
        if isinstance(input_dict, dict):
            new_dict = {k.lower(): v for k, v in input_dict.items()}
            if new_dict:
                return new_dict
        return input_dict
    except Exception as err:
        return input_dict


def generate_directory(path):
    """
    This is the generic utility method to prepare a file share directory if it does not exist
    @param path: the path to be validated and generated
    @return: the full path being created, or None if it cannot be created
    """
    try:
        if not os.path.exists(path):
            # Need to make sure we don't create directory if the path is data store path
            if not path.startswith("/cloudStores") and \
                not path.startswith("/rasterStores") and \
                not path.startswith("/fileShares") and \
                not path.startswith("http"):
                os.makedirs(path)
                return path
        return path
    except Exception as err:
        return path


def generate_filename(filepath):
    """
    Generate unique file name
    :param filepath: input file path
    :return: unique file path, if file already existed, append time stamp
    """
    newname = filepath
    if os.path.exists(filepath):
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        oldname, ext = os.path.splitext(filepath)
        newname = oldname + timestamp + ext
        return generate_filename(newname)
    return newname


def rreplace(s, old, new, occurrence=1):
     li = s.rsplit(old, occurrence)
     return new.join(li)


def validateCert():
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    except Exception:
        return None


def safe_cast(val, to_type, default=None):
    try:
        return to_type(val)
    except (ValueError, TypeError):
        return default


def dict_merge(a, b):
    """
    recursively merges dict's. not just simple a['key'] = b['key'], if
    both a and b have a key who's value is a dict then dict_merge is called
    on both values and the result stored in the returned dictionary.
    """
    if not isinstance(b, dict):
        return b
    result = deepcopy(a)
    for k, v in b.items():
        if k in result and isinstance(result[k], dict):
                result[k] = dict_merge(result[k], v)
        else:
            result[k] = deepcopy(v)
    return result


def appendcrf(rasname):
    """
    :param rasname: input rastername
    :return: raster name with .crf extension
    """
    try:
        ext = os.path.splitext(rasname)[1]
        if not ext.lower() == ".crf" and rasname !="":
            rasname = rasname + ".crf"
        return rasname
    except Exception as err:
        return rasname


def eval_data_list(expr):
    """
    This is the utility method to evaluate list data store response. 
    Can be called when list data store is used in Analysis tools.
    Check if the string expression is a list, if expression is list, return as is.
    Otherwise return as string.
    :param expr: string expression
    :return: evaluated string or list
    """
    evalstr = ""
    try:
        evalstr = eval(expr)  
    except SyntaxError:
        if expr.startswith("[") and expr.endswith("]"):
            res = expr.strip('][').split(',')
            evalstr = [x.strip().strip('"') for x in res]
        else:
            evalstr = expr
    except Exception as err:
        return expr
        
    if isinstance(evalstr, list):
        for ds in evalstr:
            if isinstance(ds, dict):
                if "itemId" in ds:
                    dspath = _getDataStore(ds["itemId"].strip())
                    # Note: if it is an portal item id and no datastore item is found,
                    # it will be skipped later on.
                    if dspath:
                        evalstr[evalstr.index(ds)] = dspath
            else:
                continue
    else:
        if isinstance(evalstr, dict):
            if "itemId" in evalstr:
                dspath = _getDataStore(evalstr["itemId"].strip())
                # Note: if it is an portal item id and no datastore item is found,
                # it will be skipped later on.
                if dspath:
                    evalstr = dspath
    return evalstr


"""Support GP environment setting"""
def getFeatureServiceSR(fsurl, token, referer):
    """
    Get feature service spatial reference from service url. Only works for on
    premises service and public service.
    :param fsurl: feature service url
    :param fsurl: feature service url
    :return: spatial reference object
    """
    try:
        if fsurl == "" or fsurl == "#":
            return None

        # Check spatial reference at feature service or map service level
        # instead of on the layer.
        if fsurl.find("/FeatureServer/") > -1:
            fsurl = fsurl[:fsurl.find("/FeatureServer/")] + "/FeatureServer"
        if fsurl.find("/MapServer/") > -1:
            fsurl = fsurl[:fsurl.find("/MapServer/")] + "/MapServer"

        # Submit request to refresh item
        if token and referer:
            data = {"f": "json", "token": token, "referer": referer}
        else:
            data = {"f": "json"}

        r = requests.post(fsurl, params=data, verify=False)

        msgjson = r.json()
        if "spatialReference" in msgjson:
            srjson = msgjson["spatialReference"]
            if "wkid" in srjson:
                sr = arcpy.SpatialReference(srjson["wkid"])
                return sr
            elif "latestWkid" in srjson:
                sr = arcpy.SpatialReference(srjson["latestWkid"])
                return sr

        return None
    except Exception as err:
        return None


def getOutSR(context):
    """
    :param context: context parameter contains output spatial reference info
    :return wkid code or spatial reference object:
    """
    outsr = ""
    try:
        if context == "" or context == "#":
            # arcpy.AddMessage("Using input dataset's spatial reference.")
            return outsr

        contextdict = _parsecontext(context)
        if "outSpatialReference" in contextdict:
            return contextdict["outSpatialReference"]
        elif "outSR" in contextdict:
            srid = None
            vcswkid = None
            outsr = contextdict["outSR"]
            if "wkid" in outsr:
                srid = outsr["wkid"]
            elif "latestWkid" in outsr:
                srid = outsr["latestWkid"]
            # wkt refers to the well known text of the spatial reference 
            elif "wkt" in outsr:
                srid = outsr["wkt"]
            elif "wkt2" in outsr:
                srid = outsr["wkt2"]
            if "vcsWkid" in outsr:
                vcswkid = outsr["vcsWkid"]
            if srid:
                if vcswkid:
                    return arcpy.SpatialReference(srid, vcswkid)
                else:
                    return srid
    except:
        return outsr


def getExtent(context):
    """
    This method is used to convert the JSON presentation of extent (with spatial reference),
    MAXOF, and MINOF
    to arcpy.Extent object, so that it can be set to the GP environment.
    :param context: context parameter contains output spatial reference info
    :return geometry object and geometry coordinate
    """
    outext = arcpy.Extent
    extsr = ""
    try:
        if context == "" or context == "#":
            arcpy.AddMessage("Using full extent of input dataset.")
            return outext, extsr

        contextdict = _parsecontext(context)
        if "extent" in contextdict:
            extdict = contextdict["extent"]
            # Note: creating geometry directly from envelope JSON gave me a _passthrough
            # which does not provide a extent object.
            if "xmin" in extdict and "xmax" in extdict and "ymin" in extdict and "ymax" in extdict:
                xmin = extdict["xmin"]
                ymin = extdict["ymin"]
                xmax = extdict["xmax"]
                ymax = extdict["ymax"]
                extjson = {"rings": [
                    [[xmin, ymin], [xmin, ymax], [xmax, ymax], [xmax, ymin],
                     [xmin, ymin]]]
                }
                if "spatialReference" in extdict:
                    srdict = extdict["spatialReference"]
                    extjson.update({"spatialReference": srdict})
                    extsr = srdict

                    polygon = arcpy.AsShape(extjson, True)
                    outext = polygon.extent
                else:
                    outext = str(xmin) + " " + str(ymin) + " " + str(xmax) + " " + str(ymax)
            if "MAXOF" in extdict:
                outext="MAXOF"
            if "MINOF" in extdict:
                outext="MINOF"
        return outext, extsr
    except Exception as err:
        arcpy.AddMessage("Using full extent of input dataset.")
        return outext, extsr


def getOrigin(context):
    """
    This method is used when the client needs to customize the origin of raster
    to be created as hosted imagery layer.
    :return top left corner coordinates of the raster in the format of "<x> <y>"
    """
    origin = ""
    try:
        if context == "" or context == "#":
            return origin
        context = json.loads(context)
        context_dict = dict((k, v) for k, v in context.items())
        if "origin" in context_dict:
            origin = context_dict["origin"]
            if isinstance(origin, dict):
                if "x" in origin and "y" in origin:
                    if isinstance(origin["x"], int) and isinstance(origin["y"], int):
                        origin = str(origin["x"]) + " " + str(origin["y"])
        return origin
    except:
        return origin


def getGeoTrans(context):
    """
    This method is used to read the geotransformation value from the context parameter
    :return geographic transformation string
    """
    geotrans = ""
    try:
        if context == "" or context == "#":
            return geotrans
        context = json.loads(context)
        contextdict = dict((k, v) for k, v in context.items())
        if "geographicTransformations" in contextdict:
            geotrans = contextdict["geographicTransformations"]
            arcpy.AddMessage("Geographic Transformation applied: {}".format(geotrans))
        return geotrans
    except:
        return geotrans


def getCellsize(context):
    """
    This is the method to find cell size value input, sample JSON can look like
    this: {'cellSize': {'x': 11}} or {'cellSize': {'url': 'https://nonono'}}
    or {'cellSize': 'MaxOfIn'}}
    :param context: context parameter contains output raster cell size
    :return single square cell size floating point value or empty string
    """
    outcs = ""
    try:
        if context == "" or context == "#":
            arcpy.AddMessage("Output raster will be the same resolution as input.")
            return outcs

        contextdict = _parsecontext(context)
        if "cellSize" in contextdict:
            ps = contextdict["cellSize"]
            if isinstance(ps, dict):
                if "url" in ps:
                    isurl = ps["url"]
                    return isurl
            return ps
        return outcs
    except:
        arcpy.AddMessage("Output raster will be the same resolution as input.")
        return outcs


def getNodata(context):
    """
    This is the method to find nodata value from context input e.g. {'noData': 0}
    :param context: context parameter contains output raster cell size
    :return numeric value of nodata pixel
    """
    out_nodata = None
    try:
        if context == "" or context == "#":
            return out_nodata

        contextdict = _parsecontext(context)
        if "noData" in contextdict:
            out_nodata = contextdict["noData"]
        return out_nodata
    except:
        return out_nodata


def getCellAlignment(context):
    """
    This is the method to find cell alignment setting. The supported values
    are: Default, Align with Processing Extent, Align with Input.
    :param context: context parameter contains cell alignment keyword
    :return cell alignment or empty string
    """
    ca = ""
    try:
        if context == "" or context == "#":
            arcpy.AddMessage("Use default cell alignment.")
            return ca

        contextdict = _parsecontext(context)
        if "cellAlignment" in contextdict:
            ca = contextdict["cellAlignment"]
        return ca
    except:
        arcpy.AddMessage("Use default cell alignment.")
        return ca


def checkPyramids(out_raster):
    """
    This method is used to check if pyramids are already existed in the output from the out_raster
    :return
    1 is existed
    0 is not existed
    """
    has_pyramids = 0
    try:
        if out_raster == "":
            arcpy.AddMessage("No output created.")
        else:
            in_raster = arcpy.Raster(out_raster)
            raster_info = in_raster.getRasterInfo()
            jsonstring = raster_info.toJSONString()
            jsondict = json.loads(jsonstring)
            #arcpy.AddMessage("jsondict: {0}".format(jsondict))
            if "firstPyramidLevel" in jsondict and "maximumPyramidLevel" in jsondict:
                if jsondict["firstPyramidLevel"] < jsondict["maximumPyramidLevel"]:
                    has_pyramids = 1
                    arcpy.AddMessage("Output created with pyramids.")
        return has_pyramids

    except:
        arcpy.AddMessage("something is wrong to this output.")
        return has_pyramids

def getPyramids(context):
    """
    This method is used to read pyramids information from the context parameter
    :return pyramids
    The context is based on arcpy.env.pyramid(pyramid_option, {levels}, {interpolation_type},
    {pyramid_compression}, {compression_quality}, {skip_first})
    However, the pyramids was built by arcpy.management.BuildPyramids(in_raster_dataset,
    {pyramid_level}, {SKIP_FIRST}, {resample_technique}, {compression_type}, {compression_quality}, {skip_existing})
    This utility can point the key words from context to arcpy.management.BuildPyramids.
    """
    pyramids = {}
    try:
        if context == "" or context == "#":
            arcpy.AddMessage("Output raster will be the default as the gp tool.")
            return pyramids

        contextdict = _parsecontext(context)

        if "pyramid" in contextdict:
            pyramids = contextdict["pyramid"]
            arcpy.AddMessage("pyramid: {0}".format(pyramids))
            if "pyramid_option" not in pyramids:
                pyramids["pyramid_option"] = ''
            if "levels" not in pyramids:
                pyramids["levels"] = ''
            if "interpolation_type" not in pyramids:
                pyramids["interpolation_type"] = ''
            if "pyramid_compression" not in pyramids:
                pyramids["pyramid_compression"] = ''
            if "compression_quality" not in pyramids:
                pyramids["compression_quality"] = ''
            if "skip_first" not in pyramids:
                pyramids["skip_first"] = ''
            else:
                if pyramids["skip_first"] == "NO_SKIP":
                    pyramids["skip_first"] = "NONE"

            if "skip_existing" not in pyramids:
                pyramids["skip_existing"] = ''

        return pyramids
    except:
        arcpy.AddMessage("Output raster will be the default as the gp tool.")
        return pyramids


def validatecellsize(refcell, cellsize):
    """
    This private function is to validate the cell size value input.
    Besides supporting the actual value of the cell size, we also need
    to support a cell size factor.
    :param refcell: the reference dataset cell size
    :param cellsize: either a numeric value or JSON object of cell size factor
    :return: cell size value to generate output raster
    """
    try:
        if isinstance(cellsize, dict):
            if "factor" in cellsize:
                factor = safe_cast(cellsize["factor"], float)
                newcell = refcell * factor
                return newcell
        return cellsize
    except Exception as err:
        return cellsize
        

def getcompression(context):
    """
    This is the method to set the compression setting for raster output
    e.g. {"compression": ""}
    :param context: context parameter contains resampling method keyword
    :return compression setting string
    """
    compression = ""
    try:
        if context == "" or context == "#":
            return compression

        contextdict = _parsecontext(context)
        if "compression" in contextdict:
            compression = contextdict["compression"]
        return compression
    except:
        arcpy.AddMessage("Use default mask.")
        return compression


def getResamplingMethod(context):
    """
    This is the method to find resampling method setting. The supported values
    are: Bilinear, Nearest, Cubic. Note the sample resampling can also be achieved
    through the resampling function. It is recommended to do it that way.
    :param context: context parameter contains resampling method keyword
    :return single square cell size floating point value or empty string
    """
    rm = ""
    try:
        if context == "" or context == "#":
            arcpy.AddMessage("Use default resampling method.")
            return rm

        contextdict = _parsecontext(context)
        if "resamplingMethod" in contextdict:
            rm = contextdict["resamplingMethod"]
        return rm
    except:
        arcpy.AddMessage("Use default resampling method.")
        return rm


def getMask(context):
    """
    This is the method to set the mask environment setting from image service
    layer or feature service layer.
    e.g. {'mask': {'url': 'https://nodnafowenoir'}}
    :param context: context parameter contains resampling method keyword
    :return single square cell size floating point value or empty string
    """
    mask = ""
    try:
        if context == "" or context == "#":
            arcpy.AddMessage("Use default mask.")
            return mask

        contextdict = _parsecontext(context)
        if "mask" in contextdict:
            mask = contextdict["mask"]
            if isinstance(mask, dict):
                if "url" in mask:
                    isurl = mask["url"]
                    # Append token if in the input JSON
                    if "serviceToken" in mask:
                        isurlparam = isurl.split("?")
                        if "token=" not in isurl:
                            if len(isurlparam) > 1:                        
                                isurl = isurl + "&token=" + mask["serviceToken"]
                            else:
                                isurl = isurl + "?token=" + mask["serviceToken"]
                    return isurl
        return mask
    except:
        arcpy.AddMessage("Use default mask.")
        return mask


def getSnapRaster(context):
    """
    This is the method to create image service layer as snap raster environment
    setting.
    e.g. {'snapRaster': {'url': 'https://nodnafowenoir'}}
    :param context: context parameter contains resampling method keyword
    :return single square cell size floating point value or empty string
    """
    sras = ""
    try:
        if context == "" or context == "#":
            arcpy.AddMessage("Use default snap raster setting.")
            return sras

        contextdict = _parsecontext(context)
        if "snapRaster" in contextdict:
            sras = contextdict["snapRaster"]
            if isinstance(sras, dict):
                if "url" in sras:
                    isurl = sras["url"]
                    return isurl
        return sras
    except:
        arcpy.AddMessage("Use default snap raster setting.")
        return sras


def getQueryFilter(context):
    """
    This is the method to get any query filter setting from the environment
    e.g. {'where': "OBJECTID = 2"}
    :param context: context parameter contains resampling method keyword
    :return SQL Query expression string
    """
    where = ""
    try:
        if context == "" or context == "#":
            arcpy.AddMessage("No environment settings found.")
            return where

        contextdict = _parsecontext(context)
        if "where" in contextdict:
            where = contextdict["where"]

        return where
    except:
        arcpy.AddMessage("Invalid query filter defined.")
        return where


def getClipextent(jsongeo):
    """
    :param jsongeo: the JSON object of geometry
    :return: the extent JSON object of the geometry
    """
    try:
        # Check if the JSON geometry object has required keys
        # If yes, get four corners, raise exception if no
        if "rings" in jsongeo:
            rings = jsongeo["rings"]
            ring = rings[0]
            minx = min([x[0] for x in ring])
            miny = min([x[1] for x in ring])
            maxx = max([x[0] for x in ring])
            maxy = max([x[1] for x in ring])
            for ring in rings[1:]:
                minx = min(min([x[0] for x in ring]), minx)
                miny = min(min([x[1] for x in ring]), miny)
                maxx = max(max([x[0] for x in ring]), maxx)
                maxy = max(max([x[1] for x in ring]), maxy)

            strext = """{"xmin" : 0,
                          "ymin" : 0,
                          "xmax" : 0,
                          "ymax" : 0,
                          "spatialReference" : {}
                      }"""
            jsonext = json.loads(strext)
            jsonext["xmin"] = minx
            jsonext["ymin"] = miny
            jsonext["xmax"] = maxx
            jsonext["ymax"] = maxy
            if "spatialreference" in jsongeo:
                jsonext["spatialReference"] = jsongeo["spatialreference"]
            return jsonext
        # If clip geometry does not contain valid information to generate
        # extent, return None
        else:
            return None
    except KeyError:
        # arcpy.AddMessage("Invalid clip geometry or extent setting, image will not be clipped.")
        return None
    except Exception as err:
        arcpy.AddMessage(err)
        return None


def getparallelfactor(contextdict, default="ra"):
    """
    This is the utility method to parse the parallel processing factor environment
    variable.
    :param contextdict: the context parameter dictionary
    :param default: enum for different types of workflow.
                    ra = 80%
                    om = 50%
    :return: value for parallel processing factor
    """
    ppf = ""
    try:
        if "parallelProcessingFactor" in contextdict:
            ppf = contextdict["parallelProcessingFactor"]
        elif default == "ra":
            ppf = "80%"
        elif default == "om":
            ppf = "50%"

        # always run 100% on AGOL
        if RUN_ON_AGOL:
            ppf = "100%"

        return ppf
    except:
        return ppf


def getProcessorType(contextdict):
    """
    This is the utility method to parse the processor type environment variable.
    :param contextdict: the context parameter dictionary
    :return: string for processor type: either "CPU" or "GPU"
    """
    processortype = ""
    try:
        if "processorType" in contextdict:
            processortype = contextdict["processorType"]
        return processortype
    except:
        return processortype


def getRecycleProcessingWorkers(contextdict):
    """
    This is the utlity method to parse the recycle processing workers env variable
    :param contextdict: the context parameter dictionary
    :return: value for Recycle Interval of Processing Workers
    """
    recycleProcessingWorkers=""
    try:
        if "recycleProcessingWorkers" in contextdict:
            recycleProcessingWorkers = contextdict["recycleProcessingWorkers"]
        return recycleProcessingWorkers
    except:
        return recycleProcessingWorkers


def getRetryOnRandomFailures(contextdict):
    """
    This is the utlity method to parse the rretry On Random Failures env variable
    :param contextdict: the context parameter dictionary
    :return: value for Number of Retries on Random Failures
    """
    retryOnFailures=""
    try:
        if "retryOnFailures" in contextdict:
            retryOnFailures = contextdict["retryOnFailures"]
        return retryOnFailures
    except:
        return retryOnFailures

def getLogging(contextdict):
    """
    This is the utlity method to get the logging
    :param contextdict: the context parameter dictionary
    :return: True if logging is enabled else False
    """
    loggingEnabled=False
    try:
        if contextdict == "" or contextdict == "#":
            return loggingEnabled

        contextdict = _parsecontext(contextdict)
        if "logging" in contextdict:
            loggingEnabled = contextdict["logging"]
        return loggingEnabled
    except:
        return loggingEnabled


# Generate clip geometry from extent
def getClipgeo(jsongeo):
    """
    :param jsongeo: This must be a JSON object for extent
    :return: geometry JSON object
    """
    try:
        xmin = jsongeo["xmin"]
        ymin = jsongeo["ymin"]
        xmax = jsongeo["xmax"]
        ymax = jsongeo["ymax"]

        clipgeo = """{
                     "rings" : [],
                     "spatialReference" : {}
                  }"""
        jsongeoobj = json.loads(clipgeo)
        jsongeoobj["rings"] = [[[xmin, ymin],[xmin, ymax], [xmax, ymax], [xmax, ymin], [xmin, ymin]]]
        if "spatialreference" in jsongeo:
            jsongeoobj["spatialReference"] = jsongeo["spatialreference"]
        return jsongeoobj
    except KeyError:
        # arcpy.AddWarning("Invalid clip geometry or extent setting, image will not be clipped.")
        return None
    except Exception as err:
        arcpy.AddWarning(err)
        # If anything wrong with generate clip geometry, return None immediately
        return None


def getClipargs(rftdict, clipgeo):
    """
    TODO: make it more generic that can find clip function in any nested function template
    :param rftdict: this is the function template JSON dictionary
    :param clipgeo: The clipping geometry could have either geometry, extent, or both
    :return modified function template JSON dictionary :
    """
    try:
        # Read the clipping geometry JSON presentation
        jsongeo = json.loads(clipgeo.lower())
        arcpy.AddMessage("Clip geometry setting found, clipping the image...")

        # TODO: Find the clip function first
        # Looking for two types of keys:
        # 1. ClippingGeometry
        # 2. extent
        if "clippinggeometry" in jsongeo:
            rftdict["rasterFunctionArguments"]["Raster"]["rasterFunctionArguments"]["ClippingGeometry"] = jsongeo["clippinggeometry"]
            if "extent" in jsongeo:
                rftdict["rasterFunctionArguments"]["Raster"]["rasterFunctionArguments"]["extent"] = jsongeo["extent"]
            else:
                jsonext = getClipextent(jsongeo["clippinggeometry"])
                # If valid extent returned, set the value
                if jsonext != None:
                    rftdict["rasterFunctionArguments"]["Raster"]["rasterFunctionArguments"]["extent"] = jsonext
                # If invalid extent returned, erase ALL clip setting.
                else:
                    rftdict["rasterFunctionArguments"].pop("Raster")
        elif "extent" in jsongeo:
            rftdict["rasterFunctionArguments"]["Raster"]["rasterFunctionArguments"]["extent"] = jsongeo["extent"]
            jsongeoobj = getClipgeo(jsongeo["extent"])
            # If valid geometry returned, set the value
            if jsongeoobj != None:
                rftdict["rasterFunctionArguments"]["Raster"]["rasterFunctionArguments"]["ClippingGeometry"] = jsongeoobj
            # If invalid extent returned, erase ALL clip setting.
            else:
                rftdict["rasterFunctionArguments"].pop("Raster")
        else:
            arcpy.AddWarning("Invalidclip geometry or extent setting, image will not be clipped.")
            rftdict["rasterFunctionArguments"].pop("Raster")

        return rftdict
    except:
        # arcpy.AddWarning("Invalid clip geometry or extent setting, image will not be clipped.")
        rftdict["rasterFunctionArguments"].pop("Raster")
        return rftdict




"""Raster Aanlysis utility functions"""
def getPortalToken(timeout=60):
    """
    This method is used to generate portal token
    :param timeout: expiration of portal token
    :return: portal token string
    """
    retry = 5
    token = ""
    referer = ""
    try:
        rehgp = hgp.HostedGP(None, None, False)
        portalurl = rehgp.GetOwningSystem()
        try:
            token, referer = rehgp.GetServerToken(portalurl, timeout)
            # arcpy.AddMessage("token = " + token + " referer = " + referer)
        except Exception as err:
            while retry > 0:
                token, referer = rehgp.GetServerToken(portalurl, timeout)
                if not token:
                    retry -= 1
        finally:
            if not token:
                arcpy.AddError("Cannot get server token.")
            return token, referer
    except Exception as err:
        arcpy.AddWarning("Cannot get portal URL. Error: {0}".format(str(err)))
        return "", ""


def getDataFromItem(jsonstr, returnfile=False):
    """
    This is the utility method to download the item resource as file then return the contents
    :param jsonstr: portal itemId formated as {"itemId": "....."}
    :return: content of the file
    """
    try:
        rehgp = hgp.HostedGP(None, None, False)
        # 1. If the input is string, need to find the JSON object from the string
        # 2. If the input is already a JSON dictionary, pass through.
        if isinstance(jsonstr, str):
            jsondict = list(getJSON(jsonstr))
            if jsondict == []:
                arcpy.AddError("Cannot find valid JSON object from input.")
                return ""
            else:
                jsondict = jsondict[0]
                # arcpy.AddMessage("JSON object found is: "+str(jsondict))
        else:
            jsondict = jsonstr

        # Try to retrieve content if item is a file, otherwise return input as is
        if "itemId" in jsondict:
            itemid = jsondict["itemId"]

            scratchFolder = arcpy.env.scratchFolder
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            # Get item info for file name
            iteminfo = rehgp.GetItem(itemid)
            arcpy.AddMessage(iteminfo)
            if "name" in iteminfo:
                fname = "t" + timestamp + "_" + iteminfo["name"]
            else:
                fname = "itemdata_" + timestamp

            fpath = os.path.join(scratchFolder, fname)
            rehgp.GetItemDataAsFile(itemid, fpath)
            if returnfile:
                return fpath
            else:
                f = open(fpath, "r")
                fstr = f.read()

                return fstr
        else:
            return jsonstr

    except Exception as err:
        arcpy.AddError("Cannot read content of item. Exception: " + str(err))
        return ""


def deleteItem(itemid):
    """
    Method to delete existing portal item
    :param itemid: item id string
    :return: True if delete succeed, False if not
    """
    try:
        rehgp = hgp.HostedGP(None, None, False)
        rehgp.DeleteItem(itemid)
        return True
    except Exception as err:
        arcpy.AddWarning("Failed to delete portal item: {}".format(itemid))
        return False


def getISUrlFromItemID(itemid):
    """
    :param itemid: This is the item ID name
    :return isurl: The image service URL of the portal item
    :return aisurl: The image service admin URL of the portal item
    """
    # Get output service url
    try:
        rehgp = hgp.HostedGP(None, None, False)
        ijson = rehgp.GetItem(itemid)
        # arcpy.AddMessage("GetItem returns: {}".format(str(ijson)))
        private_isurl = ""
        if not ijson["url"]:
            if "Image Collection" in ijson["typeKeywords"] or "Image Collection" in ijson["type"]:
                portalhost = rehgp.GetOwningSystem()
                # arcpy.AddMessage("GetOwningSystem returns: " + portalhost)
                isurl = portalhost + "/sharing/rest/content/items/" + itemid
            else:
                isurl = itemid
        else:
            isurl = ijson["url"]
            if RUN_ON_K8S:
                # Use url in Endeavour as private url, because the true private is the ingress url, which is
                # inaccesible outside the cluster.
                private_isurl = ijson["url"]
            else:
                private_isurl = rehgp.GetPrivateUrl(ijson["url"])
            # arcpy.AddMessage("GetPrivateUrl returns: {0}".format(isurl))

        if private_isurl == "" or private_isurl == None:
            return itemid, ""
        else:
            # arcpy.AddMessage("The service got from item ID is: " + isurl)
            if RUN_ON_AGOL:
                aisurl = private_isurl.replace("rest/services", "rest/admin/services")
            else:
                aisurl = private_isurl.replace("rest/services", "admin/services").replace("/ImageServer", ".ImageServer")
            return isurl, aisurl

    except hgp.GPCloudExec as err:
        # arcpy.AddWarning(str(err))
        return itemid, ""
    except Exception as err:
        # arcpy.AddWarning(str(err))
        return itemid, ""


def getISUrlFromItemUrl(itemurl, token):
    """
    This function is used to get the image service url and admin url from item url
    :param itemurl: Item URL
    :return isurl: The image service URL of the portal item
    :return aisurl: The image service admin URL of the portal item
    """
    msg = "Cannot get image service URL from item URL: {0}".format(itemurl)
    isurl = ""
    aisurl = ""
    try:
        # Getting service info in JSON
        data = {"f": "json", "token": token}
        # data = urllib.urlencode(data)
        # req = urllib2.Request(itemurl, data)
        r = requests.post(itemurl, params=data, verify=False)

        iteminfo = r.json()
        isurl = iteminfo["item"]["url"]
        if isurl == "" or isurl == None:
            return itemurl, ""
        else:
            #arcpy.AddMessage("The image service URL is: {0}".format(isurl))
            if RUN_ON_AGOL:
                aisurl = isurl.replace("rest/services", "rest/admin/services")
            else:
                aisurl = isurl.replace("rest/services", "admin/services").replace("/ImageServer", ".ImageServer")
            return isurl, aisurl

    except Exception as err:
        arcpy.AddMessage("Cannot get image service URL from item URL: {0}".format(msg))
        arcpy.AddMessage("Excpetion: {0}".format(str(err)))
        return itemurl, ""


def getItemID(url):
    """
    This method is used to get the itemid from either item url or service url
    :param url: portal item url, or service url
    :return itemid: item id
    """
    itemid = ""
    try:
        token, referer = getToken(url, 5)
        isconfig = getServiceInfo(url, token, referer)
        arcpy.AddMessage(isconfig)
        if isconfig:
            if "portalProperties" in isconfig and "itemID" in isconfig["portalProperties"]:
                itemid = isconfig["portalProperties"]["itemID"]
            elif "portalProperties" in isconfig and "portalItems" in isconfig["portalProperties"]:
                itemidslist = isconfig["portalProperties"]["portalItems"]
                arcpy.AddMessage(str(itemidslist))
                if isinstance(itemidslist, list):
                    for iid in itemidslist:
                        if isinstance(iid, dict):
                            if "type" in iid and "itemID" in iid:
                                if iid["type"] == "ImageServer":
                                    return iid["itemID"]
        else:
            # Parse the input url to make sure it is itemURL
            if url.find("/content/items/") > -1:
                urldict = url.split("/")
                if urldict[-2] == "items":
                    itemid = urldict[-1]

        return itemid
    except Exception as err:
        arcpy.AddMessage(str(err))
        return itemid


def getISAdminUrl(isurl):
    """
    This method is used to get the image service admin URL from service URL
    :param isurl: image service url
    :return aisurl: image service admin url
    """
    try:
        if RUN_ON_AGOL:
            aisurl = isurl.replace("rest/services", "rest/admin/services")
        else:
            aisurl = isurl.replace("rest/services", "admin/services").replace("/ImageServer", ".ImageServer")
        return aisurl
    except Exception as err:
        arcpy.AddMessage(str(err))
        return isurl


def getOutRasterName(isurl):
    """
    This method is used to generate output raster name from image service url
    :param isurl: image service url
    :return outras: out raster name string
    """
    try:
        outras = isurl[isurl.find("/services/")+10:isurl.find("/ImageServer")]
        outras = outras.replace("/", "_")
        if outras == "":
            return isurl
        else:
            return outras
    except Exception as err:
        arcpy.AddMessage("getOutRasterName Exception: "+str(err))
        return isurl

def getServiceInfo(aisurl, token, referer, retries=3, backoff_factor=0.3,
          status_forcelist=(502, 503, 504)):
    """
    :param aurl: the output image service admin url
    :param token: the server admin token
    :param referer: the referer passed into the header
    :param retries: num retries (default 3)
    :param backoff_factor: exp backoff param (default 0.3)
    :return sinfo: the output image service definition in JSON
    """
    arcpy.AddMessage("Getting image service info...")
    sinfo = {}
    with requests.Session() as s:
        retries = Retry(
            total=retries,
            backoff_factor=backoff_factor,
            status_forcelist=status_forcelist)

        adapter = HTTPAdapter(max_retries=retries)
        s.mount('http://', adapter)
        s.mount('https://', adapter)

        data = {"f": "json", "token": token, "referer": referer}
        # arcpy.AddMessage("Finish constructing request")
        # arcpy.AddMessage("Image service url: {}".format(aisurl))
        # arcpy.AddMessage("Image server token: {}".format(token))
        # arcpy.AddMessage("Image server token referer: {}".format(referer))
        try:
            # No need to check certificate
            r = s.post(aisurl, data=data, headers={"referer": referer}, verify=False)
            r.raise_for_status()
            sinfo = r.json()
            # arcpy.AddMessage("Service info is: {0}".format(str(sinfo)))
            return sinfo
        except requests.exceptions.RequestException as e:
            arcpy.AddWarning("getServiceInfo Exception - {}".format(e))
            return sinfo

def getJSON(str):
    """
    :param str: string that may contain JSON objects
    :return: list of JSON objects
    """
    decoder = json.JSONDecoder(strict=False)
    # Find first possible JSON object start point
    sliceat = str.find('{')
    while sliceat != -1:
        # Slice off the non-object prefix
        str = str[sliceat:]
        try:
            # See if we can parse it as a JSON object
            obj, consumed = decoder.raw_decode(str)
        except Exception:
            # If we couldn't, find the next open brace to try again
            sliceat = str.find('{', 1)
        else:
            # If we could, yield the parsed object and skip the text it was parsed from
            yield obj
            sliceat = consumed


def getOutRasterPath(jsonstr, isHosted=True):
    """
    :param injson: JSON object string describes the raster dataset as output.
                   e.g. {"serviceProperties": {"name": "servicename"}, "itemProperties":{}}
                        {"url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis"}
                        {"itemId": "no213u0uiif8924989h98h0123"}
    :return: itemId, image service url, image service admin url and crf path - if available
             when on ArcGIS Online the output name should have user_id folder attached
    """
    try:
        jsondict = {}
        if isinstance(jsonstr, str):
            jsondict = list(getJSON(jsonstr))[0]
        elif isinstance(jsonstr, dict):
            jsondict = jsonstr
        
        # arcpy.AddMessage("JSON object found is: "+str(jsondict))
        # Read item properties
        if "itemProperties" in jsondict:
            iprops = jsondict["itemProperties"]
        else:
            iprops = {}

        iid = ""
        isurl = ""
        aisurl = ""
        outras = ""
        is_hosted = True
        # Read service properties
        if "itemId" in jsondict:
            iid = jsondict["itemId"]
            isurl, aisurl = getISUrlFromItemID(iid)
            outras = getOutRasterName(isurl)
            # return iid, isurl, aisurl, outras
        elif "url" in jsondict:
            isurl = jsondict["url"]
            aisurl = getISAdminUrl(isurl)
            iid = getItemID(aisurl)
            outras = getOutRasterName(isurl)
            # return "", isurl, aisurl, outras
        elif "uri" in jsondict:
            outras = jsondict["uri"]
            # return "", "", "", jsondict["uri"]
        # Typical JSON object of the output can look like this:
        # {"serviceProperties": {"name": "xxx", "serviceUrl": "xxx"},
        #  "itemProperties": "xxxxxxxx"}
        # We want to check whether the service exists
        # if not, create service then return portal itemId
        # if already exists, return itemId if available
        # if no itemId then return serviceUrl.
        elif "serviceProperties" in jsondict:
            # Read service properties
            sprops = jsondict["serviceProperties"]
            # Read item properties at the same level as "serviceProperties"
            if "itemProperties" in jsondict:
                iprops = jsondict["itemProperties"]
            else:
                iprops = {}

            # Check if the input is already a existing service, if yes, skip creation request
            if "itemId" in iprops:
                iid = iprops["itemId"]
                isurl, aisurl = getISUrlFromItemID(iid)
                outras = getOutRasterName(isurl)
            elif "serviceUrl" in sprops:
                isurl = sprops["serviceUrl"]
                aisurl = getISAdminUrl(isurl)
                iid = getItemID(aisurl)
                outras = getOutRasterName(isurl)
            elif "url" in sprops:
                isurl = sprops["url"]
                aisurl = getISAdminUrl(isurl)
                iid = getItemID(aisurl)
                outras = getOutRasterName(isurl)
            else:
                # check service existence, return if create successfully
                if "name" in sprops:
                    if "folderId" in iprops:
                        # arcpy.AddMessage("Creating item {0} under {1}".format(iid, iprops["folderId"]))
                        iid = _createService(sprops, iprops["folderId"], itemProperties=iprops, isHosted=isHosted)
                    else:
                        iid = _createService(sprops, itemProperties=iprops, isHosted=isHosted)
                        # arcpy.AddMessage("Created item {}".format(iid))
                    if iid:
                        isurl, aisurl = getISUrlFromItemID(iid)
                        outras = sprops["name"]
                        # When tools are running on ArcGIS Online, always create
                        # output in user ID subfolder.
                        # Note: For mosaic dataset image collection, replace / with _
                        if RUN_ON_AGOL:
                            orgid = getOrgId()
                            if iid and orgid:
                                outras = "/cloudStores/" + orgid + "/" + iid + "/" + outras
                        return iid, isurl, aisurl, outras
            
            # return iid, isurl, aisurl, outras
        elif "itemId" in iprops:
            iid = iprops["itemId"]
            isurl, aisurl = getISUrlFromItemID(iid)
            outras = "id_" + iid
            # return iid, isurl, aisurl, outras
        else:
            arcpy.AddError("No available raster data path in JSON: "+jsonstr)
            return "", "", "", ""

        # When tools are running on ArcGIS Online, always create
        # output in org container, and always create iid folder.
        # Note: For mosaic dataset image collection, replace / with _
        if RUN_ON_AGOL:
            orgid = getOrgId()
            if iid and orgid:
                outras = "/cloudStores/" + orgid + "/" + iid + "/" + outras

        return iid, isurl, aisurl, outras
    except Exception as err:
        arcpy.AddError("Cannot get output raster data path. Exception: "+str(err))
        return "", "", "", ""


# TODO: split the function so that the return type is consistent (now it could return string/dict/list)
def getInDataPath(jsonstr):
    """
    :param jsonstr:
    Either a JSON object string describes the raster dataset or feature class as input or a JSON dictionary.
    e.g. single item:
    {"folderId": ''}
    {"itemId": "no213u0uiif8924989h98h0123"}
    {"url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis"}
    {"uri": "http://pds31:29080/suitabilityanalysis_1230414"}
    multiple items with renderingRule and mosaicRule:
    {"itemIds": [{"itemId": "no213u0uiif8924989h98h0123", "renderingRule": {...}, "mosaicRule": {...}},
     {"itemId": "no213u0uiif8924989h98h0124", "renderingRule": {...}, "mosaicRule": {...}},
     {"itemId": "no213u0uiif8924989h98h0125", "renderingRule": {...}, "mosaicRule": {...}}]}
    {"urls": [{"url": "https://...", "renderingRule": {...}, "mosaicRule": {...}},
     {"url": "https://...", "renderingRule": {...}, "mosaicRule": {...}},
     {"url": "https://...", "renderingRule": {...}, "mosaicRule": {...}}]}
    {"tiled_url": ""}
    {"tiled_urls": []}
    :return: if string - raster path, image service url or the name of the hosted raster item;
             if JSON dictionary - single raster item with renderingRule/mosaicRule etc.
             if list - multiple raster items or multiple raster JSON objects
    """
    try:
        rehgp = hgp.HostedGP(None, None, False)
        # The input data's JSON can be already parsed (in Generate Raster's case)
        # 1. If the input is string, need to find the JSON object from the string
        # 2. If the input is already a JSON dictionary, pass through.
        if isinstance(jsonstr, str):
            jsonstr = jsonstr.replace("\\n","")
            jsondict = list(getJSON(jsonstr))
            if jsondict == []:
                #arcpy.AddWarning("Input data is not a valid JSON.")
                return ""
            else:
                jsondict = jsondict[0]
                #arcpy.AddMessage("JSON object found is: "+str(jsondict))
        else:
            jsondict = jsonstr

        # Create a new boolean variable to decide whether to return JSON
        returnJSON = False

        # Check if input raster JSON has rendering rule or mosaic rule info
        if jsondict and isinstance(jsondict, dict):
            # Also return entire JSON if "downloadName" is in it
            if jsondict.keys() & {"renderingRule", "mosaicRule", "downloadName", "function"}:
                returnJSON = True

        #arcpy.AddMessage("Input Raster:"+str(jsondict))
        if "url" in jsondict:
            isurl = jsondict["url"]
            # Append token if in the input JSON
            if "serviceToken" in jsondict:
                isurlparam = isurl.split("?")
                if "token=" not in isurl:
                    if len(isurlparam) > 1:                        
                        isurl = isurl + "&token=" + jsondict["serviceToken"]
                    else:
                        isurl = isurl + "?token=" + jsondict["serviceToken"]
            outras = isurl
            if returnJSON:
                return jsondict
            else:
                return outras
        elif "itemId" in jsondict:
            iid = jsondict["itemId"]
            isurl, aisurl = getISUrlFromItemID(iid)
            # Append token if in the input JSON
            if "serviceToken" in jsondict:
                isurlparam = isurl.split("?")
                if "token=" not in isurl:
                    if len(isurlparam) > 1:                        
                        isurl = isurl + "&token=" + jsondict["serviceToken"]
                    else:
                        isurl = isurl + "?token=" + jsondict["serviceToken"]
            outras = isurl

            if returnJSON:
                jsondict.pop("itemId", None)
                jsondict["url"] = outras
                return jsondict
            else:
                # Check for embedded "renderingRule" and "mosaicRule" in item data
                # if not specified from the input.
                rr_mr = _getItemJSONData(iid, ["renderingRule", "mosaicRule"])
                # if either renderingRule or mosaicRule found, return JSON
                if rr_mr.keys() & {"renderingRule", "mosaicRule"}:
                    jsondict.pop("itemId", None)
                    jsondict["url"] = outras
                    jsondict.update(rr_mr)
                    return jsondict
                return outras
        elif "tiled_url" in jsondict:
            isurl = jsondict["tiled_url"]
            srcras = getImageServiceDatasource(isurl)
            if srcras and srcras.lower().endswith(".crf"):
                return srcras
            else:
                arcpy.AddMessage("Service is not TiledOnly image service: {}".format(isurl))
                return ""
        elif "uri" in jsondict:
            outras = jsondict["uri"]
            if returnJSON:
                return jsondict
            else:
                return outras
        elif "tiled_urls" in jsondict:
            # tiled_urls means all inputs are Tiled Only image service URL
            outras = []
            tiledurls = jsondict["tiled_urls"]
            if isinstance(tiledurls, list):
                for url in tiledurls:
                    # Need to check for dictionary item because url may contain rendering ruls/mosaic rules
                    if isinstance(url, dict):
                        # Check if JSON contains URL
                        if "tiled_url" in url:
                            srcras = getImageServiceDatasource(url["tiled_url"])
                            if srcras and srcras.lower().endswith(".crf"):
                                outras.append(srcras)
                            else:
                                arcpy.AddMessage("Service is not TiledOnly image service: {}".format(url["tiled_url"]))
                        else:
                            continue
                    else:
                        srcras = getImageServiceDatasource(url)
                        if srcras and srcras.lower().endswith(".crf"):
                            outras.append(srcras)
                        else:
                            arcpy.AddMessage("Service is not TiledOnly image service: {}".format(url))
            return outras
        # Now supporting Raster array input
        # e.g. {"itemIds": ["no213u0uiif8924989h98h0123","no213u0uiif8924989h98h0124","no213u0uiif8924989h98h0125"]}
        # Returning string separating different inputs with comma
        elif "itemIds" in jsondict:
            outras = []
            iids = jsondict["itemIds"]
            # Make sure itemIds is a list
            if isinstance(iids, list):
                for iid in iids:
                    # Note: iid could also be a JSON image layer
                    # Note: getISUrlFromItemID will return item url if id is uploaded image instead of image service url
                    if isinstance(iid, dict):
                        # Check if JSON contains itemId
                        if "itemId" in iid:
                            isurl, aisurl = getISUrlFromItemID(iid["itemId"])
                            if not isurl:
                                continue
                            else:
                                # Replace itemId with URL, dump JSON to string
                                iid.pop("itemId", None)
                                # Append token if in the input JSON
                                if "serviceToken" in iid:
                                    isurlparam = isurl.split("?")
                                    if "token=" not in isurl:
                                        if len(isurlparam) > 1:                        
                                            isurl = isurl + "&token=" + iid["serviceToken"]
                                        else:
                                            isurl = isurl + "?token=" + iid["serviceToken"]
                                iid["url"] = isurl
                                outras.append(iid)
                        else:
                            continue
                    else:
                        isurl, aisurl = getISUrlFromItemID(iid)
                        if not isurl:
                            continue
                        else:
                            ijson = {}
                            # check if the item data contains renderingRule and mosaicRule
                            rr_mr = _getItemJSONData(iid, ["renderingRule", "mosaicRule"])
                            # if either renderingRule or mosaicRule found, return JSON
                            if rr_mr.keys() & {"renderingRule", "mosaicRule"}:
                                ijson["url"] = isurl
                                ijson.update(rr_mr)
                                outras.append(ijson)
                            else:
                                outras.append(isurl)

            return outras
        # URLs array input
        # Returning list of urls
        elif "urls" in jsondict:
            outras = []
            isurls = jsondict["urls"]
            # Make sure urls is a list
            if isinstance(isurls, list):
                for url in isurls:
                    # Need to check for dictionary item because url may contain rendering ruls/mosaic rules
                    if isinstance(url, dict):
                        # Check if JSON contains URL
                        if "url" in url:
                            isurl = url["url"]
                            # Append token if in the input JSON
                            if "serviceToken" in url:
                                isurlparam = isurl.split("?")
                                if "token=" not in isurl:
                                    if len(isurlparam) > 1:                        
                                        isurl = isurl + "&token=" + url["serviceToken"]
                                    else:
                                        isurl = isurl + "?token=" + url["serviceToken"]
                                    url["url"] = isurl
                            outras.append(url)
                        else:
                            continue
                    else:
                        outras.append(url)

            return outras
        elif "uris" in jsondict:
            outras = []
            uris = jsondict["uris"]
            if isinstance(uris, list):
                for uri in uris:
                    if isinstance(uri, dict):
                        # Check if JSON contains URI
                        if "uri" in uri:
                            outras.append(uri)
                        else:
                            continue
                    else:
                        outras.append(uri)

            return outras
        elif "folderId" in jsondict:
            outras = ""
            fldId = jsondict["folderId"]
            arcpy.AddMessage("folderId: " + str(fldId))
            # Get list of itemIds in a folder
            fjson = rehgp.GetFolderContent(fldId)
            arcpy.AddMessage("folder JSON content: " + str(fjson))
            if "items" in fjson:
                ilist = fjson["items"]
                arcpy.AddMessage("folder content: " + str(ilist))
                for iid in ilist:
                    if "type" in iid and "id" in iid:
                        if iid["type"] == "Image":
                            isurl, aisurl = getISUrlFromItemID(iid["id"])
                            if isurl == "":
                                continue
                            else:
                                outras = ",".join([outras, isurl])
                        else:
                            continue
                    else:
                        continue
                return outras[1:].strip()
            else:
                return ""
        elif "images" in jsondict:
            outras = ""
            images = jsondict["images"]
            if isinstance(images, list):
                for image in images:
                    outras = ",".join([outras, getInDataPath(image)])
            else:
                outras = ",".join([outras, getInDataPath(images)])
            return outras[1:].strip()
        elif "function" in jsondict:
            return jsondict
        else:
            # arcpy.AddError("No available raster data path in JSON: "+jsonstr)
            return json.dumps(jsondict)

    except Exception as err:
        # arcpy.AddError("Cannot get input raster data path. Exception: "+str(err))
        return ""


def parse_feature_input(feature, param, index):
    """
    :param feature: string value of a feature input for the analytic tools. Variation of the input could be:
    1) feature service url 2) feature service JSON 3) feature collection JSON
    :return: feature input that is acceptable by the raster analytic tool
    """
    feature_name = feature
    try: 
        if checkIfFeatureCollection(feature):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, param, index)
            feature_name = Input.name
        # Now parsing the input raster
        else:
            feature_name = getInDataPath(feature)
            if isinstance(feature_name, str) \
                and (feature_name.find("/FeatureServer/") > -1 \
                or feature_name.find("/MapServer/") > -1):
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, param, index)
                feature_name = Input.name
            elif isinstance(feature_name, dict):
                feature_name= json.dumps(feature_name)

        return feature_name
    except Exception as err:
        return feature_name


def JSON_to_feature(feature_obj):
    """
    THis utility method is used to convert GeoJSON or EsriJSON object to in memory feature class
    @param feature_obj: GeoJSON or EsriJSON of a feature class
    @return: in_memory feature class or return the input as is if the conversion failed
    """
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            feat_json_file = os.path.join(temp_dir, "temp_feature.json")
            with open(feat_json_file, 'w') as f:
                f.write(feature_obj)
            arcpy.conversion.JSONToFeatures(feat_json_file, "memory/temp_feat")
            return "memory/temp_feat"

    except Exception as err:
        return feature_obj


def deleteHostedItem(jsonstr):
    """
    :param jsonstr:
    Either a JSON object string describes the hosted service item or URL
    e.g. single item:
    {"itemId": "no213u0uiif8924989h98h0123"}
    {"url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis"}
    :return: delete success or not
    """
    deleteSuccess = False
    try:
        rehgp = hgp.HostedGP(None, None, False)
        # The input data's JSON can be already parsed (in Generate Raster's case)
        # 1. If the input is string, need to find the JSON object from the string
        # 2. If the input is already a JSON dictionary, pass through.
        if isinstance(jsonstr, str):
            jsondict = list(getJSON(jsonstr))
            if jsondict == []:
                # arcpy.AddWarning("Input data is not a valid JSON.")
                return ""
            else:
                jsondict = jsondict[0]
                # arcpy.AddMessage("JSON object found is: "+str(jsondict))
        else:
            jsondict = jsonstr

        # arcpy.AddMessage("Input Raster:"+str(jsondict))
        if "itemId" in jsondict:
            iid = jsondict["itemId"]
            ijson = rehgp.GetItem(iid)
            ditemurl = ""
            # arcpy.AddMessage("GetItem returns: {}".format(str(ijson)))
            if not ijson["owner"]:
                pass
            else:
                ditemurl = "content/users/" + ijson["owner"] + "/items/" + iid + "/delete"

            if ditemurl:
                data = {"f": "json"}
                r = rehgp.GenericSharingRequest(ditemurl, data)
                arcpy.AddMessage("Deleting hosted image layer item: {0}".format(ditemurl))
                # arcpy.AddMessage(u"Portal request response: {0}".format(str(r)))

                if "success" in r:
                    if r["success"]:
                        deleteSuccess = True
                    else:
                        deleteSuccess = False
                else:
                    # arcpy.AddMessage(r["success"])
                    deleteSuccess = False
            else:
                arcpy.AddMessage("Cannot delete hosted image layer item. Exception: {0}".format("Cannot generate delete item request."))

        elif "url" in jsondict:
            isurl = jsondict["url"]
            aisurl = getISAdminUrl(isurl)

            token, referer = getToken(isurl, 5)
            daisurl = aisurl + "/delete"
            data = {"token": token, "f": "json"}
            if RUN_ON_K8S:
                r = requests.post(daisurl, data=data, verify=False)
            else:
                r = requests.post(daisurl, params=data, verify=False)
            arcpy.AddMessage("Deleting hosted image layer item: {0}".format(daisurl))

            msgjson = r.json()
            msg = str(msgjson)
            if "status" in msgjson:
                if msgjson["status"] == "success":
                    deleteSuccess = True
                else:
                    deleteSuccess = False
            else:
                arcpy.AddMessage(msg)
                deleteSuccess = False
        else:
            arcpy.AddMessage("No hosted image service to delete.")

    except Exception as err:
        arcpy.AddError("Cannot delete hosted image service. Exception: " + str(err))

    finally:
        return deleteSuccess


def checkIfFeatureCollection(jsonstr):
    try:
        # 1. If the input is string, need to find the JSON object from the string
        # 2. If the input is already a JSON dictionary, pass through.
        if isinstance(jsonstr, str):
            jsondict = list(getJSON(jsonstr))
            if jsondict == []:
                # arcpy.AddWarning("Input data is not a valid JSON.")
                return False
            else:
                jsondict = jsondict[0]
               # arcpy.AddMessage("JSON object found is: "+str(jsondict))
        else:
            jsondict = jsonstr
        # Check if keywords exist
        if "featureSet" in jsondict:
            return True
        elif "layerDefinition" in jsondict:
            jsondictlayer = jsondict["layerDefinition"]
            if "type" in jsondictlayer:
                if jsondictlayer["type"] in ["FeatureLayer", "Feature Layer"]:
                    # return True for Feature Collection
                    return True

        return False
    except Exception as err:
        arcpy.AddError("Error while checking if the input is a feature collection: "+str(err))


def isMosaic(inras):
    """
    Check if an input path is a copiable mosaic dataset, there could be multiple scenarios:
    a. \\fileshareserver\folder\fgdb.gdb\mosaicdataset
    b. /fileShares/storename/folder/fgdb.gdb/mosaicdataset
    c. /enterpriseDatabases/storename/mosaicdataset
    :param inras: input mosaic dataset path
    :return: True if path is a copiable mosaic dataset, otherwise False
    """
    try:
        # if input path is not a string, exit right away
        if not isinstance(inras, str):
            return False

        # get the absolute path when input path is in file share data store
        if inras.startswith("/fileShares"):
            inras = _lookupdatastorepath(inras)

        if arcpy.Exists(inras):
            desc = arcpy.Describe(inras)
            if desc.dataType == "MosaicDataset":
                return True
        elif inras.startswith("/enterpriseDatabases"):
            # return True for now if path is in Enterprise database
            return True

        return False
    except Exception as err:
        return False


def isHostedIS(url):
    """
    This method is used to check if a image service url is a hosted image service
    based on the URL string. The hosted image service is always saved in Hosted folder.
    TODO: this method will need to be updated if the rule changed in the future
    :param url: image service url
    :return: True if the item is hosted image layer, False if not
    """
    try:
        # verify if the input is a url
        regex = re.compile(
            r'^(?:http|ftp)s?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        if re.match(regex, url) is not None:
            arcpy.AddMessage("Input is a valid url {}".format(url))
            if url.endswith("/ImageServer") and url.find("rest/services/Hosted/") > -1:
                arcpy.AddMessage("Input is hosted image service.")
                return True

        return False
    except Exception:
        return False


def getHostedDataPath(input_json):
    """
    This method will be used to get the hosted data path that will eventually be
    used in the add rasters to mosaic dataset tool call.
    The input data supports two mode 'byref' or 'byvalue'.
    Supported cases for 'byref'
    1. single item:
    {"url": <single cloud raster url>}
    {"uri": <single mosaic dataset unc path>}
    {"uri": <single raster dataset unc path>}
    note: not support relative data store path such as: /fileshare/a/a.tif or /cloudStore/B/b.crf
    note: mosaic dataset is supported through unc path
    2. multiple items:
    {"uris": [<single rd unc path>, <single rd unc path>, <single rd unc path>]}
    {"urls": [<single cloud raster url>, <single cloud raster url>, <single cloud raster url>]}
    Supported cases for 'byvalue'
    1. single item:
    {"folderId": <folder id>}
    {"itemId": <uploaded item id>}
    {"url": <single cloud raster url>}
    {"uri": <single md path or rd unc path>}
    {"tiled_url": <tiled only image service>}
    2. multiple items:
    {"itemIds": [<uploaded item id>, <uploaded item id>, <uploaded item id>]}
    {"uris": [<single rd unc path>, <single rd unc path>, <single rd unc path>]}
    {"urls": [<single cloud raster url>, <single cloud raster url>, <single cloud raster url>]}
    {"tiled_url": [<tiled only image service>, ]}
    :param jsonstr: input data's JSON string object or python dictionary
    :return: byref, cpmosaic, raster
    """
    by_ref = False
    cp_mosaic = False
    allbyref = False
    try:
        # The input data's JSON can be already parsed (in Generate Raster's case)
        # 1. If the input is string, need to find the JSON object from the string
        # 2. If the input is already a JSON dictionary, pass through.
        if isinstance(input_json, str):
            jsondict = list(getJSON(input_json))
            if jsondict == []:
                # arcpy.AddWarning("Input data is not a valid JSON.")
                return ""
            else:
                jsondict = jsondict[0]
                # arcpy.AddMessage("JSON object found is: "+str(jsondict))
        elif isinstance(input_json, dict):
            jsondict = input_json
        else:
            jsondict = input_json

        # Check if "copy" - means copy mosaic dataset is set
        # Note: the "copy" key in the input JSON string indicates the input is a mosaic dataset and must be
        # copy to raster store.
        if "copy" in jsondict:
            if jsondict["copy"] == True:
                cp_mosaic = True

        # Now check publishing mode is byref or byvalue
        if "byref" in jsondict and jsondict["byref"] == True:
            by_ref = True

        if "allbyref" in jsondict and jsondict["allbyref"] == True:
            allbyref = True

        # Now check the input data paths
        inras = getInDataPath(jsondict)
        if isHostedIS(inras):
            data_src = getImageServiceDatasource(inras)
            if data_src:
                inras = data_src

        # Note: only when the input is verified to be mosaic dataset and "copy" flag set to True, we will copy
        # the mosaic dataset.
        cp_mosaic = isMosaic(inras) and cp_mosaic

        return by_ref, cp_mosaic, inras, allbyref
    except Exception as err:
        return False, False, "", allbyref


def getURI(gpmsg, outpath=None):
    """
    :param gpmsg: Complete geoprocessing message string
    :param outpath: If uri string is not in GP message, we may need to use output path
    :return: first uri string if find in any JSON object
    """
    try:
        #arcpy.AddMessage(gpmsg)
        # Find "uri" in the GP result message
        s1 = gpmsg[gpmsg.find("\"uri\""):].strip()
        s2 = s1[:s1.find("}")]
        # Find the closing } in the remaining string, remote quotation mark
        uri = s2[s2.find(":")+1:].strip().replace("\"", "")
        #arcpy.AddMessage("Returns from getURI: {0}".format(uri))
        # Consider using the output path directly if given.
        # On AGOL, the output path was given as full path, hence no uri returned
        # in the GP message. But we still need it to update image service.
        if not uri and outpath:
            if RUN_ON_AGOL:
                # arcpy.AddMessage(outpath)
                orgid = getOrgId()
                if orgid and outpath.startswith("/cloudStores/" + orgid):
                    # Construct item folder path
                    # e.g. /cloudStores/<org id>/<item id>
                    itemflder = list(pathlib.PurePath(outpath).parts)
                    # Make sure we only add trigger file to item folder
                    if len(itemflder) >= 4:
                        itempath = "/" + "/".join(itemflder[1:4])
                        # Need to add a trigger file under the item folder to start storage metering
                        _addMeteringTrigger(itempath)
                    uri = outpath
            else:
                uri = outpath

        return uri
    except Exception as err:
        return ""


def startService(serviceurl, token):
    """
    :param serviceurl: image service admin url
    :param token: token to start the service
    :return: message indicating whether the service started or not
    """
    try:
        # Image service always starts on AGOL, validate service info
        if RUN_ON_AGOL:
            data = {"token": token, "f": "json"}
            r = requests.post(serviceurl, data=data, verify=False)
            msgjson = r.json()
            if "error" not in msgjson:
                return "Service is available on ArcGIS Online."
            else:
                return "Service interruption on ArcGIS Online."

        data = {"token": token, "f": "json"}
        # data = urllib.urlencode(data)
        # req = urllib2.Request(serviceurl + "/start", data)
        if(RUN_ON_K8S):
            r = requests.post(serviceurl + "/start", data=data, verify=False)
        else:
            r = requests.post(serviceurl + "/start", params=data, verify=False)
        # arcpy.AddMessage("Starting service: {0}".format(serviceurl + "/start"))
        # arcpy.AddMessage("Starting service parameters: {0}".format(data))

        msgjson = r.json()
        msg = str(msgjson)

        if "status" in msgjson:
            if msgjson["status"] == "success":
                return "Start service URL: {0} successfully.".format(serviceurl)
            else:
                # TODO: retrieve the actual error message
                return "Start service URL: {0} failed.".format(serviceurl)
        else:
            return msg

    except Exception as err:
        arcpy.AddWarning("startService Exception: "+str(err))
        return err


def stopService(serviceurl, token):
    """
    :param serviceurl: image service admin url
    :param token: token to start the service
    :return: message indicating whether the service stopped or not
    """
    try:
        data = {"token": token, "f": "json"}
        # data = urllib.urlencode(data)
        # req = urllib2.Request(serviceurl + "/start", data)
        if(RUN_ON_K8S):
            r = requests.post(serviceurl + "/stop", data=data, verify=False)
        else:
            r = requests.post(serviceurl + "/stop", params=data, verify=False)
        # arcpy.AddMessage("Stopping service: {0}".format(serviceurl + "/stop"))
        # arcpy.AddMessage("Starting service parameters: {0}".format(data))

        msgjson = r.json()
        msg = str(msgjson)

        if "status" in msgjson:
            if msgjson["status"] == "success":
                return "Stop service URL: {0} successfully.".format(serviceurl)
            else:
                # TODO: retrieve the actual error message
                return "Start service URL: {0} failed.".format(serviceurl)
        else:
            return msg

    except Exception as err:
        arcpy.AddWarning("stopService Exception: "+str(err))
        return err


def _createService(name, folderId=None, itemProperties=None, isHosted=True):
    """
    Method to create image service for output raster dataset and the portal item
    :param name: name object of the image serivce, may also contain other service properties
                 e.g. {"name": "testimageservice", "capabilities": "image,metadata"}
    :return: JSON dictionary of the output [itemId, image service url, image service admin url and output dataset name]
    """
    try:
        rehgp = hgp.HostedGP(None, None, False)
        if not isHosted:
            if isinstance(name, dict):
                name["copyData"] = False
        param = {"createParameters": name, "outputType": "imageService"}
        title = ""
        # get title for search of existing item
        if isinstance(name, dict):
            if "title" in name:
                title = name["title"]
        elif isinstance(name, str):
            title = name

        # check item properties and pick up description, tags and snippet
        if isinstance(itemProperties, dict):
            if "title" in itemProperties:
                title = itemProperties["title"]
            if "description" in itemProperties:
                param["description"] = itemProperties["description"]
            if "tags" in itemProperties:
                param["tags"] = itemProperties["tags"]
            if "snippet" in itemProperties:
                param["snippet"] = itemProperties["snippet"]

        item = rehgp.CreateService(param, folderId)
        if item:
            # arcpy.AddMessage(str(item))
            if "itemId" in item:
                iid = item["itemId"]
                arcpy.AddMessage("New portal item created, ID: {}".format(iid))
                # Need to update item title, this cannot be done through createService
                iteminfo = getItemInfo(iid)
                # arcpy.AddMessage(str(iteminfo))
                # arcpy.AddMessage(title)
                if iteminfo and isinstance(iteminfo, dict):
                    if title and "title" in iteminfo:
                        iteminfo["title"] = title
                        updateItemProperties(iid, iteminfo)
                return iid
            else:
                arcpy.AddMessage("Service created but no itemId found.")
                return ""
        else:
            arcpy.AddMessage("Image service {} already existed.".format(name))
            iid = checkitemExist(title, "Image Service", rehgp)
            if iid:
                return iid
            else:
                return ""
    except Exception as err:
        arcpy.AddError("Cannot create service for output raster dataset. Exception: " + str(err))
        return ""


def _getItemJSONData(itemid, properties=None):
    """
    This method is used to retrieve data from the portal item data, it allows the users
    to specify which properties needs to be extracted.
    :param itemid: the portal item id
    :param properties: list of properties to return if data is JSON e.g. ["renderingRule", "mosaicRule"]
    :return: JSON properties, return all item data if no properties given, if properties are given but
             none is found, return None.
    """
    itemdata = {}
    try:
        rehgp = hgp.HostedGP(None, None, False)
        if properties is None:
            properties = []
        iteminfo = rehgp.GetItem(itemid)
        # arcpy.AddMessage(iteminfo)
        scratch_folder = arcpy.env.scratchFolder
        data_from_portal = os.path.join(scratch_folder, 'item_data_file')
        if "type" in iteminfo:
            # TODO: expand this to check all possible types supports JSON
            if iteminfo["type"] == "Image Service":
                item_data_json = rehgp.GetItemDataAsFile(itemid, data_from_portal)
                if properties:
                    # loop through properties list
                    for property in properties:
                        if property in item_data_json:
                            itemdata[property] = item_data_json[property]
                    # if no properties are found in item data, return empty list
                    return itemdata
                # if no properties items are given, return all item data.
                else:
                    return item_data_json
            # Return item info JSON from deep learning package
            elif iteminfo["type"] == "Deep Learning Package":
                return iteminfo

        return itemdata
    except Exception as err:
        # arcpy.AddWarning("Failed to retrieve portal item JSON data.")
        return itemdata

def getItemInfo(itemid):
    """
    This method is used to retrieve root info from the portal item data.
    :param itemid: the portal item id
    :return: item info JSON
    """
    iteminfo = {}
    try:
        rehgp = hgp.HostedGP(None, None, False)
        iteminfo = rehgp.GetItem(itemid)
        return iteminfo

    except Exception as err:
        # arcpy.AddWarning("Failed to retrieve portal item info.")
        return iteminfo

def updateItemProperties(iid, content):
    """
    This function is used to update the item's additional properties
    :param iid: this is the itemId
    :param content: the item properties content could be either dictionary or JSON string format
    :param token: server admin token
    :param referer: server admin referer
    :return: message indicating whether the update is done.
    """
    msg = "Cannot update AGOL/Portal item properties, URL: {}".format(iid)
    try:
        rehgp = hgp.HostedGP(None, None, False)
        # portalhost = rehgp.GetOwningSystem()
        ijson = rehgp.GetItem(iid)
        # arcpy.AddMessage("Potal item properties: {}".format(ijson))
        if "owner" in ijson:
            owner = ijson["owner"]
            if owner and owner is not None:
                folderId = ""
                if "ownerFolder" in ijson:
                    ofolder = ijson["ownerFolder"]
                    if ofolder and ofolder is not None:
                        folderId = ofolder

                # Update REST URL example
                #iurl = portalhost + "/sharing/rest/content/users/" + owner + "/" + ofolder + "/items/" + iid
                #iurl = portalhost + "/sharing/rest/content/users/" + owner + "/items/" + iid

                if not isinstance(content, dict):
                    content = list(getJSON(content))[0]
                    
                # Define update parameters
                updateParams = {}
                # Support renderingRule, update goes to text
                newtext = {}
                if "renderingRule" in content:
                    newtext = content["renderingRule"]
                elif "itemProperties" in content:
                    iprops = content["itemProperties"]
                    if "itemText" in iprops:
                        newtext = iprops["itemText"]
                if newtext:
                    updateParams["text"] = newtext

                # Update type keyword:
                if "typeKeywords" in content:
                    updateParams["typeKeywords"] = content["typeKeywords"]
                if "title" in content:
                    updateParams["title"] = content["title"]
                    
                # Support properties update, note "properties" is a REST parameter
                newprops = {}
                if "properties" in content:
                    newprops = content["properties"]
                if newprops: 
                    updateParams["properties"] = newprops

                # update folder Id, which goes into properties
                updateProperties = {}
                if folderId:
                    if updateProperties and isinstance(updateProperties, dict):
                        updateProperties["folderId"] = folderId
                    else:
                        updateProperties = {"folderId": folderId}

                # arcpy.AddMessage(updateParams)
                # arcpy.AddMessage(updateProperties)
                # Submit request to update portal item properties
                if updateParams or updateProperties:
                    rehgp.UpdateItem(iid, updateParams, properties=updateProperties)
                    return "Update portal Item: {} successfully.".format(iid)

        msg = "No properties need to be updated for Portal item."
        return msg

    except Exception as err:
        arcpy.AddWarning("updateItemProperties Exception: "+str(err))
        return msg


def retry_on_exception(max_retries=3, delay_seconds=1):
    """
    Decorator to retry a function on exceptions, but will not reraise the exception.
    :param max_retries: Maximum number of retries.
    :param delay_seconds: Delay between retries (in seconds).
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as err:
                    retries += 1
                    if retries < max_retries:
                        arcpy.AddWarning(str(err))
                        arcpy.AddMessage(f"Retrying ({retries}/{max_retries}) in {delay_seconds} seconds...")
                        time.sleep(delay_seconds)
                    else:
                        arcpy.AddWarning(f"Function {func.__name__} failed after {max_retries} retries. {err}")
        return wrapper
    return decorator


@retry_on_exception(max_retries=5, delay_seconds=2)
def refreshPortalItem(iid):
    """
    :param iid: this is the portal item id.
    :return msg: Report update successfully or failed.
    """
    # try:
    rehgp = hgp.HostedGP(None, None, False)
    if RUN_ON_AGOL:
        time.sleep(15)
    rehgp.RefreshItem(iid)
    arcpy.AddMessage("Portal item refreshed.")
    # except hgp.GPCloudExec as err:
    #     arcpy.AddWarning("Portal refresh item exception. Warning: {0}".format(err))
    # except Exception as err:
    #     arcpy.AddWarning("Exception in refreshPortalItem. Warning: {0}".format(err))


def updateSource(serviceurl, serviceinfo, srcuri, token, referer):
    """
    :param serviceurl: The service admin url that allows edit call
    :param serviceinfo: The service info to be updated
    :param srcuri: the source crf uri
    return msg: Report update successfully or failed.:
    """
    msg = "Cannot update item with cloud raster source, URL: {0}".format(serviceurl)
    try:
        if serviceurl == "" or serviceurl == "#":
            msg = "No AGOL/Portal item to be updated."
            arcpy.AddMessage(msg)
            return msg

        # Find the data source tag and update it with new URI
        if serviceinfo == {}:
            msg = "No service info read from output image service."
            arcpy.AddMessage(msg)
            return msg
        else:
            serviceinfo["properties"]["path"] = srcuri

        # Turn on isCached = true if data source is CRF
        if "properties" in serviceinfo and "path" in serviceinfo["properties"]:
            if "isCached" in serviceinfo["properties"]:
                if isinstance(srcuri, str):
                    if srcuri.lower().endswith(".crf"):
                        serviceinfo["properties"]["isCached"] = "true"
                        serviceinfo["properties"]["isTiledImagery"] = "true"
            else:
                if isinstance(srcuri, str):
                    if srcuri.lower().endswith(".crf"):
                        serviceinfo["properties"]["isCached"] = "true"
                        serviceinfo["properties"]["isTiledImagery"] = "true"

        # Turn off allowCopy, turn on allowAnalysis by default on AGOL
        if RUN_ON_AGOL:
            serviceinfo["properties"]["allowCopy"] = False
            serviceinfo["properties"]["allowAnalysis"] = True

        # Call edit to update service definition
        sdata = json.dumps(serviceinfo)
        data = {"service": sdata, "token": token, "f": "json"}
        # arcpy.AddMessage("Update payload: {}".format(str(data)))
        r = requests.post(
            serviceurl + "/edit", data=data, headers={"referer": referer}, verify=False)
        arcpy.AddMessage("Updating service: {0}".format(serviceurl + "/edit"))
        # arcpy.AddMessage("Updating service parameters: {0}".format(str(data)))

        msgjson = r.json()
        msg = str(msgjson)
        # arcpy.AddMessage("Update service response: {}".format(msg))

        if "status" in msgjson:
            if msgjson["status"] == "success":
                smsg = startService(serviceurl, token)
                #arcpy.AddMessage(smsg)
                return "Update item service: {0} successfully.".format(serviceurl)
            else:
                # TODO: retrieve the actual error message
                return "Update item service: {0} failed.".format(serviceurl)
        else:
            return msg
        
    except Exception as err:
        arcpy.AddWarning("updateSource Exception: "+str(err))
        return err


def updateService(serviceurl, serviceinfo, newinfo, token, referer):
    """
    :param serviceurl: The service admin url that allows edit call
    :param serviceinfo: The service info to be updated
    :param newinfo: The new service info
    return msg: Report update successfully or failed.:
    """
    msg = "Cannot update service definition."
    try:
        if serviceurl == "" or serviceurl == "#":
            msg = "No AGOL/Portal item to be updated."
            arcpy.AddMessage(msg)
            return msg

        # Find the data source tag and update it with new URI
        if not serviceinfo or not newinfo:
            msg = "No service info read from output image service."
            arcpy.AddMessage(msg)
            return msg
        elif isinstance(serviceinfo, dict) and isinstance(newinfo, dict):
            serviceinfo = dict_merge(serviceinfo, newinfo)

        # Turn on isCached = true if data source is CRF
        if "properties" in serviceinfo and "path" in serviceinfo["properties"]:
            if "isCached" in serviceinfo["properties"]:
                if isinstance(serviceinfo["properties"]["path"], str):
                    if serviceinfo["properties"]["path"].lower().endswith(".crf"):
                        serviceinfo["properties"]["isCached"] = "true"
                        serviceinfo["properties"]["isTiledImagery"] = "true"
            else:
                if isinstance(serviceinfo["properties"]["path"], str):
                    if serviceinfo["properties"]["path"].lower().endswith(".crf"):
                        serviceinfo["properties"]["isCached"] = "true"
                        serviceinfo["properties"]["isTiledImagery"] = "true"

        # Turn off allowCopy, turn on allowAnalysis by default on AGOL
        if RUN_ON_AGOL:
            serviceinfo["properties"]["allowCopy"] = False
            serviceinfo["properties"]["allowAnalysis"] = True
        
        # Call edit to update service definition
        sdata = json.dumps(serviceinfo)
        data = {"service": sdata, "token": token, "f": "json"}
        if "?" in serviceurl:
            serviceurl = serviceurl.split("?")[0]
        r = requests.post(
            serviceurl + "/edit", data=data, headers={"referer": referer}, verify=False)
        arcpy.AddMessage("Updating service: {0}".format(serviceurl + "/edit"))
        # arcpy.AddMessage("Updating service parameters: {0}".format(data))

        msgjson = r.json()
        msg = str(msgjson)

        if "status" in msgjson:
            if msgjson["status"] == "success":
                smsg = startService(serviceurl, token)
                return "Update item service: {0} successfully.".format(serviceurl)
            else:
                # To do: retrieve the actual error message
                return "Update item service: {0} failed.".format(serviceurl)
        else:
            return msg

    except Exception as err:
        arcpy.AddWarning("updateService Exception: " + str(err))
        return err


def _addMeteringTrigger(datapath):
    """
    AGOL only!
    Add metering trigger file to the path given.
    Metering trigger file is a simple empty file with the name "storagetrigger"
    :param datapath: given path where the file will be added
    :return: True if file added successfully, False if not
    """
    try:
        # Check first if data path is CRF
        trigger = os.path.join(tempfile.gettempdir(), "storagetrigger")
        # arcpy.AddMessage(trigger)
        with open(trigger, "w") as f:
            f.close()
        arcpy.gp.command(
            "TransferFiles " + trigger + " " + datapath)
        return True
    except Exception as err:
        return False


# TODO proper handle get data store for managed and cloud database
def _lookupdatastore(filter):
    """
    Use the filter to list registered data store item pr
    :param filter: list of keyword string to determine specific data store type to search, separated by comma
      e.g. "folder,cloudStore,rasterStore,egdb"
    :return: list of data store items
    """
    try:
        dslist = []
        # parse filter setting first
        if type(filter) == str:
            dskeys = [dskey.strip() for dskey in filter.strip().split(",")]
        else:
            return dslist

        # arcpy.AddMessage(str(dskeys))
        raurl = RASTER_ANALYTIC_HELPER
        token, referer = getToken(raurl, 10)
        if raurl and dskeys:
            # if RUN_ON_AGOL: 
            #     # look up raster store item with org ID and localhost admin API
            #     adminurl = "https://localhost:6443/arcgis/admin/data/findItems"
            # else:
            #     adminurl = raurl + "/admin/data/findItems"
            if DATA_STORE_REGISTRY:
                find_url = DATA_STORE_REGISTRY.rstrip("//") + "/findItems"
            else:
                # fall back to find with localhost
                find_url = raurl + "/admin/data/findItems"

            # arcpy.AddMessage(find_url)
            # arcpy.AddMessage(u"Raster Analytics server admin url data store items: {}".format(adminurl))
            # parse keywords to find out what to search for.
            supportedtypes = ["folder", "cloudStore", "rasterStore", "egdb"]
            dstypes = ",".join(list(set(dskeys) & set(supportedtypes)))
            if DATA_STORE_REGISTRY:
                orgid = getOrgId()
                userid = getUserId()
                data = {"f": "json", "types": dstypes, "decrypt": True, "token": token, "userId": userid, "orgId": orgid}
            else:
                data = {"f": "json", "types": dstypes, "decrypt": True, "token": token}

            if RUN_ON_K8S:
                r = requests.post(find_url, data=data, verify=False)
            else:
                r = requests.post(find_url, params=data, verify=False)
            # arcpy.AddMessage(u"No exception at sending post request.")
            msgjson = r.json()
            # arcpy.AddMessage(str(msgjson))
            if "items" in msgjson:
                fsds = msgjson["items"]
                if fsds:
                    for ds in fsds:
                        if "info" in ds and "path" in ds:
                            dslist.append(ds)

        return dslist
    except Exception as err:
        return []


def _lookupdatastorepath(datapath):
    """
    Utility method to look up actual data path with data store item path.
    :param datastore: data store relative path e.g. /rasterStores/abc/...
    :return: actual data path
             For file share type of data store, it returns the actual path.
             e.g. File share \\servername\abc
             TODO: For database type of data store, it returns a temporary database connection file.
             For cloud store datastore, return as is.
    """
    try:
        datapathparts = list(pathlib.PurePath(datapath).parts)
        # parse the input path
        if datapath.startswith("/rasterStores/"):
            dslist = _lookupdatastore("rasterStore")
            for ds in dslist:
                dspathparts = ds["path"].split("/")
                if len(dspathparts) > 2 and len(datapathparts) > 2 and dspathparts[1:3] == datapathparts[1:3]:
                    dsinfo = ds["info"]
                    if "connectionType" in dsinfo:
                        # file share raster store takes priority
                        if dsinfo["connectionType"] == "fileShare":
                            if "connectionString" in dsinfo:
                                connectstr = dsinfo["connectionString"]
                                connectjson = list(getJSON(connectstr))[0]
                                if connectjson and "path" in connectjson:
                                    datapath = datapath.replace(ds["path"], connectjson["path"])
                        elif dsinfo["connectionType"] == "dataStore":
                            if "connectionString" in dsinfo:
                                connectstr = dsinfo["connectionString"]
                                connectjson = list(getJSON(connectstr))[0]
                                if connectjson and "path" in connectjson:
                                    if connectjson["path"].startswith("/cloudStores"):
                                        datapath = datapath.replace(ds["path"], connectjson["path"])

        elif datapath.startswith("/fileShares/"):
            dslist = _lookupdatastore("folder")
            for ds in dslist:
                dspathparts = ds["path"].split("/")
                if len(dspathparts) > 2 and len(datapathparts) > 2 and dspathparts[1:3] == datapathparts[1:3]:
                    dsinfo = ds["info"]
                    if "path" in dsinfo:
                        datapath = datapath.replace(ds["path"], dsinfo["path"])

        elif datapath.startswith("/enterpriseDatabases/"):
            dslist = _lookupdatastore("egdb")
            # arcpy.AddMessage(str(dslist))
            for ds in dslist:
                dspathparts = ds["path"].split("/")
                if len(dspathparts) > 2 and len(datapathparts) > 2 and dspathparts[1:3] == datapathparts[1:3]:
                    dsinfo = ds["info"]
                    # arcpy.AddMessage(dsinfo)
                    if "connectionString" in dsinfo:
                        # arcpy.AddMessage(ds["path"])
                        # arcpy.AddMessage(datapath)
                        connectfolder = arcpy.env.scratchFolder
                        name = "egdbws.sde"
                        sdews = arcpy.gp.command(
                            "CreateDatabaseConnectionFile " + dsinfo["connectionString"] + " " + connectfolder + " " + name)
                        # arcpy.AddMessage(sdews)
                        datapath = datapath.replace(ds["path"], sdews)

        elif datapath.startswith("/cloudStores"):
            dslist = _lookupdatastore("cloudStore")
            # arcpy.AddMessage(str(dslist))
            for ds in dslist:
                dspathparts = ds["path"].split("/")
                if len(dspathparts) > 2 and len(datapathparts) > 2 and dspathparts[1:3] == datapathparts[1:3]:                    
                    cprovider = ds["provider"]
                    dsinfo = ds["info"]
                    if cprovider and "objectStore" in dsinfo:
                        # TODO: look up Alibaba and GCloud
                        if cprovider == "azure":
                            datapath = datapath.replace(ds["path"], "/vsiaz/" + dsinfo["objectStore"])
                        elif cprovider == "amazon":
                            datapath = datapath.replace(ds["path"], "/vsis3/" + dsinfo["objectStore"])
                            
        return datapath
    except KeyError as err:
        arcpy.AddWarning("Cannot find data store item key: {}".format(err))
        return datapath
    except Exception as err:
        return datapath


def _getDataStore(itemid):
    """
    Get the datastore paths from data store item id.
    Note: currently only support file share and cloud store
    :param itemId: id of datastore portal item
    :return: server data store path
    """
    dspath = ""
    rehgp = hgp.HostedGP(None, None, False)
    try:
        dsjson = rehgp.GetItemDataAsJSON(itemid)
        # arcpy.AddMessage(dsjson)
        if dsjson and "type" in dsjson and "path" in dsjson:
            if dsjson["type"] == "cloudStore" or dsjson["type"] == "folder":
                dspath = dsjson["path"]
                return dspath
        else:
            # If cannot get data store item data, has to search through server datastore
            # Search server data store items to find a match
            raurl = RASTER_ANALYTIC_HELPER
            token, referer = rehgp.GetServerToken(raurl, 10)
            if raurl:
                adminurl = raurl + "/admin/data/findItems"
                # arcpy.AddMessage(u"Raster Analytics server admin url data store items: {}".format(adminurl))
                # Need to search file share and cloud store
                datalist = []
                datalist.append({"f": "json", "types": "folder", "token": token, "decrypt": True})
                datalist.append({"f": "json", "types": "cloudStore", "token": token})
                for data in datalist:
                    r = requests.post(adminurl, params=data, verify=False)
                    # arcpy.AddMessage(u"No exception at sending post request.")
                    msgjson = r.json()
                    if "items" in msgjson:
                        fsds = msgjson["items"]
                        """
                        Example:
                        {
                          "path": "/fileShares/file1",
                          "type": "folder",
                          "id": "ccf10de1ba174c38b99afe0091a621c7",
                          "info": {
                            "isManaged": false,
                            "dataStoreConnectionType": "shared",
                            "path": "\\\\servername\\machinename",
                            "portalProperties": {"itemID": "ccf10de1ba174c38b99afe0091a621c7"}
                          }
                        }
                        """
                        if fsds:
                            for ds in fsds:
                                if "info" in ds and "path" in ds:
                                    if "portalProperties" in ds["info"]:
                                        if "itemID" in ds["info"]["portalProperties"]:
                                            if itemid.lower() == ds["info"]["portalProperties"]["itemID"].lower():
                                                dspath = ds["path"]
                                                return dspath
        return dspath
    except hgp.GPCloudExec as err:
        # If get data store throw exception, has to search through server datastore
        # Search server data store items to find a match
        raurl = RASTER_ANALYTIC_HELPER
        token, referer = rehgp.GetServerToken(raurl, 10)
        if raurl:
            adminurl = raurl + "/admin/data/findItems"
            # arcpy.AddMessage(u"Raster Analytics server admin url data store items: {}".format(adminurl))
            # Need to search file share and cloud store
            datalist = []
            datalist.append({"f": "json", "types": "folder", "token": token, "decrypt": True})
            datalist.append({"f": "json", "types": "cloudStore", "token": token})
            for data in datalist:
                r = requests.post(adminurl, params=data, verify=False)
                # arcpy.AddMessage(u"No exception at sending post request.")
                msgjson = r.json()
                if "items" in msgjson:
                    fsds = msgjson["items"]
                    if fsds:
                        for ds in fsds:
                            if "info" in ds and "path" in ds:
                                if "portalProperties" in ds["info"]:
                                    if "itemID" in ds["info"]["portalProperties"]:
                                        if itemid.lower() == ds["info"]["portalProperties"]["itemID"].lower():
                                            dspath = ds["path"]
                                            return dspath
    except Exception as err:
        return dspath


def _getRasterStore(adminurl, token, type="fileshare", retries=3, backoff_factor=0.3,
          status_forcelist=(502, 503, 504)) -> List[List[Any]]:
    """
    :param type: fileshare - file share raster store
                 managed - egdb raster store
                 cloud - cloud store raster store
    :return: 1. data store true path or egdb connection string
             2. raster store named path (e.g. /rasterStores/abc...)
    """
    try:
        # If run on ArcGIS Online, get organization ID first
        if RUN_ON_AGOL:
            orgid = getOrgId()
            userid = getUserId()
            # arcpy.AddMessage("Org ID is: {}".format(orgid))
            # Use organization ID to construct raster store paths if run on AGOL
            if orgid:
                # look up raster store item with org ID and localhost admin API
                # adminurl = "https://localhost:6443/arcgis/admin/data/items"
                if DATA_STORE_REGISTRY:
                    adminurl = DATA_STORE_REGISTRY.rstrip("//") + "/items"
                else:
                    # fall back to find with localhost
                    # fall back to find with localhost
                    adminurl = "https://localhost:6443/arcgis/admin/data/items"
                
                # Have to regenerate token with raster analytic service URL
                agoltoken, referer = getToken(RASTER_ANALYTIC_HELPER)
                if type == "managed":
                    connectstr = ""
                    egdbrsname = ""
                    egdbname = "/enterpriseDatabases/dbraster-" + orgid
                    adminurl = adminurl + egdbname
                    # arcpy.AddMessage("Query EGDB raster store URL: {}".format(adminurl))
                    data = {"f": "json", "token": agoltoken, "decrypt": True, "orgId": orgid, "userId": userid}
                    r = requests.post(adminurl, data=data, headers={"referer": "http://www.esri.com/*"}, verify=False)
                    dsjson = r.json()
                    # arcpy.AddMessage("Query EGDB raster store response: {}".format(dsjson))
                    if "info" in dsjson and "path" in dsjson:
                        if "connectionString" in dsjson["info"]:
                            connectstr = dsjson["info"]["connectionString"]
                            egdbrsname = "/rasterStores/dbraster-" + orgid
                            # arcpy.AddMessage("Connection string for Enterprise database is {}".format(connectstr))
                            arcpy.AddMessage("EGDB raster store is: {}".format(egdbrsname))
                    return [connectstr, egdbname]
                elif type == "cloud":
                    cloudrsname = ""
                    cloudname = ""
                    cloudnamelookup = "/cloudStores/" + orgid
                    adminurl = adminurl + cloudnamelookup
                    # arcpy.AddMessage("Query Cloud raster store URL: {}".format(adminurl))
                    data = {"f": "json", "token": agoltoken, "decrypt": True, "orgId": orgid, "userId": userid}
                    # arcpy.AddMessage("Query Cloud raster store Data: {}".format(str(data)))
                    r = requests.post(adminurl, data=data, headers={"referer": "http://www.esri.com/*"}, verify=False)
                    dsjson = r.json()
                    # arcpy.AddMessage("Query Cloud raster store response: {}".format(dsjson))
                    if "info" in dsjson and "path" in dsjson:
                        if "connectionString" in dsjson["info"]:
                            cloudname = cloudnamelookup
                            cloudrsname = "/rasterStores/" + orgid
                    return [cloudname, cloudrsname]
                else:
                    return "", ""
            else:
                return "", ""

        # construct find item url
        if adminurl == None or len(adminurl) == 0:
            adminurl = u"{}/admin/".format(getOwningSystemUrl())

        adminurl = adminurl[:adminurl.find("/admin/")] + "/admin/data/findItems"
        # arcpy.AddMessage(u"Server admin url data store items: {}".format(adminurl))
        # look up the data store item
        data = {"f": "json", "types": "rasterstore", "token": token, "decrypt": True}
        dataitems = []
        with requests.Session() as s:
            retries = Retry(
                total=retries,
                backoff_factor=backoff_factor,
                status_forcelist=status_forcelist)

            adapter = HTTPAdapter(max_retries=retries)
            s.mount('http://', adapter)
            s.mount('https://', adapter)

            if RUN_ON_K8S:
                r = s.get(adminurl, params=data, verify=False)
            else:
                r = s.post(adminurl, params=data, verify=False)
            
            # arcpy.AddMessage(u"No exception at sending post request.")

            # arcpy.AddMessage(u"Data store reponse: {}".format(r.text))
            msgjson = r.json()
            if "items" in msgjson:
                dataitems = msgjson["items"]
            else:
                arcpy.AddError("No available raster data store.")
                return "", ""

        """
        {"items": [
          {
            "path": "/rasterStores/OrthomappingFileshare",
            "type": "rasterStore",
            "id": "f433cc4f-60d1-47ba-aebc-8ae799708820",
            "info": {
              "connectionString": "{\"path\":\"\\\\\\\\rdvmags02\\\\Z__ServerData\\\\orthomapping\"}",
              "connectionType": "fileShare"
            }
          },
          {
            "path": "/rasterStores/Rastermanageddbstorage",
            "type": "rasterStore",
            "id": "e82b40b8-0f36-45b4-8050-2441e5930b2c",
            "info": {
              "connectionString": "{\"path\":\"/enterpriseDatabases/postgres_db\"}",
              "connectionType": "dataStore"
            }
          }
        ]}
        """
        rstore = [""] * 2
        dslist = []
        if type == "fileshare":
            # arcpy.AddMessage("search for file share raster store.")
            # File share raster store stores path
            for item in dataitems:
                if "info" in item and "path" in item:
                    if "connectionType" in item["info"] and "connectionString" in item["info"]:
                        if item["info"]["connectionType"] == "fileShare":
                            # Parse connection string
                            # Note: this is assuming "connectionSting" is always JSON
                            connectjson = json.loads(item["info"]["connectionString"])
                            if "path" in connectjson:
                                dslist.append([connectjson["path"], item["path"]])
            if not dslist:
                arcpy.AddMessage("No file share raster store.")
            else:
                rstore = random.choice(dslist)
            return rstore
        elif type == "managed":
            for item in dataitems:
                if "info" in item and "path" in item:
                    if "connectionType" in item["info"] and "connectionString" in item["info"]:
                        if item["info"]["connectionType"] == "dataStore":
                            connectjson = json.loads(item["info"]["connectionString"])
                            if "path" in connectjson:
                                if connectjson["path"].find("/enterpriseDatabases/") > -1:
                                    # Query and return data base connection string
                                    adminurl = adminurl[:adminurl.find("/admin/")] + "/admin/data/items" + connectjson["path"]
                                    # arcpy.AddMessage(u"Enterprise database data store item URL: {}".format(adminurl))
                                    # look up the connection string of the database item
                                    data = {"f": "json", "token": token}
                                    r = requests.get(adminurl, params=data, verify=False)
                                    ejson = r.json()
                                    if "info" in ejson:
                                        if "connectionString" in ejson["info"]:
                                            dslist.append([ejson["info"]["connectionString"], connectjson["path"]])
                                            # dslist.append([ejson["info"]["connectionString"], item["path"]])
                                            # arcpy.AddMessage(u"Enterprise database connection string: {}".format(str(rstore)))
            if not dslist:
                arcpy.AddMessage("No database raster store.")
            else:
                rstore = random.choice(dslist)
            return rstore
        elif type == "cloud":
            # arcpy.AddMessage("search for cloud store raster store.")
            # cloud raster store stores path
            for item in dataitems:
                if "info" in item and "path" in item:
                    if "connectionType" in item["info"] and "connectionString" in item["info"]:
                        if item["info"]["connectionType"] == "dataStore":
                            # Parse connection string
                            # Note: this is assuming "connectionSting" is always JSON
                            connectjson = json.loads(item["info"]["connectionString"])
                            if "path" in connectjson:
                                if connectjson["path"].find("/cloudStores/") > -1:
                                    # Note: return the raster store path instead
                                    # of the cloud store path for hosted data
                                    dslist.append([connectjson["path"], item["path"]])
            if not dslist:
                arcpy.AddMessage("No cloud raster store.")
            else:
                rstore = random.choice(dslist)
            return rstore
        else:
            arcpy.AddMessage("No hosted raster store.")
            return "", ""

    except Exception as err:
        arcpy.AddError("getRasterStore Exception: " + str(err))
        return "", ""


def _downloadRasterFunctions(itemids, datastore):
    """
    This utility function is used to download raster function template item
    :param itemid: list of itemids of the raster function templates
    :param datastore: download location
    :return: file paths list
    """
    rehgp = hgp.HostedGP(None, None, False)
    if isinstance(itemids, list):
        rftpaths = []
        for itemid in itemids:
            rftpath = ""
            arcpy.AddMessage("Getting rasterfunction template item info: {}".format(itemid))
            try:
                # Get item info first
                iteminfo = rehgp.GetItem(itemid)
                # arcpy.AddMessage("Function template item Info: {}".format(iteminfo))
                if "type" in iteminfo and "name" in iteminfo:
                    if iteminfo["type"] == "Raster function template":
                        rftpath = _downloadFile(itemid, iteminfo["name"], datastore)
                        rftpaths.append(rftpath)
            except Exception as err:
                arcpy.AddWarning("Failed to retrieve raster function item {}".format(itemid))
                continue
        return rftpaths
    else:
        return ""


def _downloadFile(itemid, filename, datastore):
    """
    :param imageurl: This is the file portal item
    :param datastore: This is the data store catelog path
    :return: Succeed or Failed.
    """
    try:
        rehgp = hgp.HostedGP(None, None, False)
        filepath = os.path.join(datastore, filename)
        rehgp.GetItemDataAsFile(itemid, filepath)
        arcpy.AddMessage("Moved {}.".format(filename))

        return filepath
    except Exception as err:
        return ""


def _downloadFolder(folderinfo, datastore):
    """
    :param folderinfo: This is the folder info in JSON
    :param datastore: This is the data store catelog path
    :return: Succeed or Failed
    """
    try:
        rehgp = hgp.HostedGP(None, None, False)
        imglist = []
        # check if the folder has item
        if "items" in folderinfo:
            itemsinfo = folderinfo["items"]
            for itemi in itemsinfo:
                # check if item has necessary fields
                if "id" in itemi and "type" in itemi and "name" in itemi:
                    # check if item is image
                    if itemi["type"] == "Image":
                        itemid = rehgp.GetItem(itemi["id"])
                        rname = itemi["name"]
                        imglist.append(_downloadFile(itemid, rname, datastore))
                    else:
                        continue
                else:
                    continue
        else:
            return imglist

        return imglist
    except Exception as err:
        return []


def _checkServerUpload(inras):
    """
    :param inras: input raster JSON string or dictionary
    :return: True if the itemsOnServer flag is set to True
    """
    try:
        if RUN_ON_AGOL:
            return "DATASTORE"
        # The input data's JSON can be already parsed (in Generate Raster's case)
        # 1. If the input is string, need to find the JSON object from the string
        # 2. If the input is already a JSON dictionary, pass through.
        if isinstance(inras, str):
            inras = inras.replace("\\n", "")
            jsondict = list(getJSON(inras))
            if jsondict == []:
                return False
            else:
                jsondict = jsondict[0]
        else:
            jsondict = inras

        if "itemsOnServer" in jsondict:
            if isinstance(jsondict["itemsOnServer"], bool) and jsondict["itemsOnServer"]:
                return "SERVER"

        return "PORTAL"
    except Exception as err:
        return "PORTAL"


def _download_server_item(item_url, output_path, retries=3, backoff_factor=0.3,
          status_forcelist=(429, 500, 502, 503, 504)):
    """
    This is the utility method to download a single file uploaded to server to a local directory
    @param item_url: Enterprise item URL e.g. https://<url>/arcgis/admin/uploads/1cde454b-f9d7-4d49-a8e6-8403cb463c8e/download
    @param output_path: the actual local file path the downloaded file will be written into
    @return: the file path if download succeeded, otherwise None
    """
    try:
        retry_strategy = Retry(
            total=retries,
            backoff_factor=backoff_factor,
            status_forcelist=status_forcelist,
            allowed_methods=frozenset({'GET'})
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        http = requests.Session()
        http.mount("https://", adapter)
        http.mount("http://", adapter)

        # Get token to download the file, could be large file, download timeout is 10 mins
        token, referer = getToken(item_url, 600)
        data = {"token": token, "referer": referer}
        # arcpy.AddMessage(f"item download url: {item_url}")
        # arcpy.AddMessage(f"download data path: {output_path}")
        r = http.get(item_url, params=data, verify=False)
        with open(output_path, 'wb') as f:
            f.write(r.content)

        if os.path.exists(output_path):
            return output_path
        else:
            return None
    except Exception as err:
        return None

def _downloadServerItems(itemurls, datafolder, absnames=None, pathfile=""):
    """
    :param itemurls: the list of server item URLs, e.g. [https://<server name>/server/admin/uploads/i7c47784e-a6d3-45d3-a60a-eca47213f607]
    :param datafolder: the data store folder the images will be download to
    :param absnames: output relative path for each input data
    :param pathfile: location of the output data path file (default to "_store") - no longer needed
    :return: successfully copied output file list
    """
    inpaths = []
    outpaths = []
    use_download_request = False

    for itemurl in itemurls:
        try:
            # Need to get image file list from service first
            token, referer = getToken(itemurl, 5)
            # Getting service info in JSON
            data = {"f": "json", "token": token, "referer": referer}
            r = requests.get(itemurl, params=data, verify=False)

            iteminfo = r.json()
            # arcpy.AddMessage("Uploaded server item info: {}".format(str(iteminfo)))
            # Get server uploaded image item path
            datapath = ""
            if "itemName" in iteminfo:
                if "pathOnServer" in iteminfo:
                    datapath = os.path.join(iteminfo["pathOnServer"], iteminfo["itemName"])

                # If pathOnServer does not exist, use the download operation to get the image file
                # If data path on server does not exist, use download operation to get the image file
                if not os.path.exists(datapath):
                    datapath = itemurl + "/download"
                    use_download_request = True
                # Add input paths to the list
                inpaths.append(datapath)
                # arcpy.AddMessage(f"uploaded data path: {datapath}")

                # Now figure out the output path
                outpath = ""
                if absnames:
                    try:
                        absname = absnames[itemurls.index(itemurl)].lstrip("/").lstrip("\\")
                        outpath = datafolder + "/" + absname
                    except:
                        absname = iteminfo["itemName"].lstrip("/").lstrip("\\")
                        outpath = datafolder + "/" + absname
                else:
                    absname = iteminfo["itemName"]
                    outpath = datafolder + "/" + absname
                # Add corresponding output path to the list
                outpaths.append(outpath)
                # arcpy.AddMessage(f"transferred output data path: {outpath}")
            else:
                arcpy.AddWarning(f"No Item name, server item: {itemurl} was not uploaded correctly.")
        except:
            arcpy.AddMessage("No image file found in item {}".format(os.path.basename(itemurl)))
            continue

    # arcpy.AddMessage("Input uploaded data paths: {}".format(str(inpaths)))
    # arcpy.AddMessage("Uploaded server item paths: {}".format(str(outpaths)))
    # Copy files using Transfer files tools, copy directly from server upload folder to raster store
    # including cloud store raster store.
    goodlist = []
    if inpaths:
        # if output name was specified, we will need to transfer file one by one to maintain possible folder structure.
        # if download request is used, we will also need to transfer file one by one.
        if absnames or use_download_request:
            temp_file = ""
            for outpath in outpaths:
                input_path = inpaths[outpaths.index(outpath)]
                # arcpy.AddMessage(input_path)
                # Check to see if we need to download
                # If use download operation, the file needs to be downloaded to the server first then transferred
                if input_path.endswith("/download"):
                    temp_dir = arcpy.env.scratchFolder
                    temp_file = temp_dir + "/" + os.path.basename(outpath)
                    temp_file = _download_server_item(input_path, temp_file)
                    # arcpy.AddMessage(f"Temp file location {temp_file}.")
                    if os.path.exists(temp_file):
                        input_path = temp_file
                    else:
                        arcpy.AddWarning(f"Failed to download file from server: {outpath}.")
                        continue
                # Now transfer the file to final destination
                try:
                    outloc = os.path.dirname(outpath)
                    # arcpy.AddMessage(inpaths[outpaths.index(outpath)])
                    # arcpy.AddMessage(outloc)
                    arcpy.gp.command('TransferFiles "' + input_path + '" "' + outloc + '"')
                    goodlist.append(outpath)

                    # Better to clean up the temp file after transfer
                    if os.path.exists(temp_file):
                        shutil.rmtree(temp_file)
                except arcpy.ExecuteError as err:
                    arcpy.AddMessage(f"Failed to copy output file to output path: {outpath}.")
                    continue
                except Exception as err:
                    continue
            outpaths = goodlist
        else:
            outpath = datafolder
            # arcpy.AddMessage(str(outpath))
            inras = ";".join(inpaths)
            # arcpy.AddMessage(inras)
            try:
                arcpy.gp.command(
                    'TransferFiles "' + inras + '" "' + outpath + '"' )
                # Write output image paths
                outpaths = [outpath + "/" + os.path.basename(img) for img in inpaths]
            except:
                arcpy.AddError("Failed to copy uploaded files to Raster Store.")
    else:
        arcpy.AddError("No image files to be uploaded to hosted raster store.")

    # return only successfully transferred file list
    return outpaths


def downloadUploadedImagestoDataStore(
        items, prjfolder, origin, foldername="data"):
    """
    :param items: the item JSON of uploaded images in server directory.
                  sample input items:
                  {"itemIds":[{"itemId":"i7f0f2a2a-167f-4ea5-b389-b6eacf203316","path":"/images/YUN_0040.JPG"}]}
                  {"uris": [{"uri": "/cloudStores/abc/a.tif", "path": "images/a.tif"}]}
                  {"uris": ["/cloudStores/abc/a.tif", "/cloudStores/abc/b.tif"]}
    :param prjfolder: the data store folder the images will be downloaded to
    :param origin: data origin keyword
                   1. SERVER - data uplaoded using server upload API
                   2. PORTAL - data uploaded using portal upload API
                   3. DATASTORE - data already in data store
    :param foldername: name of the sub folder that will be used to store uploaded images
    :return: data folder that contains copied images, and also a list of downloaded files
    """
    try:
        # Prepare image list
        imglist = []
        outnamelist = []
        # Prepare upload data folder
        datafolder = prjfolder + "/" + foldername

        if origin == "SERVER":
            raurl = RASTER_ANALYTIC_HELPER
            # If cannot get Raster Analytics URL, fail right away
            if not raurl:
                arcpy.AddMessage("No Raster Analytics Image Server found.")
                return "", []

            # Loop through the item list
            for itemid in items:
                arcpy.AddMessage("Server upload item ID is: " + str(itemid))
                if isinstance(itemid, dict):
                    if "url" in itemid:
                        arcpy.AddMessage("Uploaded item ID is : {}".format(itemid["url"]))
                        iid = itemid["url"]
                        idurl = raurl + "/admin/uploads/" + iid
                        if "path" in itemid:
                            absname = itemid["path"]
                        else:
                            absname = ""
                            
                        arcpy.AddMessage("Dataset name: {}".format(absname))
                        imglist.append(idurl)
                        outnamelist.append(absname)
                    else:
                        continue
                else:
                    iid = str(itemid)
                    arcpy.AddMessage("Uploaded item ID is : {}".format(iid))
                    idurl = raurl + "/admin/uploads/" + iid
                    imglist.append(idurl)

            # arcpy.AddMessage(str(imglist))
            # arcpy.AddMessage(datafolder)
            # arcpy.AddMessage(str(outnamelist))
            if outnamelist:
                outpaths = _downloadServerItems(imglist, datafolder, outnamelist) #, pathfile=pathfile)
            else:
                outpaths = _downloadServerItems(imglist, datafolder) #, pathfile=pathfile)
            # return the actual paths of the output
            if outpaths:
                # arcpy.AddMessage("Downloaded data paths: {}".format(str(outpaths)))
                imglist = outpaths
        elif origin == "PORTAL":
            # TODO: support output data path for portal uploaded item.
            datafolder, imglist = downloadPortalImagestoDataStore(items, prjfolder, foldername)
        elif origin == "DATASTORE":
            # 1. Ready the input image paths
            # Check if the input has "path" key to specify specific output path
            inpaths = []
            for uri in items:
                # arcpy.AddMessage("Data store item is: " + str(uri))
                if isinstance(uri, dict):
                    if "uri" in uri:
                        arcpy.AddMessage("Data store item path is: {}".format(uri["uri"]))
                        if "path" in uri:
                            absname = uri["path"]
                        else:
                            absname = ""
                        # arcpy.AddMessage("Output dataset name is: {}".format(absname))
                        inpaths.append(uri["uri"])
                        outnamelist.append(absname)
                    else:
                        continue
                else:
                    arcpy.AddMessage("Data store item is : {}".format(str(uri)))
                    inpaths.append(str(uri))

            # Now transferring data from input data store to the raster store
            if inpaths:
                # 2. Need to reconstruct output image path if client specify specific name and folder structure
                outpaths = []
                if outnamelist:
                    for uri in imglist:
                        try:
                            absname = outnamelist[inpaths.index(uri)]
                            # Use / to be safe on cloud store path
                            outpath = datafolder + "/" + absname
                        except:
                            # If didn't find the matching name from the input list, copy as is
                            outpath = datafolder + "/" + os.path.basename(uri)
                            pass
                        outpaths.append(outpath)

                # 3. If custom output paths specified, we have to copy one by one.
                if outpaths:
                    for outpath in outpaths:
                        try:
                            outloc = os.path.dirname(outpath)
                            arcpy.gp.command(
                                "TransferFiles " + inpaths[outpaths.index(outpath)] + " " + outloc)
                            imglist.append(outpath)
                        except:
                            arcpy.AddMessage("Failed to copy output file to output path: {}".format(outpath))
                            continue
                else:
                    try:
                        indata = ";".join(inpaths)
                        arcpy.AddMessage("Transfer input images: {}".format(indata))
                        arcpy.AddMessage("Transfer to Hosted folder: {}".format(datafolder))
                        arcpy.gp.command(
                            "TransferFiles " + indata + " " + datafolder)
                        # Return data folder path and image list
                        imglist = [datafolder + "/" + os.path.basename(img) for img in inpaths]
                    except:
                        arcpy.AddWarning("Failed to transfer image files to raster store.")
                        return "", ""

                # Add trigger file if upload to AGOL
                if RUN_ON_AGOL:
                    _addMeteringTrigger(prjfolder)
            else:
                arcpy.AddError("No image files to upload to hosted raster store.")
                return "", ""

        return datafolder, imglist
    except Exception as err:
        return "", []


def downloadPortalImagestoDataStore(itemids, prjfolder, foldername="data"):
    """
    :param itemids: itemids referencing to images uploaded to the portal folder.
                    the itemid in the list could be referencing to a folder or
                    a single image.
    :param prjfolder: project folder which data will be uplaoded to
    :param foldername: name of the data folder
    :return: data folder that contains copied images, and also a list of downloaded files
    """
    rehgp = hgp.HostedGP(None, None, False)
    imglist = []
    isdatastore = False
    # Check if the output folder is cloud store
    if prjfolder.startswith("/cloudStores") or prjfolder.startswith("/rasterStores"):
        datafolder = os.path.join(arcpy.env.scratchFolder, os.path.basename(prjfolder)) + "/" + foldername
        isdatastore = True
    else:
        datafolder = os.path.join(prjfolder, foldername)

    try:
        if not os.path.exists(datafolder):
            os.makedirs(datafolder)
    except:
        arcpy.AddWarning("Failed to create upload data folder in file share raster store.")
        return "", []

    # Loop through the itemids list
    try:
        for itemid in itemids:
            # Get item info first:
            iteminfo = rehgp.GetItem(itemid)

            # now we need to check whether the item is a folder or single item
            # This is a folder
            if "items" in iteminfo:
                arcpy.AddMessage("This is a portal folder item. Moving image items to raster store...")
                imglist = _downloadFolder(iteminfo, datafolder)
                if imglist:
                    arcpy.AddMessage("Downloading source image folder item {} succeeded.".format(itemid))
                else:
                    arcpy.AddWarning("Downloading source image folder item {} failed.".format(itemid))

            # Otherwise check if the item is image
            elif "type" in iteminfo and "name" in iteminfo:
                if iteminfo["type"] == "Image":
                    imglist.append(_downloadFile(itemid, iteminfo["name"], datafolder))
                    if imglist:
                        arcpy.AddMessage("Downloading source image item {} succeeded.".format(itemid))
                    else:
                        arcpy.AddWarning("Downloading source image item {} failed.".format(itemid))
                else:
                    continue
            else:
                continue
    except:
        arcpy.AddMessage("Exception in download images from Portal.")

    # Now transfer files to cloud store
    if isdatastore and imglist:
        # Have to update output path if it is cloud store
        outpath = prjfolder + "/" + foldername
        outpaths = [os.path.join(outpath, os.path.basename(img)) for img in imglist]
        try:
            indata = ";".join(imglist)
            arcpy.gp.command(
                "TransferFiles " + indata + " " + outpath)
            # Return data folder path and image list
            datafolder = outpath
            imglist = outpaths
        except:
            arcpy.AddWarning("Failed to transfer image files to cloud raster store.")

    return datafolder, imglist


def getImageServiceDatasource(isurl):
    """
    The method to construct the full path of the image service data source path.
    In the case of mosaic dataset, the path could be stored in the path property.
    Or it is stored with Enterprise database connection string and a raster property.
    :param isurl: The input image service URL
    :return: the catalog path of the output image path
    """
    rehgp = hgp.HostedGP(None, None, False)
    try:
        if RUN_ON_AGOL:
            aisurl = getISAdminUrl(isurl)
            token, referer = getToken(isurl)
            # Read and update image service info
            sconf = getServiceInfo(aisurl, token, referer)
            srcpath = getImageServiceCatalogPath(sconf)
        else:
            # arcpy.AddMessage("Getting image service data path from URL: {}".format(inic))
            ic = rehgp.GetImageServiceDataPath(isurl)
            srcpath = ic.path
            # arcpy.AddMessage("The image service data path is {}".format(icpath))
        return srcpath
    except Exception as err:
        arcpy.AddMessage("getImageServiceDatasource Exception: " + str(err))
        return None


def getImageServiceCatalogPath(sconf):
    """
    The method to construct the full path of the image service data source path.
    In the case of mosaic dataset, the path could be stored in the path property.
    Or it is stored with Enterprise database connection string and a raster property.
    :param sconf: The full image service configuration JSON dictionary
    :return: the catalog path of image source
    """
    dspath = ""
    try:
        if isinstance(sconf, dict):
            if "properties" in sconf:
                # Case 1: check "path" property in service configuration
                if "path" in sconf["properties"]:
                    return sconf["properties"]["path"]
                # Case 2: check "connectionString" and "raster" property in service configuration
                elif "connectionString" in sconf["properties"] and "raster" in sconf["properties"]:
                    connectfolder = arcpy.env.scratchFolder
                    mdws = arcpy.gp.command(
                        "CreateDatabaseConnectionFile " + sconf["properties"]["connectionString"] + " " + connectfolder + " " + sconf["properties"]["raster"])
                    dspath = os.path.join(mdws, sconf["properties"]["raster"])
                    return dspath
        return dspath
    except Exception as err:
        arcpy.AddMessage("getImageServiceCatalogPath Exception: " + str(err))
        return ""


"""Hosted Imagery and Orthomapping service utility functions"""
def getMosaicWorkspace(adminurl, name, token, imgfolder="", workspace=""):
    """
    This is the utility method to look up geodatabase in raster store for mosaic
    dataset creation
    :param adminurl: Admin URL of the image server
    :param name: the name of the database to be created
    :param token: server token
    :param imgfolder: absolute path of the imagery folder or just the name
    :param workspace: name of the workspace folder
    :return: geodatabase path and connection string if EGDB
    """

    # Look up raster store that is EGDB and file share type
    filews = ""
    mdws = ""
    # Priority 1: if image folder was given and is a file share, use it first
    if imgfolder:
        if imgfolder.startswith("/fileShare"):
            imgfolder = _lookupdatastorepath(imgfolder) 
        if os.path.exists(imgfolder):
            filews = imgfolder

    # arcpy.AddMessage("getMosaicWs " + filews)
    # Priority 2: Look for file share raster store
    if not filews:
        filews = _getRasterStore(adminurl, token, type="fileshare")[0]
        if filews:
            if workspace:
                filews = filews + "/" + workspace + "/imagery"
            else:
                filews = filews + "/" + name + "/imagery"
    # Priority 3: Check if EGDB connection exists, only use EGDB when there is no file share raster store
    managedrs = _getRasterStore(adminurl, token, type="managed")
    connectstr = managedrs[0]

    if filews:
        # need to swizzle path on linux server
        if os.getenv("WINEPREFIX"):
            z = lambda x: x if x.startswith("Z:") or x.startswith("C:") else "Z:" + x
            filews = z(filews)
        if not os.path.exists(filews):
            try:
                os.makedirs(filews)
            except:
                arcpy.AddWarning("Attempt to create folder in file share raster store failed.")     
        # Now create file geodatabase (with reserved name) in file share raster store
        try:
            arcpy.env.overwriteOutput = 1
            gdbresult = arcpy.CreateFileGDB_management(filews, "fgdb.gdb")
            if gdbresult:
                mdws = gdbresult.getOutput(0)
        except:
            arcpy.AddWarning("Attempt to create file geodatabase in file share raster store failed.")

    # Create connection file for EGDB, file geodatabase for file share
    elif connectstr:
        connectfolder = arcpy.env.scratchFolder
        try:
            mdws = arcpy.gp.command(
                "CreateDatabaseConnectionFile " + connectstr + " " + connectfolder + " " + name)
        except:
            arcpy.AddMessage("Create Enterprise database connection file failed.")
            pass

    # Validate
    if not mdws:
        arcpy.AddError("Create Image Collection requires either file share or enterprise geodatabase raster store.")

    # arcpy.AddMessage("mdws: " + mdws)
    # arcpy.AddMessage("managedrs: " + str(managedrs))
    """End Look up available raster stores."""
    return mdws, managedrs


def getHostedDataFolder(adminurl, name, token, type="auto"):
    """
    This is the utility method to look up raster store that can used for uploaded
    imagery data
    :param adminurl: Admin URL of the image server
    :param name: the name of the folder to be created
    :param token: server token
    :return: file share or cloud store path
             (e.g. \\shareserver\fileshare\somedata or /cloudStores/xyz/...)
    """

    # Look up raster store that is cloud store and file share type
    prjfolder = ""
    # Priority 1: use cloud raster store first
    cloudstore = _getRasterStore(adminurl, token, type="cloud")[0]
    # Priority 2: if cloud raster store not available, create file gdb
    filews = _getRasterStore(adminurl, token, type="fileshare")[0]

    # Return cloud store path or file share path based on option
    if type == "cloud":
        if cloudstore:
            prjfolder = cloudstore + "/" + name
    elif type == "fileshare":
        if filews:
            prjfolder = os.path.join(filews, name)
            if not os.path.exists(prjfolder):
                try:
                    os.makedirs(prjfolder)
                except:
                    arcpy.AddWarning("Attempt to create folder in file share raster store failed.")
    else:
        if cloudstore:
            prjfolder = cloudstore + "/" + name
        elif filews:
            prjfolder = os.path.join(filews, name)
            if not os.path.exists(prjfolder):
                try:
                    os.makedirs(prjfolder)
                except:
                    arcpy.AddWarning("Attempt to create folder in file share raster store failed.")

    # Validate
    if not prjfolder:
        arcpy.AddError("Upload hosted imagery data requires either file share or cloud store raster store.")

    """End Look up available raster stores."""
    return prjfolder


# TO BE deprecated
# def findOutWorkspace(adminurl, name, token):
#     """
#     :param adminurl: the output image collection admin service url
#     :param name: the name of the image collection
#     :param token: the service admin token
#     :return: output workspace to create image collection in and source data folder
#     """
#
#     """TODO Currently using data store priority rule managed fileshare,
#         Always search for data store name "_orthomapping_".
#         Should allow user to choose eventually.
#     """
#
#     filews = _getRasterStore(adminurl, token, type="fileshare")[0]
#     managedws = _getRasterStore(adminurl, token, type="managed")[0]
#
#     # arcpy.AddMessage("Managed database: {}".format(managedws))
#     # arcpy.AddMessage("File share location: {}".format(filews))
#
#     icfolder = os.path.join(filews, name)
#     if not os.path.exists(icfolder):
#         os.makedirs(icfolder)
#
#     if filews == "":
#         arcpy.AddError("No available file share raster data store.")
#         return "", ""
#     elif managedws:
#         # managedws is the connection string
#         try:
#             mdgdb = arcpy.gp.command("CreateDatabaseConnectionFile " + managedws + " " + icfolder + " " + name)
#         except Exception as err:
#             arcpy.AddWarning("Failed to create managed database connection file.")
#             # arcpy.AddMessage(arcpy.GetMessages())
#             # Create a new file geodatabase in file share folder if managed database not found
#             mdgdb = os.path.join(icfolder, name + ".gdb")
#             if not os.path.exists(mdgdb):
#                 arcpy.CreateFileGDB_management(icfolder, name)
#     else:
#         # Create a new file geodatabase in file share folder if no raster store managedb
#         mdgdb = os.path.join(icfolder, name + ".gdb")
#         if not os.path.exists(mdgdb):
#             arcpy.CreateFileGDB_management(icfolder, name)
#
#     return mdgdb, icfolder


def getUTMZoneSR(input):
    """
    :param input: input can be a folder with image file or single image file
    :return: Python spatial refernce object
    """
    try:
        if os.path.exists(input):
            desc = arcpy.Describe(input)
            if os.path.isdir(input):
                for root, dirs, files in os.walk(input):
                    for name in files:
                        imagepath = os.path.join(root, name)
                        # arcpy.AddMessage("File path: "+imagepath)
                        desc = arcpy.Describe(imagepath)
                        if desc.dataType == "RasterDataset":
                            gps = arcpy.GetImageEXIFProperties(imagepath)
                            if len(gps) >= 2:
                                return arcpy.GetUTMFromLocation(gps[0], gps[1])
                            else:
                                return None
                    arcpy.AddMessage("Didn't find GPS coordinate from input image.")
                    return None
                arcpy.AddMessage("Folder does not have image. Didn't find GPS coordinate.")
                return None
            elif desc.dataType == "RasterDataset":
                gps = arcpy.GetImageEXIFProperties(input)
                if len(gps) >= 2:
                    return arcpy.GetUTMFromLocation(gps[0], gps[1])
                else:
                    return None
            else:
                return None
        else:
            return None
    except:
        # arcpy.AddMessage("Didn't find GPS coordinate in images.")
        return None


def createMD(icws, mdname, srcode=arcpy.SpatialReference(3857), props=None, overwrite=0):
    """
    :param icws: the workspace used to create image collection in
           mdname: must be a mosaic dataset name string. The mosaic dataset is
                  always created in a reserved database. If the mosaic dataset
                  already existed, return error. Otherwise it will be
                  created.
    :param srcode: This is required to create new mosaic dataset, default is
                   Mercator.
    :return: full mosaic dataset path and folder for image collection.
    """
    try:
        # parse additional creation properties
        createprops = getMosaicCreateProperties(props)
        # arcpy.AddMessage(createprops)
        # Do not allow overwrite, will return mosaic dataset path, if already exist
        arcpy.env.overwriteOutput = overwrite
        if createprops["bandMapping"] and createprops["bandMapping"] != "#" and createprops["bandMapping"] != "":
            result = arcpy.CreateMosaicDataset_management(
                icws, mdname, srcode, num_bands=createprops["bandCount"], product_definition="CUSTOM",
                product_band_definitions=createprops["bandMapping"])
        else:
            result = arcpy.CreateMosaicDataset_management(
                icws, mdname, srcode, num_bands=createprops["bandCount"])
        arcpy.AddMessage("Finished creating empty mosaic dataset.")

        # Tool execute successfully, mosaic dataset created.
        if result.status == 4:
            mdpath = result.getOutput(0)
            arcpy.AddMessage("Create empty image collection successfully.")
            return mdpath
        else:
            arcpy.AddError("Failed to create image collection: {}".format(arcpy.GetMessages()))
            return ""

    except arcpy.ExecuteError:
        for i in range(0, arcpy.GetMessageCount()):
            # Check if output mosaic dataset already exist
            if arcpy.GetReturnCode(i) == 258:
                msg = arcpy.GetMessage(i)
                mdpath = msg[msg.find("Output")+6:msg.find("already exists")].strip()
                if mdpath != "":
                    desc = arcpy.Describe(mdpath)
                    if desc.dataType == "MosaicDataset":
                        arcpy.AddError("Image collection already existed. Use Update Image Layer to update image collection.")
                        return ""
                    else:
                        arcpy.AddError("Existing dataset is not image collection. Use a different name")
                        return ""
                else:
                    arcpy.AddError("Failed to create image collection. Dataset exists but no path found.")
                    return ""
        arcpy.AddError("Failed to create image collection: {}".format(arcpy.GetMessages()))
        return ""
    except OSError:
        arcpy.AddError("Cannot create image collection folder in raster store.")
        return ""
    except Exception as err:
        arcpy.AddError("createMD Exception: "+str(err))
        return ""


def get_uploaded_mosaic_dataset(initems):
    """
    Parse the uploaded mosaic dataset path, and apply simple validation
    :param initems: input data paths
    :return: mosaic dataset paths and new data path.
    """
    uploaded_md = ""
    oldpath = ""
    try:
        in_data = _parsecontext(initems)
        # the uploaded mosaic dataset can be given with the "mosaic_dataset" key in input JSON
        if "mosaic_dataset" in in_data and in_data["mosaic_dataset"]:
            uploaded_md = in_data["mosaic_dataset"]
        # Note: we want to move away from client giving mosaic dataset path in a separate key "mosaic_dataset" key,
        # instead we want to read from "uri" input.
        # but for backward compatibility, we will check the mosaic_dataset key first, only when not given there
        # we check "uri" mosaic dataset.
        elif "uri" in in_data and in_data["uri"]:
            uploaded_md = in_data["uri"]

        # Now check if the path is a FGDB in a cloud store, only return the path if yes
        if uploaded_md.startswith("/cloudStores") or uploaded_md.startswith("/vsi"):
            # if the cloud store path is a dataset in fgdb, return True for now
            dir_path = os.path.dirname(uploaded_md)
            if not dir_path.endswith(".gdb"):
                uploaded_md = ""
        elif uploaded_md.startswith("https://"):
            gdb_part = uploaded_md.split("/")[-2]
            # if the url is pointing to blob storage mosaic dataset, also return true
            if not gdb_part.endswith(".gdb"):
                uploaded_md = ""
        elif not isMosaic(uploaded_md):
            uploaded_md = ""
        else:
            uploaded_md = ""

        # data_path could have three variation:
        # 1. simple string - "d:/0_AGOL/testdata/"
        # 2. list of string - ["d:/0_AGOL/testdata1", "d:/0_AGOL/testdata2"]
        # 3. list of objects - [{"source": "d:/0_AGOL/testdata1", "target": "D_LM/0_AGOL/testdata1"}]
        if "data_path" in in_data and in_data["data_path"]:
            oldpath = in_data["data_path"]

        return uploaded_md, oldpath
    except Exception as err:
        return uploaded_md, oldpath


def transfer_mosaic_dataset(mdpath, mdws, newmdname):
    """
    Transfering mosaic dataset from uploaded location to managed gdb raster store
    :param mdpath: uploaded mosaic dataset in the format of absolute path
    :param mdws: raster store gdb where the mosaic dataset will be transferred to
    :param newmdname: new unique mosaic dataset name
    :return: output path of the successfully transferred mosaic dataset
    """
    outmd = ""
    try:
        # parse input mosaic dataset path, move fgdb mosaic dataset to temp folder
        if ".gdb" in mdpath:
            mdname = os.path.basename(mdpath)
            if mdname:
                # Move geodatabase from cloud store to local temp folder first
                gdbpath = mdpath[:mdpath.find(".gdb")+4]
                gdbname = os.path.basename(gdbpath)
                tempgdb = arcpy.env.scratchFolder + "/" + gdbname
                arcpy.gp.command(
                    "TransferFiles " + gdbpath + " " + tempgdb)
                tempmd = os.path.join(tempgdb, mdname)
                # arcpy.AddMessage(tempmd)
                # arcpy.AddMessage(mdws)

                if arcpy.Exists(tempmd) and mdws:
                    outmd = os.path.join(mdws, newmdname)
                    # arcpy.AddMessage(outmd)
                    arcpy.management.Copy(tempmd, outmd)
                    arcpy.AddMessage("Transfer uploaded mosaic dataset succeeded.")
                    return outmd
                else:
                    arcpy.AddError("Failed to transfer uploaded mosaic dataset, or missing mosaic dataset workspace.")
        else:
            arcpy.AddError("Invalid uploaded mosaic dataset path.")

        return outmd
    except Exception as err:
        arcpy.AddError("Failed to transfer uploaded mosaic dataset, possible corrupted data.")
        return None


def repair_mosaic_dataset_paths(mdpath, oldpath, datafolder):
    """
    repair mosaic dataset source data path
    :param mdpath: mosaic dataset absolute path
    :param oldpath: the old path current mosaic dataset is used
    :param datafolder: the new data path mosaic dataset should be repaired to
    :return: boolean - True for successful repair, False for failed attempt
    """
    try:
        pathlist = ""
        if oldpath:
            # Need real data path if datafolder is data store path
            datafolder = _lookupdatastorepath(datafolder)
            if isinstance(oldpath, str) and datafolder:
                pathlist = " ".join([oldpath, datafolder])
            elif isinstance(oldpath, list):
                plist = []
                for i in oldpath:
                    if isinstance(i, dict):
                        if "source" in i and isinstance(i["source"], str):
                            newpath = i["source"]
                            if "target" in i and isinstance(i["target"], str):
                                if datafolder:
                                    targetpath = datafolder.rstrip("/").rstrip("\\") + "/" + i["target"].replace("\\", "/").lstrip("/")
                                else:
                                    targetpath = i["target"].replace("\\", "/")
                                # Only create path repair list if target path existed
                                if targetpath:
                                    plist.append("'"+newpath+"'" + " " + "'"+targetpath+"'")
                    elif isinstance(i, str):
                        plist.append(i + " " + datafolder)
                pathlist = ";".join(plist)
            else:
                return False
            # Only repair path when there is path to repair
            if pathlist:
                arcpy.management.RepairMosaicDatasetPaths(mdpath, pathlist)
                arcpy.AddMessage("Repair uploaded mosaic dataset data path succeeded.")
                return True
        return False
    except Exception as err:
        arcpy.AddError("Failed to repair data paths for uploaded mosaic dataset.")
        return False


def _setOrthomappingStates(icpath, states=None):
    """
    Set orthomapping states, update or append only
    :param icpath: the image collection path
    :param states: JSON dictionary of orthomapping states
    :return: Dictionary value of orthomapping status
    """
    newstates = {}

    # Read old state first
    try:
        oldstates = arcpy.GetRasterKeyMetadata(icpath, "orthomapping")
    except Exception as err:
        oldstates = None

    # New read the new states
    try:
        if states and isinstance(states, dict):
            if oldstates:
                if isinstance(oldstates, str):
                    oldjson = list(getJSON(oldstates))
                    if len(oldjson) > 0:
                        oldjson = oldjson[0]
                        newstates = dict_merge(oldjson, states)
                elif isinstance(oldstates, dict):
                    newstates = dict_merge(oldstates, states)
            else:
                newstates = states

        if newstates:
            arcpy.SetRasterKeyMetadata(icpath, "orthomapping", json.dumps(newstates))
            return newstates
        else:
            return oldstates

    except Exception as err:
        arcpy.AddWarning("Cannot set new orthomapping states to image collection")
        return oldstates


def _getOrthomappingStates(icpath):
    """
    Get orthomapping states, if no states, return empty dictionary
    :param icpath: the image collection path
    :return: JSON dictionary of orthomapping status
    """
    try:
        orthostates = arcpy.GetRasterKeyMetadata(icpath, "orthomapping")
        orthodict = json.loads(orthostates)

        return orthodict
    except Exception as err:
        arcpy.AddMessage("No orthomapping states found in image collection")
        return {}


def _getAdjustIndex(icpath):
    """
    This method is used to get the adjustment index from the orthomapping states
    :param icpath: the image collection path
    :return: the adjustment index
    """
    try:
        # After decorator, icpath is the returned result of states
        orthostates = _getOrthomappingStates(icpath)
        if "adjust_index" in orthostates:
            if isinstance(orthostates["adjust_index"], int):
                return orthostates["adjust_index"]

        return None
    except Exception as err:
        arcpy.AddWarning("Cannot get the adjustment index.")
        return None


def _validateControlPoints(cpnt):
    """
    This simple function is to validate and return the control points
    set URL or JSON string
    :param cpnt: This is the control points JSON or a feature service
    :return: valid control point JSON string
    """
    try:
        cpntdict = json.loads(cpnt)
        # If URL or itemId is found, it could be a feature service
        if "url" in cpntdict:
            return cpntdict["url"]
        elif "itemId" in cpntdict:
            url = getISUrlFromItemID(cpntdict["itemId"])
            return url
        else:
            # The control point could also just be JSON
            # Return the dictionary or list
            return cpntdict

    except Exception as err:
        arcpy.AddMessage("Not a valid control points JSON.")
        return ""


def _parseAdjArgs(context):
    """
    :param context: additional parameter values for compute adjustments and control points
    :return: dictionaries of additional parameters
    """
    # Polygon mask could be a feature service
    # {"url": ""} or {"itemId": ""} or {"uri": ""}
    adjparams = {
        "initPointResolution": 8.0,
        "maxResidual": 5.0,
        "pointSimilarity": "MEDIUM",
        "pointDensity": "MEDIUM",
        "pointDistribution": "RANDOM",
        "polygonMask": "",
        "adjustOptions": "",
        "regenTiepoints": False,
    }

    try:
        # ComputeTiePoints_management(
        #     in_mosaic_dataset, out_control_points, {similarity}, {in_mask_dataset},
        #     {out_image_features}, {density}, {distribution}, {location_accuracy})
        # ComputeBlockAdjustment_management(
        #     in_mosaic_dataset, in_control_points, transformation_type,
        #     out_solution_table, {out_solution_point_table},
        #     {maximum_residual_value}, {adjustment_options;adjustment_options...},
        #     {location_accuracy}, {out_quality_table})
        # ComputeCameraModel_management(
        #     in_mosaic_dataset, {out_dsm}, {gps_accuracy}, {estimate}, {refine},
        #     {apply_adjustment}, {maximum_residual}, {initial_tiepoint_resolution},
        #     {out_control_points}, {out_solution_table}, {out_solution_point_table},
        #     {out_flight_path}, {maximum_overlap}, {minimum_coverage}, {remove},
        #     {in_control_points}, {options;options...})
        #
        if context == "" or context == "#":
            return adjparams

        contextdict = _parsecontext(context)

        if "initPointResolution" in contextdict:
            if contextdict["initPointResolution"]:
                adjparams["initPointResolution"] = contextdict["initPointResolution"]

        if "maxResidual" in contextdict:
            if contextdict["maxResidual"]:
                adjparams["maxResidual"] = contextdict["maxResidual"]

        if "pointSimilarity" in contextdict:
            if contextdict["pointSimilarity"]:
                adjparams["pointSimilarity"] = contextdict["pointSimilarity"]

        if "pointDensity" in contextdict:
            if contextdict["pointDensity"]:
                adjparams["pointDensity"] = contextdict["pointDensity"]

        if "pointDistribution" in contextdict:
            if contextdict["pointDistribution"]:
                adjparams["pointDistribution"] = contextdict["pointDistribution"]

        if "polygonMask" in contextdict:
            if contextdict["polygonMask"]:
                adjparams["polygonMask"] = getInDataPath(contextdict["polygonMask"])

        if "regenTiepoints" in contextdict:
            adjparams["regenTiepoints"] = contextdict["regenTiepoints"]

        if "adjustOptions" in contextdict:
            # Adjustment options should be like this ["CameraCalibration 0", ...]
            adjops = contextdict["adjustOptions"]
            if adjops and isinstance(adjops, list):
                adjparams["adjustOptions"] = ";".join([adjop for adjop in adjops if isinstance(adjop, str) or isinstance(adjop, str)])

        return adjparams

    except Exception as err:
        return adjparams


def _parseCandidate(context):
    """
    :param context: additional parameters for computing mosaic dataset candidate
    :return: dictionary of mosaic dataset candidate parameters
    """
    candiparams = {
        "computeCandidate": False,
        "maxOverlap": 0.6,
        "maxLoss": 0.05,
    }

    try:
        # Generate point cloud syntax
        # ComputeMosaicCandidates_management(
        #     in_mosaic_dataset, {maximum_overlap}, {maximum_area_loss})
        if context == "" or context == "#":
            return candiparams

        contextdict = _parsecontext(context)

        if "computeCandidate" in contextdict:
            candiparams["computeCandidate"] = contextdict["computeCandidate"]

        if "maxOverlap" in contextdict:
            candiparams["maxOverlap"] = contextdict["maxOverlap"]

        if "maxLoss" in contextdict:
            candiparams["maxLoss"] = contextdict["maxLoss"]

        return candiparams
    except Exception as err:
        return candiparams


def _parseSeamlines(context):
    """
    :param context: additional parameter values for generate seamlines
    :return: dictionaries of additional parameters
    """
    seamlineparams = {
        "seamlinesMethod": "DISPARITY",
        "minRegionSize": 100,
        "pixelSize": "",
        "blendType": "Both",
        "blendWidth": None,
        "blendUnit": "Pixels",
        "requestSizeType": "Pixels",
        "requestSize": 1000,
        "minThinnessRatio": 0.05,
        "maxSliverSize": 20
    }

    try:
        # BuildSeamlines_management(
        #     in_mosaic_dataset, {cell_size;cell_size...}, {NORTH_WEST | CLOSEST_TO_VIEWPOINT |
        #     BY_ATTRIBUTE}, {ASCENDING | DESCENDING}, {order_by_attribute}, {order_by_base_value},
        #     {view_point}, {RADIOMETRY | GEOMETRY | COPY_FOOTPRINT | COPY_TO_SIBLING | EDGE_DETECTION |
        #     VORONOI | DISPARITY}, {blend_width}, {BOTH | INSIDE | OUTSIDE}, {request_size}, {PIXELS |
        #     PIXELSIZE_FACTOR}, {PIXELS | GROUND_UNITS}, {area_of_interest}, {where_clause},
        #     {IGNORE_EXISTING | UPDATE_EXISTING}, {min_region_size}, {min_thinness_ratio}, {max_sliver_size})
        if context == "" or context == "#":
            return seamlineparams

        contextdict = _parsecontext(context)

        if "seamlinesMethod" in contextdict:
            seamlineparams["seamlinesMethod"] = contextdict["seamlinesMethod"]

        if "minRegionSize" in contextdict:
            seamlineparams["minRegionSize"] = contextdict["minRegionSize"]

        if "pixelSize" in contextdict:
            if contextdict["pixelSize"]:
                seamlineparams["pixelSize"] = contextdict["pixelSize"]

        if "blendType" in contextdict:
            seamlineparams["blendType"] = contextdict["blendType"]

        if "blendWidth" in contextdict:
            seamlineparams["blendWidth"] = contextdict["blendWidth"]

        if "blendUnit" in contextdict:
            seamlineparams["blendUnit"] = contextdict["blendUnit"]

        if "requestSizeType" in contextdict:
            seamlineparams["requestSizeType"] = contextdict["requestSizeType"]

        if "requestSize" in contextdict:
            seamlineparams["requestSize"] = contextdict["requestSize"]

        if "minThinnessRatio" in contextdict:
            seamlineparams["minThinnessRatio"] = contextdict["minThinnessRatio"]

        if "maxSliverSize" in contextdict:
            seamlineparams["maxSliverSize"] = contextdict["maxSliverSize"]

        return seamlineparams

    except Exception as err:
        return seamlineparams


def _checkdefinenodata(contextdict):
    """
    :param context: additional parameter values for define nodata
    This function is looking for define nodata arguments like this:
    {"noDataArguments": {"noDataValue": ...., }}
    :return: dictionaries of additional parameters
    """
    ndargs = {}
    try:
        if "defineNodata" in contextdict:
            if isinstance(contextdict["defineNodata"], bool) and contextdict["defineNodata"]:
                if "noDataArguments" in contextdict:
                    return contextdict["noDataArguments"]
        return ndargs
    except Exception as err:
        return ndargs


def _checkbuildfootprints(contextdict):
    """
    :param context: additional parameter values for build footprints
    This function is looking for footprint arguments like this:
    {"footprintsArguments": {"footprintsMethod": ...., }}
    :return: dictionaries of additional parameters
    """
    ftargs = {}
    try:
        if "buildFootprints" in contextdict:
            if isinstance(contextdict["buildFootprints"], bool) and contextdict["buildFootprints"]:
                if "footprintsArguments" in contextdict:
                    return _parseFootprints(contextdict["footprintsArguments"])
                else:
                    return _parseFootprints("#")

        return ftargs
    except Exception as err:
        return ftargs


def _checkbuildoverview(contextdict):
    """
    :param contextdict: additional parameter values for build footprints
    This function is looking for overview arguments like this:
    {"buildOverviewArguments": {"cellSize": ...., }}
    :return: dictionaries of additional parameters
    """
    ovrargs = {}
    try:
        if "buildOverview" in contextdict:
            if isinstance(contextdict["buildOverview"], bool) and contextdict["buildOverview"]:
                if "buildOverviewArguments" in contextdict:
                    return _parseOverview(contextdict["buildOverviewArguments"])
                else:
                    return _parseOverview("#")

        return ovrargs
    except Exception as err:
        return ovrargs


def _parsecontext(context):
    """
    :param context: additional parameter values for RA tools in JSON String
    :return: python dictionnary of parameter name/value pairs
    """
    try:
        contextdict = {}
        if context == "" or context == "#":
            return {}
        elif isinstance(context, dict):
            contextdict = context
        else:
            context = json.loads(context)
            if isinstance(context, str):
                context = json.loads(context)
            if isinstance(context, dict):
                contextdict = dict((k, v) for k, v in context.items())

        return contextdict
    except Exception as err:
        return {}


def _parseOverview(context):
    """
    :param context: additional parameter values for build footprints
    :return: dictionaries of additional parameters
    """
    overviewparams = {
        "cellSize": ""
    }

    try:
        if context == "" or context == "#":
            return overviewparams
        elif isinstance(context, dict):
            contextdict = context
        else:
            contextdict = _parsecontext(context)

        if "cellSize" in contextdict:
            overviewparams["cellSize"] = contextdict["cellSize"]

        return overviewparams

    except Exception as err:
        return overviewparams


def _parseStatistics(context):
    """
    :param context: additional parameter values for calculate statistics
    :return: dictionaries of additional parameters
    """
    statsparams = {
        "ignoreValues": "#",
        "skipExisting": True,
        "areaOfInterest": "#"
    }

    try:
        params = _parsecontext(context)

        if "ignoreValues" in params:
            statsparams["ignoreValues"] = params["ignoreValues"]

        if "skipExisting" in params:
            statsparams["skipExisting"] = params["skipExisting"]

        if "areaOfInterest" in params:
            statsparams["areaOfInterest"] = params["areaOfInterest"]

        return statsparams
    except Exception as err:
        return statsparams


def _parseFootprints(context):
    """
    :param context: additional parameter values for build footprints
    :return: dictionaries of additional parameters
    """
    footprintsparams = {
        "footprintsMethod": "RADIOMETRY",
        "whereClause": "",
        "minValue": "#",
        "maxValue": "#",
        "numVertices": "",
        "shrinkDistance": 0,
        "maintainEdge": "",
        "skipDerivedImages": "",
        "updateBoundary": "",
        "requestSize": "",
        "minRegionSize": "",
        "simplification": "",
        "edgeTorelance": "",
        "maxSliverSize": 20,
        "minThinnessRatio": ""
    }

    try:
        if context == "" or context == "#":
            return footprintsparams
        elif isinstance(context, dict):
            contextdict = context
        else:
            contextdict = _parsecontext(context)

        if "whereClause" in contextdict:
            footprintsparams["whereClause"] = contextdict["whereClause"]

        if "minValue" in contextdict:
            if not contextdict["minValue"] or contextdict["minValue"] == "null":
                footprintsparams["minValue"] = "#"
            else:
                footprintsparams["minValue"] = contextdict["minValue"]

        if "maxValue" in contextdict:
            if not contextdict["maxValue"] or contextdict["maxValue"] == "null":
                footprintsparams["maxValue"] = "#"
            else:
                footprintsparams["maxValue"] = contextdict["maxValue"]

        if "numVertices" in contextdict:
            footprintsparams["numVertices"] = contextdict["numVertices"]

        if "shrinkDistance" in contextdict:
            footprintsparams["shrinkDistance"] = contextdict["shrinkDistance"]

        if "maintainEdge" in contextdict:
            footprintsparams["maintainEdge"] = contextdict["maintainEdge"]

        if "skipDerivedImages" in contextdict:
            footprintsparams["skipDerivedImages"] = contextdict["skipDerivedImages"]

        if "updateBoundary" in contextdict:
            footprintsparams["updateBoundary"] = contextdict["updateBoundary"]

        if "requestSize" in contextdict:
            footprintsparams["requestSize"] = contextdict["requestSize"]

        if "minRegionSize" in contextdict:
            footprintsparams["minRegionSize"] = contextdict["minRegionSize"]

        if "simplification" in contextdict:
            footprintsparams["simplification"] = contextdict["simplification"]

        if "edgeTorelance" in contextdict:
            footprintsparams["edgeTorelance"] = contextdict["edgeTorelance"]

        if "minThinnessRatio" in contextdict:
            footprintsparams["minThinnessRatio"] = contextdict["minThinnessRatio"]

        if "maxSliverSize" in contextdict:
            footprintsparams["maxSliverSize"] = contextdict["maxSliverSize"]

        return footprintsparams

    except Exception as err:
        return footprintsparams


def _parseColorCorrection(context):
    """
    :param context: additional parameter values for compute color correction
    :return: dictionaries of additional parameters
    """
    ccparams = {
        "skipX": 0,
        "skipY": 0,
        "overwriteStats": "SKIP_EXISTING",
        "colorCorrectionMethod": "DODGING",
        "dodgingSurface": "SINGLE_COLOR",
        "targetImage": ""
    }

    try:
        if context == "" or context == "#":
            return ccparams

        contextdict = _parsecontext(context)

        if "skipX" in contextdict:
            if contextdict["skipX"]:
                ccparams["skipX"] = contextdict["skipX"]

        if "skipY" in contextdict:
            if contextdict["skipY"]:
                ccparams["skipY"] = contextdict["skipY"]

        if "overwriteStats" in contextdict:
            if contextdict["overwriteStats"]:
                ccparams["overwriteStats"] = "OVERWRITE"

        if "colorCorrectionMethod" in contextdict:
            if contextdict["colorCorrectionMethod"]:
                if isinstance(contextdict["colorCorrectionMethod"], str) or isinstance(contextdict["colorCorrectionMethod"], str):
                    ccparams["colorCorrectionMethod"] = contextdict["colorCorrectionMethod"]

        if "dodgingSurface" in contextdict:
            if contextdict["dodgingSurface"]:
                if isinstance(contextdict["dodgingSurface"], str) or isinstance(contextdict["dodgingSurface"], str):
                    ccparams["dodgingSurface"] = contextdict["dodgingSurface"].upper()

        if "targetImage" in contextdict:
            if contextdict["targetImage"]:
                ccparams["targetImage"] = getInDataPath(contextdict["targetImage"])

        return ccparams
    except Exception as err:
        return ccparams


def _parseFields(context):
    """
    :param context: additional input parameter that may contains new fields info
    e.g. {"fields": [{"name": "abc", "type": "xyz"}, {...}]}
    :return: list of new fields in JSON
    """
    fieldslist = []
    try:
        # Parse context parameter first
        if context == "" or context == "#":
            return None
        contextdict = _parsecontext(context)

        if "fields" in contextdict:
            if isinstance(contextdict["fields"], list):
                fieldslist = contextdict["fields"]

        return fieldslist
    except Exception as err:
        return fieldslist


def createFields(fc, fields):
    """
    create additional fields in table
    :param fc: table input, could be table, feature class, mosaic dataset, etc.
    :param fields: list of fields with name and type.
    e.g. [{"name": "abc", "type": "String"}, {}]
    :return: success if all fields added, fail if none of the field added.
    """
    if isinstance(fields, list):
        fieldsdesc = []
        for field in fields:
            if isinstance(field, dict):
                name = ""
                type = ""
                if "name" in field:
                    name = field["name"]
                if "type" in field:
                    type = field["type"]
                if name and type:
                    fieldsdesc.append([name, type, "", "", "", ""])
        # Add new fields to mosaic dataset
        if fieldsdesc:
            try:
                arcpy.management.AddFields(fc, fieldsdesc)
            except arcpy.ExecuteError as err:
                arcpy.AddWarning(err)
            except Exception as err:
                arcpy.AddWarning(err)


def getMosaicCreateProperties(contextdict):
    """
    :param contextdict: additional properties settings as dictionary
    :return: dictionary of properties to be set when create mosaic dataset
    """
    mosaicparams = {
        "bandCount": "#",
        "bandMapping": "#"
    }

    try:
        if not isinstance(contextdict, dict):
            contextdict = _parsecontext(contextdict)

        if "bandCount" in contextdict:
            mosaicparams["bandCount"] = contextdict["bandCount"]

        if "bandMapping" in contextdict:
            # [{"bandName:,"wavelengthMin":,"wavelengthMax":}, ...]
            bandmaplist = []
            bandmap = contextdict["bandMapping"]
            # arcpy.AddMessage(str(bandmap))
            if isinstance(bandmap, list):
                for band in bandmap:
                    if isinstance(band, dict):
                        if "bandName" in band and "wavelengthMin" in band and "wavelengthMax" in band:
                            bandmaplist.append(" ".join([str(band["bandName"]), str(band["wavelengthMin"]), str(band["wavelengthMax"])]))

            if bandmaplist:
                # arcpy.AddMessage(str(bandmaplist))
                mosaicparams["bandMapping"] = ";".join(bandmaplist)

        return mosaicparams
    except Exception as err:
        arcpy.AddMessage("Use default mosaic dataset creation properties.")
        return mosaicparams


def setMosaicProperties(icpath, contextdict):
    """
    :param icpath: mosaic dataset path
    :param context: additional properties settings
    :return:
    """
    try:
        if not isinstance(contextdict, dict):
            contextdict = _parsecontext(contextdict)

        if "sourceType" in contextdict:
            try:
                srctype = contextdict["sourceType"]
                if str(srctype).lower() == "thematic":
                    arcpy.SetMosaicDatasetProperties_management(
                        icpath, resampling_type="NEAREST", data_source_type=srctype)
                else:
                    arcpy.SetMosaicDatasetProperties_management(
                        icpath, data_source_type=srctype)
            except arcpy.ExecuteError:
                arcpy.AddWarning("Failed to set source type.")

    except Exception as err:
        arcpy.AddWarning("Fail to set mosaic dataset properties")


def setRasterProperties(raster, context):
    """
    This is the wrapper for SetRasterProperties GP tool
    :param raster: input raster dataset path
    :param context: context parameters values
    :return:
    """
    try:
        if not isinstance(context, dict):
            context = _parsecontext(context)

        datatype = "#"
        keyprops = "#"
        stats = "#"
        nodata = "#"
        if "sourceType" in context:
            datatype = context["sourceType"]
        if "keyProperties" in context:
            keyprops = context["keyProperties"]
        if "statistics" in context:
            stats = context["statistics"]
        if "nodata" in context:
            nodata = context["nodata"]

        # return if no change requested
        if datatype == keyprops == stats == nodata == "#":
            return

        arcpy.AddMessage("Configuring raster data properties...")
        arcpy.management.SetRasterProperties(
            raster, data_type=datatype, statistics=stats, nodata=nodata,
            key_properties=keyprops
        )

    except arcpy.ExecuteError as err:
        arcpy.AddWarning(arcpy.GetMessages())

    except Exception as err:
        arcpy.AddWarning("Fail to set raster data properties.")


def get_rasterfunc(context):
    """
    Check if raster function template was given in the context parameter.
    As of 10.9.1, the only two possible function template given to copy raster
    request is "raster attribute table" and "colormap" function.
    :param context: context parameter value which contains raster function template in JSON
    :return: the function template
    """
    rasfunction = ""
    contextdict = {}
    if not isinstance(context, dict):
        contextdict = _parsecontext(context)

    # Check existence of raster attribute table function template
    if "rasterAttributeTable" in contextdict:
        try:
            attjson = contextdict["rasterAttributeTable"]
            attxml = os.path.join(arcpy.env.scratchFolder, "attxml.rft.xml")
            arcpy.ConvertRasterFunctionTemplate_management(attjson, attxml, "XML")
            return attxml
        except arcpy.ExecuteError:
            return None

    # Check existence of colormap function template
    if "colormap" in contextdict:
        try:
            clrjson = contextdict["colormap"]
            clrxml = os.path.join(arcpy.env.scratchFolder, "clrxml.rft.xml")
            arcpy.ConvertRasterFunctionTemplate_management(clrjson, clrxml, "XML")
            return clrxml
        except arcpy.ExecuteError:
            return None

    return rasfunction


def insertFunction(icpath, rasfunction):
    """
    This method is used to insert raster function on top of the mosaic dataset.
    Typically this operation should happen after overview generation.
    :param icpath: mosaic dataset path
    :param rasfunction: raster function template extracted from context parameter
    :return: True if function template was inserted successfully to mosaic dataset,
    otherwise False.
    """
    try:
        if rasfunction:
            overwrite = arcpy.env.overwriteOutput
            arcpy.env.overwriteOutput = 1
            arcpy.EditRasterFunction_management(
                icpath, "EDIT_MOSAIC_DATASET", "Insert", rasfunction)
            arcpy.env.overwriteOutput = overwrite
            return True
        return False
    except Exception as err:
        arcpy.AddWarning("Fail to insert function to mosaic dataset.")
        return False


def saveas(inpath, outpath, context=None):
    """
    Make a copy of the input raster
    :param inpath: input raster path
    :param outpath: output raster path
    :return: output raster path
    """
    try:
        # Note: Copy Raster can failed if folder does not exist
        # And Copy Raster tool can create missing folder when copy to cloud store
        if not RUN_ON_AGOL:
            if outpath.startswith("/rasterStores") or outpath.startswith("/fileShares"):
                rspath = _lookupdatastorepath(outpath)
                # arcpy.AddMessage(rspath)
                wspath = os.path.dirname(rspath)
                # arcpy.AddMessage("folder path to check: {}".format(wspath))
                # Handle unique situation, only when the path was updated to file share path
                if not rspath.startswith("/rasterStores") and not rspath.startswith("/fileShares") and not os.path.exists(wspath):
                    os.mkdir(wspath)
                    outpath = rspath
        # arcpy.AddMessage(inpath)
        # arcpy.AddMessage(outpath)

        # Parse addtional environment variables
        moreags = _parsecontext(context)

        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = getparallelfactor(moreags)

        # Check for multidimensional params in context
        asmd = ""
        if "processAsMultidimensional" in moreags:
            asmd = moreags["processAsMultidimensional"]
            if type(asmd) == bool and not asmd:
                asmd = "CURRENT_SLICE"
            else:
                asmd = "ALL_SLICES"

        transpose = "NO_TRANSPOSE"
        if "buildTranspose" in moreags:
            transpose = moreags["buildTranspose"]
            if transpose and type(transpose) == bool:
                transpose = "TRANSPOSE"
            else:
                transpose = "NO_TRANSPOSE"

        # Set GP environment setting
        arcpy.env.overwriteOutput = 1
        arcpy.env.compression = getcompression(context)
        arcpy.env.resamplingMethod = getResamplingMethod(context)
        arcpy.env.cellSize = getCellsize(context)

        # Read additional parameters from context
        nodata = getNodata(context)

        arcpy.management.CopyRaster(
            inpath, outpath, nodata_value=nodata, process_as_multidimensional=asmd,
            build_multidimensional_transpose=transpose)

        # Read dataset path from GP message
        uri = getURI(arcpy.GetMessages(), outpath)
        if uri:
            outpath = uri
        # Set raster data properties if there is any.
        setRasterProperties(outpath, context)

        return outpath
    except arcpy.ExecuteError as err:
        arcpy.AddError("Failed to convert image {}".format(os.path.basename(inpath)))
        arcpy.AddMessage(arcpy.GetMessages())
        return None
    except Exception as err:
        arcpy.AddError("Failed to convert image {}".format(os.path.basename(inpath)))
        return None


def _parseResetOptions(context):
    """
    :param context: additional parameter values for reset mosaic dataset
    :return: reset options
    """
    resetops = ""
    try:
        if context == "" or context == "#":
            return resetops

        contextdict = _parsecontext(context)

        if "reset" in contextdict:
            if contextdict["reset"]:
                resetops = contextdict["reset"]

        return resetops
    except Exception as err:
        return resetops


def _buildoverview(icpath, ovrags, prefix=""):
    """
    Note very important: this build overviews function will only build one
    overview item in the mosaic dataset.
    :param icpath: mosaic dataset path
    :param ovrags: overview computation arguments
    :return:
    """
    try:
        if not ovrags["cellSize"]:
            # 2. Get the proper cell size for the overview tile
            with arcpy.da.SearchCursor(icpath, ["HighPS", "MaxPS"], sql_clause=(None, 'ORDER BY HighPS DESC, MaxPS DESC')) as cur:
                row = cur.next()
                highps = row[0]
                maxps = row[1]
        else:
            highps = float(ovrags["cellSize"])
            maxps = highps * 10

        # arcpy.AddMessage(str(highps))
        # arcpy.AddMessage(str(maxps))
        if highps:
            # Default to 20 times of the lowest resolution image in the collection
            ovrlowcs = highps * 4
            ovrmaxcs = ovrlowcs * 1000
            # Look up hosted data location in the mosaic dataset key metadata
            # The hosted data location keymeta data could be like this:
            # e.g. "_store"  "/cloudStores/<item id>/....,/cloudStores/abc..."
            hostedflder = arcpy.GetRasterKeyMetadata(icpath, "_store")
            if hostedflder and isinstance(hostedflder, str):
                hostedflder = hostedflder.split(",")[0]
                ovrpath = appendcrf(hostedflder + "/ovr")
            else:
                ovrpath = appendcrf(os.path.basename(icpath) + "ovr")

            # For ArcGIS Online, the overview crf will always be in
            # <item id> "folder" in the cloud store
            if RUN_ON_AGOL:
                ovrpath = appendcrf(prefix + "/ovr")

            # Generating single overview tile
            # Note: Copy Raster should be able to create folder if not yet existed
            arcpy.env.cellSize = ovrlowcs
            arcpy.env.scratchWorkspace = None
            # arcpy.AddMessage(icpath)
            # arcpy.AddMessage(ovrpath)
            arcpy.CopyRaster_management(icpath, ovrpath)

            # Need to retrieve the full path of the overview tiles
            # and store the path with mosaic dataset
            uri = getURI(arcpy.GetMessages())
            # Note: if the ovrpath is a complete path, the tool will not return uri.
            if uri:
                ovrpath = uri

            arcpy.AddMessage("Updating service with overview...")
            # Add overview tile to the mosaic dataset
            _addOM2MD(ovrpath, icpath, minps=min(ovrlowcs, maxps))

    except arcpy.ExecuteError as err:
        arcpy.AddMessage(err)
    except Exception as err:
        arcpy.AddMessage(err)


def _definenodata(inraster, ndags):
    """
    Define nodata value for input raster.
    TODO: currently only support mosaic dataset, need to enable support for all raster dataset.
    :param inraster: the input raster data path
    :param ndags: define nodata tool arguments.
                  e.g. {"where": "OBJECTID > 3", "numberOfBand": 3, "noDataValues": [0], "compositeValue": True}}
                       {"where": "OBJECTID > 3", "numberOfBand": 3, "noDataValues": [0, 255, 0], "compositeValue": False}
                       {"where": "OBJECTID > 3", "numberOfBand": 3, "includedRanges": [0, 255], "compositeValue": False}
                       {"where": "OBJECTID > 3", "numberOfBand": 3, "includedRanges": [0, 255, 1, 255, 4, 250], "compositeValue": False}
    :return:
    """
    try:
        # Define default parameter value
        rasdesc = arcpy.Describe(inraster)
        numband = rasdesc.bandCount

        # Parse define nodata parameter
        query = ""
        compval = ""
        if isinstance(ndags, dict):
            if "where" in ndags and isinstance(ndags["where"], str):
                query = ndags["where"]
            if "numberOfBand" in ndags and isinstance(ndags["numberOfBand"], int) and ndags["numberOfBand"] > 0:
                numband = ndags["numberOfBand"]
            if "compositeValue" in ndags and isinstance(ndags["compositeValue"], bool):
                compval = ndags["compositeValue"]
                if compval:
                    compval = "COMPOSITE_NODATA"
                else:
                    compval = "NO_COMPOSITE_NODATA"
            # Parse nodata value, only execute tool if there are values given
            if "noDataValues" in ndags or "includedRanges" in ndags:
                nodata = ndags.get("noDataValues", "")
                validrange = ndags.get("includedRanges", "")
                # Parse nodata value
                if isinstance(nodata, list):
                    if len(nodata) == 1:
                        ndval = "ALL_BANDS " + str(nodata[0])
                    else:
                        index = 1
                        ndlist = []
                        for nd in nodata:
                            ndlist.append("BAND_" + str(index) + " " + str(nd))
                            index += 1
                        ndval = ";".join(ndlist)
                else:
                    ndval = ""
                # Parse valid value range:
                if isinstance(validrange, list):
                    ndlen = len(nodata)
                    if ndlen == 2:
                        vrange = "ALL_BANDS '" + str(validrange) + "'"
                    elif ndlen > 2 and ndlen % 2 == 0:
                        bInd = 1
                        vrlist = []
                        for ind in range(0, ndlen, 2):
                            vrlist.append(
                                "BAND_" + str(bInd) + " '" + str(validrange[ind]) + " " + str(validrange[ind + 1]) + "'")
                            bInd += 1
                        vrange = ";".join(vrlist)
                    else:
                        vrange = ""
                else:
                    vrange = ""

                arcpy.AddMessage("Define Nodata pixels...")
                arcpy.management.DefineMosaicDatasetNoData(
                    inraster, num_bands=numband, bands_for_nodata_value=ndval,
                    bands_for_valid_data_range=vrange, where_clause=query,
                    Composite_nodata_value=compval
                )
                arcpy.AddMessage("Finished define nodata value.")
            else:
                arcpy.AddMessage("No valid argument to define nodata.")

    except arcpy.ExecuteError as err:
        arcpy.AddWarning(err)
    except Exception as err:
        arcpy.AddWarning(err)


def _computeMosaicCandidate(icpath, context):
    try:
        candiparams = _parseCandidate(context)
        if candiparams["computeCandidate"]:
            arcpy.AddMessage("Selecting best mosaic candidates for image collections...")
            arcpy.ComputeMosaicCandidates_management(
                icpath, maximum_overlap=candiparams["maxOverlap"],
                maximum_area_loss=candiparams["maxLoss"])
        else:
            arcpy.AddMessage("Mosaic candidates for image collections are not computed.")
    except arcpy.ExecuteError as err:
        arcpy.AddMessage(err)
    except Exception as err:
        arcpy.AddMessage(err)


def _resetMosaicDataset(icpath, options="ALL"):
    """
    This is the method to reset orthomapping image collection to original state
    :param icpath: the image colleciton (mosaic dataset) unc path
    :param options: list of components that will be reset
    All - reset all
    ["adjustment", "seamlines", "candidates"]
    :return: true for successful reset, false for failure
    """
    try:
        resetall = True
        resetadjust = False
        resetseamlines = False
        resetcandidates = False
        if isinstance(options, str):
            if options.upper() != "ALL":
                resetall = False
        elif isinstance(options, list):
            if "adjustment" in options:
                resetadjust = True
            if "seamlines" in options:
                resetseamlines = True
            if "candidates" in options:
                resetcandidates = True

        if resetall or resetadjust:
            # Reset adjustment with Apply Adjustment tool
            arcpy.AddMessage("Resetting adjustment...")
            arcpy.ApplyBlockAdjustment_management(icpath, adjustment_operation="RESET")
            arcpy.AddMessage("Done resetting adjustment.")

            # Need to rebuild footprint
            arcpy.AddMessage("Rebuilding footprints...")
            arcpy.BuildFootprints_management(icpath, reset_footprint="GEOMETRY")
            arcpy.AddMessage("Done rebuilding footprints.")

        if resetall or resetseamlines:
            # Reset seamlines
            arcpy.AddMessage("Resetting seamlines...")
            mdname = os.path.basename(icpath)
            slpath = os.path.join(os.path.dirname(icpath), "AMD_"+mdname+"_SML")
            arcpy.Delete_management(slpath)
            # arcpy.BuildSeamlines_management(icpath, computation_method="GEOMETRY")
            arcpy.AddMessage("Done resetting seamlines.")
            slstate = {
                "seamlines": ""
            }
            _setOrthomappingStates(icpath, slstate)

            arcpy.SetMosaicDatasetProperties_management(
                icpath, default_mosaic_method="NorthWest"
            )

        if resetall or resetcandidates:
            # Reset mosaic dataset candidates
            if len(arcpy.ListFields(icpath, "candidate", "Long")) > 0:
                arcpy.DeleteField_management(icpath, "candidate")

        # Set image collection properties
        arcpy.AddMessage("Resetting adjustment metadata...")
        orthokp = {
            "blockadjustment": "raw",
            "dem": "",
            "seamlines": "",
            "colorcorrection": "",
            "adjust_index": 0
        }
        orthostates = _getOrthomappingStates(icpath)
        if orthostates:
            orthostates = dict_merge(orthostates, orthokp)
        else:
            orthostates = orthokp
        arcpy.SetRasterKeyMetadata(
            icpath, "orthomapping", json.dumps(orthostates))
        arcpy.AddMessage("Done resetting adjustment states.")

        return True
    except arcpy.ExecuteError as err:
        arcpy.AddMessage(err)
    except Exception as err:
        arcpy.AddMessage(err)
        return False


def _addOM2MD(orthomosaic, icpath, minps=None):
    """
    :param orthomosaic: the ortho mosaic uri
    :param ic: image collection (mosaic dataset) path
    :return: None
    """
    try:
        # Remove existing orthomosaic item as overviews
        with arcpy.da.SearchCursor(icpath, "*", "ProductName='CRFOverview' AND Category=2") as rows:
            for row in rows:
                arcpy.RemoveRastersFromMosaicDataset_management(
                    icpath, where_clause="ProductName='CRFOverview' AND Category=2")
                break

        # Add ortho mosaic image back to mosaic dataset
        result = arcpy.AddRastersToMosaicDataset_management(
            icpath, "Raster Dataset", input_path=orthomosaic,
            duplicate_items_action="OVERWRITE_DUPLICATES"
        )
        omname = os.path.splitext(os.path.basename(orthomosaic))[0]
        if result.status == 4:
            with arcpy.da.UpdateCursor(
                    icpath, ["Category", "ProductName", "HighPS", "MinPS", "MaxPS"],
                    "Name=\'" + omname + "\'") as rows:
                for row in rows:
                    row[0] = 2
                    row[1] = "CRFOverview"
                    if minps and isinstance(minps, float):
                        row[3] = minps
                        row[4] = minps * 1000
                    else:
                        row[3] = row[2]
                        row[4] = row[2] * 1000
                    rows.updateRow(row)
                    break

        # Note: No longer needed since hosted folder will always be created
        #       and added to the _store keymetadata
        # # Add overview path to the key metadata
        # srcpath = arcpy.GetRasterKeyMetadata(icpath, "_store")
        # arcpy.AddMessage("srcpath: {}".format(srcpath))
        # arcpy.AddMessage("srcpath: {}".format(orthomosaic))
        # if srcpath:
        #     arcpy.SetRasterKeyMetadata(
        #         icpath, "_store", srcpath + "," + orthomosaic)
        # else:
        #     arcpy.SetRasterKeyMetadata(
        #         icpath, "_store", orthomosaic)

    except Exception as err:
        arcpy.AddWarning("Cannot add the ortho mosaic image as overview for the image collection")


def swapMDPath(icpath, prjfolder):
    """
    This function is used to back up and prepare the proper image collection path and its
    associated files' paths for block adjustment. We are keeping n versions of adjustment result, so
    the user can reset the image collection to any previous state
    :param icpath: image colleciton (mosaic dataset) path
    :return: list of image collection path and its associated tables' paths
    """
    try:
        """The rule is:
        1. If the image collection name ends with "raw", replace "raw" with "adj" and start table path name with suffix 1
        2. Every time this method is called, add one increment to the suffix
           Every time when swap happens, need to make a copy with all the associated tables/feature classes.
        """
        if not arcpy.Exists(icpath):
            arcpy.AddError("Image collection does not exist.")
            return []

        icpaths = []
        ow = arcpy.env.overwriteOutput
        arcpy.env.overwriteOutput = 1

        # Define search pattern, looking for string ends with number
        # adjind = re.search("_adj_\d+$", icpath)

        # No more multiple versions of mosaic dataset
        # Try to derive the output tables paths
        newicpath = icpath
        newtiepnt = icpath + "_p"
        newsolution = icpath + "_s"
        newsolutionpnt = icpath + "_z"
        newflightpath = icpath + "_f"
        newdsmpath = os.path.join(prjfolder, os.path.basename(icpath) + "_estimate_dsm.crf")
        newadjind = None
        if os.getenv("WINEPREFIX"):
            z = lambda x: x if x.startswith("Z:") or x.startswith("C:") else "Z:" + x
            newtiepnt = z(newtiepnt)
            newsolution = z(newsolution)
            newsolutionpnt = z(newsolutionpnt)
            newflightpath = z(newflightpath)

        orthostates = _getOrthomappingStates(icpath)
        if orthostates:
            if "adjust_index" in orthostates:
                if isinstance(orthostates["adjust_index"], int):
                    adjind = orthostates["adjust_index"]
                    newadjind = adjind + 1
                else:
                    # arcpy.AddError("Not a valid adjustment state index.")
                    arcpy.AddMessage("Initialize adjustment index in image collection.")
                    orthostates["adjust_index"] = 0
                    arcpy.SetRasterKeyMetadata(
                        icpath, "orthomapping", json.dumps(orthostates))
                    newadjind = 1
            else:
                arcpy.AddMessage("Initialize adjustment index in image collection.")
                orthostates["adjust_index"] = 0
                arcpy.SetRasterKeyMetadata(
                    icpath, "orthomapping", json.dumps(orthostates))
                newadjind = 1
        else:
            # arcpy.env.overwriteOutput = ow
            arcpy.AddMessage("Adding orthomapping metadata to image collection.")
            orthokp = {
                "blockadjustment": "raw",
                "dem": "",
                "seamlines": "",
                "colorcorrection": "",
                "adjust_index": 0
            }
            if orthostates:
                orthostates = dict_merge(orthostates, orthokp)
            else:
                orthostates = orthokp
            arcpy.SetRasterKeyMetadata(
                icpath, "orthomapping", json.dumps(orthostates))
            newadjind = 1

        arcpy.env.overwriteOutput = ow
        # Note: there is no need to return GCP JSON file, it will be append to tie point feature class
        icpaths = [newicpath, newtiepnt, newsolution, newsolutionpnt, newflightpath, newdsmpath, newadjind]
        return icpaths

    except Exception as err:
        arcpy.AddError("swapMDPath Exception: " + str(err))
        return []


def useDirectTransfer(inras):
    """
    Detemine whether to use direct transfer for copy data or not.
    This method makes sure that only if the raster is cloud raster format and there
    is no need to persist geotransformation, then we can use direct transfer instead
    of copy raster tool to move data.
    :param inras: input raster path
    :return: True if we can use direct transfer, False if not
    """
    directTransfer = False
    try:
        if isinstance(inras, str):
            if inras.lower().endswith(".crf"):
                directTransfer = True
                # Try to pull down the conf.json file from data store first
                tempdir = tempfile.gettempdir()
                crfconf = os.path.join(tempdir, "conf.json")
                arcpy.TransferFiles_management(inras + "/conf.json", tempdir)

                # check crfconf for geodataXform that is anything beyond identify
                with open(crfconf) as f:
                    confjson = json.load(f)
                    if "geodataXform" in confjson and "type" in confjson["geodataXform"] and confjson["geodataXform"]["type"] != "IdentityXform":
                        directTransfer = False
        return directTransfer
    except:
        return directTransfer


"""Error message handling"""
def AddErrorCode(errorCode, errorMsg, params=None, warning=False):
    """Converts errors into JSON format for localization"""
    msg = {}
    msg["messageCode"] = "RA_{}".format(errorCode)
    if errorMsg[-1]!= ".":
        errorMsg = "{}.".format(errorMsg)
    msg["message"] = errorMsg
    if params:
        msg["params"] = params
    if warning:
        arcpy.AddWarning(json.dumps(msg))
    else:
        arcpy.AddError(json.dumps(msg))


def AddExecuteWarnings(taskName, errorCodes):
    """Find and Log known warnings specified in error codes."""
    try:
        msgs = arcpy.gp.GetAllMessages()
        if msgs:
            warnings = [msg for msg in msgs if msg[0] == 50]
            if warnings:
                for warning in warnings:
                    warningCode = warning[1]
                    try:
                        json.loads(warning[2])
                        arcpy.AddWarning(warning[2])
                    except ValueError:
                        warningMsg = warning[2].split(': ', 1)[-1]
                        AddErrorCode(warningCode, warningMsg, warning=True)
    except:
        msgs = ""


def AddExecuteErrors(taskName, errorCodes):
    """Find and Log known error codes."""

    if taskName in TASK_ERROR_CODES:
        AddErrorCode(TASK_ERROR_CODES[taskName], "{0} failed.".format(taskName))
    else:
        arcpy.AddError("{} failed.".format(taskName))
        arcpy.AddMessage("Note to developer: Add task to TASK_ERROR_CODE dictionary in rasterutils.py")

    # Add publishing privilege errors to error codes
    genericErrorCodes = [100112, 100118]
    for code in genericErrorCodes:
        if code not in errorCodes:
            errorCodes.append(code)

    # e.g. A sample message:
    # {"messageCode":"RA_NNNNN","message":"Distance Accumulation failed. Cause: The geodesic distance method is not currently 
    # supported when a horizontal or vertical factor parameter is specified.","params":{"cause":"The geodesic distance method 
    # is not currently supported when a horizontal or vertical factor parameter is specified."}}
    # Add warnings from tool if any
    AddExecuteWarnings(taskName, errorCodes)
    # Add error messages from tool
    try:
        msgs = arcpy.gp.GetAllMessages()
        # arcpy.AddMessage(str(msgs))
        if msgs:
            errors = [msg for msg in msgs if msg[0] == 100]
            if errors:
                for error in errors:
                    # Use a unique Error code for all RA tool on AGOL for now
                    # errorCode = error[1]
                    errorCode = 120306
                    try:
                        json.loads(error[2])
                        tool_errorMsg = error[2]
                    except ValueError:
                        tool_errorMsg = error[2].split(': ', 1)[-1]
                    
                    # special case for Deep learning tools
                    if taskName in ["ClassifyObjectsUsingDeepLearning", "DetectChangeUsingDeepLearning", "DetectObjectsUsingDeepLearning", "ClassifyPixelsUsingDeepLearning"]:
                        if tool_errorMsg.find("File") > -1 or \
                           tool_errorMsg.find("Traceback") > -1:
                           continue
                        else:
                            try:
                                ast.parse(tool_errorMsg.strip())
                                continue
                            except SyntaxError:
                                pass
                       
                    errorMsg = "Cause of failure: " + tool_errorMsg
                    param = {"cause": tool_errorMsg}
                    AddErrorCode(errorCode, errorMsg, param)

            # report all messages for debugging
            # arcpy.AddMessage("********* All other tool messages for debugging **********")
            # for msg in msgs:
            #     arcpy.AddMessage(msg)
    except:
        msgs = ""

    # Add tool failed message
    # AddExceptionError(taskName)


def AddExceptionError(taskName, err=None):
    """Catch GPCloudExec and Add tool failed message"""
    # arcpy.AddMessage("AddExceptionError")
    
    # report task failed
    if taskName in TASK_ERROR_CODES:
        AddErrorCode(TASK_ERROR_CODES[taskName], "{0} failed. {1}".format(taskName, err))
    else:
        arcpy.AddError("{} failed.".format(taskName))
        arcpy.AddMessage("Note to developer: Add task to TASK_ERROR_CODE dictionary in rasterutils.py")

    if err:
        errorCode = 120306
        #import types
        #if types.TypeType(err) is hgp.GPCloudExec:
        if isinstance(err, hgp.GPCloudExec):
            errmsg = str(err)
            if errmsg:
                errorMsg = "Cause of failure: " + errmsg
            else:
                errorMsg = "GPCloud Exception"
        else:
            if hasattr(err, "message"):
                errorMsg = "Cause of failure: " + err.message
            else:
                errorMsg = "Cause of failure: " + str(err)

        param = {"cause": errorMsg}
        AddErrorCode(errorCode, errorMsg, param)


def getFeatureOrImageServiceExtSR(url, token, referer):
    """
    Get feature service spatial reference from service url. Only works for on
    premises service and public service.
    :param url: feature service url
    :param url: feature service url
    :return: spatial reference object
    """
    arcpy.AddMessage("Getting extent and spatial reference from service url...")
    ext = None
    sr = None
    srjson = None
    try:
        if url == "" or url == "#":
            arcpy.AddMessage("Invalid url")
            return sr, ext

        # Submit request to refresh item
        if token and referer:
            data = {"f": "json", "token": token, "referer": referer}
        else:
            data = {"f": "json"}

        r = requests.post(url, params=data, verify=False)
        msgjson = r.json()

        if "extent" in msgjson:
            extjson = msgjson["extent"]
            if "xmin" in extjson and "xmax" in extjson and "ymin" in extjson and "ymax" in extjson:
                ext = {}
                ext["xmin"] = extjson["xmin"]
                ext["ymin"] = extjson["ymin"]
                ext["xmax"] = extjson["xmax"]
                ext["ymax"] = extjson["ymax"]
            if "spatialReference" in extjson:
                srjson = extjson["spatialReference"]
        elif "spatialReference" in msgjson:
            srjson = msgjson["spatialReference"]
        else:
            # Check spatial reference at feature service or map service level
            # instead of on the layer.
            if url.find("/FeatureServer/") > -1:
                url0 = url[:url.find("/FeatureServer/")] + "/FeatureServer"
            if url.find("/MapServer/") > -1:
                url0 = url[:url.find("/MapServer/")] + "/MapServer"

            r0 = requests.post(url0, params=data, verify=False)
            msgjson0 = r0.json()
            if "spatialReference" in msgjson0:
                srjson = msgjson0["spatialReference"]

        if srjson:
            if "wkid" in srjson:
                sr = arcpy.SpatialReference(srjson["wkid"])
            elif "latestWkid" in srjson:
                sr = arcpy.SpatialReference(srjson["latestWkid"])
            elif "wkt" in srjson:
                sr = arcpy.SpatialReference()
                sr.loadFromString(srjson["wkt"])

        return ext, sr
    except Exception as err:
        arcpy.AddMessage("Error returning None None")
        return ext, sr

def getFeatureCollectionExtSR(inPathOrLayer):
    """
    Get feature collection extent and spatial reference from data path or layer name.
    :param inPathOrLayer: string of data path or layer name
    :return: a dictionary of extent, and spatial reference object
    """
    arcpy.AddMessage("Getting extent and spatial reference from feature collection...")
    ext = None
    sr = None
    try:
        desc = arcpy.Describe(inPathOrLayer)
        sr = desc.spatialReference
        extobj = desc.Extent
        ext = {}
        ext["xmin"] = extobj.XMin
        ext["ymin"] = extobj.YMin
        ext["xmax"] = extobj.XMax
        ext["ymax"] = extobj.YMax
        return ext, sr
    except Exception as err:
        arcpy.AddMessage("Error returning None None")
        return ext, sr

def checkIfJobShouldContinueWithOutputService(outName, serviceType):
    """
    Check if the job should continue given that the output service exists or not
    :param outName: JSON object string that describes the service tool output
    :param serviceType: featureService | imageService
    :return: True | False
    """
    try:
        rehgp = hgp.HostedGP(None, None, False)
        # Get service name from the JSON object string
        jsondict = list(getJSON(outName))[0]
        # Assuming that only the output name is provided from service tool REST or Pro Portal GP tool
        if len(jsondict.keys()) == 1 and "serviceProperties" in jsondict:
            sprops = jsondict["serviceProperties"]
            if len(sprops.keys()) == 1 and "name" in sprops:
                serviceName = sprops["name"]
                path = "portals/self/isServiceNameAvailable"
                postdata = {
                    "f": "json",
                    "name": serviceName,
                    "type": serviceType
                }
                res = rehgp.GenericSharingRequest(path, postdata)
                # The service is created by service tool. Return true to let the job continue if the service doesn't
                # exists, otherwise return False to terminate the job if the service name already exists.
                return res["available"]
            else:
                # This situation wouldn't occur but, just in case, still return True to let the job continue
                return True
        else:
            # The service could be pre-created by WebUI. Here return true just to let the job continue
            return True
    except Exception as err:
        arcpy.AddWarning("Failed to check if the service name exists. Error: {0}".format(str(err)))
        arcpy.AddWarning("This job could take long to fail if the service name exists.")
        return True

def checkitemExist(itemname, item_type, hostedgp):
    """	
    Search on portal to see if item already exists	
    :param itemname: item name string	
    :return: item Id if item already existed, otherwise None	
    """
    try:
        nextstart=0
        total=0
        if itemname:
            itemquery = {"q": "title: '"+itemname+"' AND type: '"+item_type+"'", "f": "json", "num":100}
        else:
            itemquery = {"q": "type: '"+item_type+"'", "f": "json", "num":100}
        founditem = hostedgp.GenericSharingRequest("search", itemquery)
        if founditem and "results" in founditem and "nextStart" in founditem and "total" in founditem :
            results = founditem['results']
            nextstart = int(founditem['nextStart'])
            total = int(founditem["total"])

        while nextstart > 0:
            founditem=None
            founditem = hostedgp.GenericSharingRequest("search", itemquery)
            if founditem and "results" in founditem and "nextStart" in founditem:
                next_results = founditem['results']
                results.extend(next_results)
                nextstart = int(founditem['nextStart'])

        if total > 0 and isinstance(results, list):
            for result in results:
                if isinstance(result, dict) and "title" in result:
                    if result["title"] == itemname and "id" in result:
                        return result["id"]

        return None
    except Exception as err:
        arcpy.AddMessage("error: {}".format(err))
        return None

def getExtensionName(taskName):
    if RUN_ON_K8S and taskName in tasksForImageBasic:
        return "ImageBasic"
    else:
        return "Image"

def checkImageExtension(taskName):
    extName = getExtensionName(taskName=taskName)
    if arcpy.CheckExtension(extName) != "Available":
        raise LicenseError

def _getServerDirectoriesPath(dir_type):
    """
    Get the server directories path
    :param dir_type: The type of the server directory. "arcgisjobs", "arcgisoutput", "arcgisuploads" etc
    :return: The physcial path of the the server directory	
    """
    physicalPath =""
    try:
        raurl = RASTER_ANALYTIC_HELPER
        token, referer = getToken(raurl, 10)
        if raurl:
            url = raurl + "/admin/system/directories/" + dir_type

            data = {"f": "json", "token": token}

            if RUN_ON_K8S:
                r = requests.post(url, data=data, verify=False)
            else:
                r = requests.post(url, params=data, verify=False)

            msgjson = r.json()
            if "physicalPath" in msgjson:
                physicalPath = msgjson["physicalPath"]

        return physicalPath
    except Exception as err:
        return physicalPath

class AnalysisTasks(object):
    """ Class to run Analysis Tasks."""
    def __init__(self, task, analysis_url):
        self.task = task
        token, referer = getToken(analysis_url)
        self.token = token
        self.headers = {"Referer": referer}
        self.analysis_url = analysis_url
        self.task_url = "{}/{}".format(self.analysis_url , self.task)

    @staticmethod
    def rest_response(request):
        """ Sends the request to REST and returns the REST response as json."""
        with urlopen(request) as response:
            json_data = response.read().decode("utf-8")
            json_data = json.loads(json_data)
        if json_data:
            return json_data
        return 

    def analysis_job(self, params):
        """ Submits an Analysis job and returns the job URL for monitoring the
            job status. params is a dict."""
        params.update({"f": "json", "token": self.token})
        data = urlencode(params)
        data = data.encode("utf-8")
        job_url = "{}/submitJob?".format(self.task_url)
        job_url = quote(job_url, safe="/:?")
        try:
            request = Request(job_url, data, self.headers)
            analysis_response = self.rest_response(request)
            if "error" in analysis_response:
                return analysis_response
            if not analysis_response:
                return
            analysis_status_response = self.analysis_job_status(analysis_response)
            if analysis_status_response:
                if "error" in analysis_status_response:
                    return analysis_status_response
                analysis_result = self.analysis_job_results(analysis_status_response)
                if analysis_result:
                    return analysis_result

        except HTTPError as http_error:
            return "HTTP error: {}".format(http_error)
        except URLError as url_error:
            return "URL error: {}".format(url_error)

    def analysis_job_status(self, json_data):
        """ Tracks the status of the submitted analysis job."""
        params = {"f": "json", "token": self.token}
        data = urlencode(params)
        data = data.encode("utf-8")
        if "jobId" in json_data:
            job_id = json_data.get("jobId")
            job_url = "{}/jobs/{}".format(self.task_url, job_id)
            job_url = quote(job_url, safe="/:%")
            request = Request(job_url, data, self.headers)
            job_response = self.rest_response(request)
            if "jobStatus" in job_response:
                while not job_response.get("jobStatus") == "esriJobSucceeded":
                    request = Request(job_url, data, self.headers)
                    job_response = self.rest_response(request)
                    if job_response.get("jobStatus") == "esriJobFailed":
                        job_response["error"] = True
                        return job_response
                    elif job_response.get("jobStatus") == "esriJobTimedOut":
                        return "Job timed out."
                    time.sleep(5)
                if "results" in job_response:
                    return job_response

    def analysis_job_results(self, json_data):
        """ Parses the job result json to get job value information to create feature
            collection or to get information about the feature service created from
            the analysis job. Returns a dict of the job values"""
        params = {"f": "json", "token": self.token}
        data = urlencode(params)
        data = data.encode("utf-8")
        if "results" in json_data and "jobId" in json_data:
            results = json_data.get("results")
            job_id = json_data.get("jobId")
            for key in results.keys():
                if "paramUrl" in results[key]:
                    param_url = results[key].get("paramUrl")                   
                    result_url = "{}/jobs/{}/{}".format(self.task_url, job_id, param_url)
                    result_url = quote(result_url, safe="/:%")
                    request = Request(result_url, data, self.headers)
                    job_results = self.rest_response(request)
                    job_value = job_results.get("value")
                    return job_value

class GPMessagesLogger():
    ''' 
    Class to enable logging of GP messages to a file
    '''
    def __init__(self,context):
        self.logFile = None
        self.loggingEnabled = False
        loggingEnabled = getLogging(context)
        if loggingEnabled:
            logFolder = os.path.dirname(arcpy.env.scratchFolder)
            logFile = logFolder + '/'  + 'GPMessagesLog.txt'
            os.environ["_LOGGING"] = logFile
            self.logFile = logFile
            self.loggingEnabled = True

    def __del__(self):
        if self.loggingEnabled:
            os.environ.pop("_LOGGING", None)
            self.loggingEnabled = False
