#!/usr/bin/python
import os
import shutil
import time
import zipfile
from logging import getLogger

from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

import uuid

# Setup the logger
logger = getLogger(__name__)


def cache_exists():
    return os.path.isdir("/tmp/indoors_cache")


def cache_get_building(buildingId, target):
    if cache_contains_building(buildingId):
        shutil.copy(
            "/tmp/indoors_cache/map_" + str(buildingId) + ".idm", target)
    else:
        return False


def cache_contains_building(buildingId):
    return os.path.exists("/tmp/indoors_cache/map_" + str(buildingId) + ".idm")


def cache_put_building(buildinId, path):
    if not cache_exists():
        os.mkdir("/tmp/indoors_cache/")
    shutil.copy(path, "/tmp/indoors_cache/")


def getBuilding(apiKey, buildingId, target):
    url = os.environ['INDOORS_API_HOSTNAME']
    if cache_contains_building(buildingId):
        logger.info("Building in cache")
        cache_get_building(buildingId, target)
        target_path = target + '/map_' + str(buildingId) + '.idm'
        return target_path
    else:
        logger.info("Building not in cache")
        return downloadBuilding(apiKey, buildingId, target, url)


def downloadBuilding(apiKey, buildingId, target,
                     server_url="https://api.indoo.rs", retries=3,
                     retry_interval=30):
    if not server_url:
        server_url = os.environ['INDOORS_API_HOSTNAME']

    # logger.info("Downloading building", buildingId, "from API key", apiKey)
    url = "{}/indoors/rest/buildings/{}/mapfile?api_key={}&blocking=false".format(
        server_url, buildingId, apiKey)
    req = Request(url)
    req.add_header('Accept', 'application/x-com.customlbs.indoorsmap+zip')
    req.add_header('x-indoors-request-uuid', str(uuid.uuid4()))
    current_try = 0
    while current_try <= retries:
        try:
            res = urlopen(req)
            if (res.getcode() == 202):
                # the building is still being exported, so we wait and retry
                logger.info("The building is being exported, so we wait")
                time.sleep(5)
                continue

            target_path = target + '/map_' + str(buildingId) + '.idm'
            with open(target_path, "wb") as local_file:
                local_file.write(res.read())
            cache_put_building(buildingId, target_path)
            return target_path
        except HTTPError as e:
            if e.code == 503:
                current_try += 1
                logger.debug(
                    "Error 503 when downloading IDM. This means most likely that the cache is being generated. Will retry in {} seconds (try {} of {}).".format(
                        retry_interval, current_try, retries))
                time.sleep(retry_interval)
            else:
                logger.error("HTTP Error: {} ({})".format(e.code, url))
                return ""
        except URLError as e:
            logger.error("URL Error {} ({}):".format(e.reason, url))
            return ""


def unzip_building(building_file_path, target_dir_path):
    if not building_file_path == "":
        with zipfile.ZipFile(building_file_path) as z:
            z.extractall(target_dir_path)
