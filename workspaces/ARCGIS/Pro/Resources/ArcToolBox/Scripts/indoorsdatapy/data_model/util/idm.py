import base64
import json
import zipfile
from logging import getLogger
import tempfile
import os

from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
# Setup the logger
logger = getLogger(__name__)


def get_cache_dir():
    dr = os.path.join(tempfile.gettempdir(), 'tiles_tmp')
    if not os.path.isdir:
        os.makedirs(dr)
    return dr


def unzip_temporary(zippath, tmpdir=None):
    head, tail = os.path.split(zippath)
    directory = "/tmp/dir_%s" % tail
    if not os.path.exists(directory):
        with zipfile.ZipFile(zippath, 'r') as zipf:
            logger.info(
                "Extracting idm file: < %s > to dir: < %s >" % (
                    zippath, directory))
            zipf.extractall(directory)
    else:
        logger.debug(
            "Found extracted idm file directory: %s. Unzipping skipped" %
            directory)

    return directory



def unzip_cached(zippath, path=None):
    path = path or get_cache_dir()
    filename, _ = os.path.splitext(os.path.basename(zippath))
    directory = "{}/unzipped/{}".format(path, filename)
    if os.path.isdir(directory):
        logger.debug("Using cached unzipped map")
        return directory
    if not os.path.exists(directory):
        logger.debug("Creating building cache directory {}".format(directory))
        os.makedirs(directory)
    with zipfile.ZipFile(zippath, 'r') as zipf:
        logger.debug(
            "Unzipping building to cache directory {}".format(directory))
        zipf.extractall(path=directory)
        return directory


def zipdir(path, zip):
    for root, dirs, files in os.walk(path):
        for d in dirs:
            dirname = os.path.relpath(os.path.join(root, d), path)
            zip.write(os.path.join(root, d), dirname)
        for file in files:
            arcname = os.path.relpath(os.path.join(root, file), path)
            zip.write(os.path.join(root, file), arcname)


class IDM(object):
    """
    IDM Object
    """

    def __init__(self, path, name=None, server_url=None, api_key=None):
        """
        Create an IDM representation of the given IDM file / directory
        :param path: Path to the IDM
        :param name: This determines the name of the idm file when zipping it. 
        If name is not set the name of the input file will be used.
        """
        self.name = os.path.basename(path) if name is None else name
        self.idm_path = path
        self.__api_key = api_key
        self.__server_url = server_url \
            if server_url is not None else 'https://api.indoo.rs'
        self.__mapdir = None

    @classmethod
    def download(cls, building_id, api_key, server_url="https://api.indoo.rs",
                 target_dir="maps"):
        """
        Downloads the building with the given ID and returns the downloaded IDM.
        :param building_id: building id to download
        :param api_key: api key
        :param server_url: server base url, defaults to api.indoo.rs if not set
        :param target_dir: directory the downloaded maps are saved in
        :return: IDM object for the downloaded idm file
        """
        target_path = '{}/{}.idm'.format(target_dir, building_id)
        if os.path.isfile(target_path):
            logger.info('Using cached building {}'.format(target_path))
            return IDM(target_path, building_id, server_url, api_key)

        if api_key is None:
            raise Exception("No API key provided")

        url = '{}/indoors/rest/buildings/{}/mapfile?api_key={}'.format(
            server_url, building_id, api_key)
        req = Request(url)
        req.add_header('Accept', 'application/x-com.customlbs.indoorsmap+zip')
        try:
            res = urlopen(req)
            with open(target_path, "wb") as local_file:
                local_file.write(res.read())
            logger.debug('Downloaded building {}'.format(target_path))
            return IDM(target_path, server_url=server_url, api_key=api_key,
                       name="map_{}".format(building_id))
        except HTTPError as e:
            raise Exception('HTTP Error', e.code, e.reason, url)
        except URLError as e:
            raise Exception('URL Error', e.reason, url)

    def open(self):
        """
        Open the IDM and unzip it if necessary.
        """
        if not os.path.exists(self.idm_path):
            raise Exception('idm file not found')
        if os.path.isfile(self.idm_path):
            self.__mapdir = unzip_cached(self.idm_path)
        elif os.path.isdir(self.idm_path):
            self.__mapdir = self.idm_path

    @property
    def mapdir(self):
        return self.__get_mapdir()

    def __get_mapdir(self):
        if self.__mapdir is None:
            self.open()
        return self.__mapdir

    def zip(self, path=None, name=None):
        """
        Close the IDM working directory and create a zipped IDM file
        :param path target path (if not set a temporary path will be used)
        :param name target filename (if not set the self.name as base is used)
        :returns path to the new idm file
        """
        logger.debug('Zipping IDM')
        mapdir = self.__get_mapdir()
        self.name = "map_{}".format(self.name) if name is None else name
        target_dir = path if path is not None else tempfile.mkdtemp()
        if not os.path.exists(target_dir):
            logger.debug("Creating directory {}".format(target_dir))
            os.makedirs(target_dir)
        target = '{}/{}'.format(target_dir, self.name if self.name.endswith(
            '.idm') else self.name + '.idm')
        zipf = zipfile.ZipFile(target, 'w')
        zipdir(mapdir, zipf)
        zipf.close()
        return target

    def zip_and_upload(self, username=None, password=None,
                       basic_auth_hash=None, path=None,
                       server_url=None, api_key=None, server_key=None):
        zipped = self.zip(path)
        if api_key is None and self.__api_key is None:
            raise Exception('No API key supplied!')

        if server_key is None:
            if basic_auth_hash is None:
                if username is None or password is None:
                    raise Exception(
                        'Insufficient credentials.'
                        ' Please provide either basic_auth_header '
                        'or username and password!')

        url = '{}/indoors/rest/buildings/mapfile?api_key={}&blocking=false' \
            .format(
            server_url if server_url is not None else self.__server_url,
            api_key if api_key is not None else self.__api_key)

        logger.debug('Preparing Upload')
        with open(zipped, 'rb') as zip_file:
            try:
                length = os.path.getsize(zipped)
                req = Request(url, data=zip_file)
                if server_key is not None:
                    req.add_header('x-indoors-server-key', server_key)
                else:
                    if basic_auth_hash is None:
                        basic_auth_hash = base64.b64encode(
                            bytes('{}:{}'.format(username, password).encode(
                                "utf-8"))).decode("utf-8")
                    basic_auth = 'Basic {}'.format(basic_auth_hash)
                    logger.debug('Basic Auth: \'{}\''.format(basic_auth))
                    req.add_header('Authorization', basic_auth)
                req.add_header('Content-Type',
                               'application/x-com.customlbs.indoorsmap+zip')
                req.add_header('Accept',
                               'application/x-com.customlbs.building+json')
                req.add_header('Content-Length', '{}'.format(length))
                req.get_method = lambda: 'PUT'
                logger.debug('Uploading IDM to {}'.format(url))
                response = urlopen(req).read()
                json_str = response.decode('utf-8')
                building = json.loads(json_str.strip("'b\\'"))
                logger.debug(
                    'Building Uploaded with ID {}'.format(building['id']))
                return building['id']
            except HTTPError as e:
                print('HTTP Error {}'.format(e.code))
                print(e.read())
                raise Exception('HTTP Error {}: {} -- URL {}'.format(
                    e.code, e.reason, url))
            except URLError as e:
                raise Exception('URL Error: {} -- URL {}'.format(
                    e.reason, url))
            finally:
                zip_file.close()

    @property
    def db_url(self):
        return 'sqlite:///{}/indoors.db'.format(self.__get_mapdir())
