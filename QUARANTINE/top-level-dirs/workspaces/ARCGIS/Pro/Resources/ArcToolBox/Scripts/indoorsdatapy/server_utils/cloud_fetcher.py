# -*- coding: utf-8 -*-
"""# Module for fetching protobuffers from cloud and store them in local cache.
# Also allows to use cached files if are available.

# %%%For basic usage are suitable CachedFetcher and ParallelCachedFetcher
# Consists of classes:
# - CloudContext
# - CloudMetadata
# - CacheFetcher
# - CloudFetcher
# - CachedFetcher
# - ParallelCachedFetcher
"""

import logging
import os
import shutil
import threading
import time

import requests
from indoorsdatapy.server_utils.cloud_entity import *
from indoorsdatapy.server_utils.cloud_env import *
from requests.auth import HTTPBasicAuth

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class FetcherError(object):
    def __init__(self, msg):
        raise AssertionError('FetcherError: %s' % msg)


class CloudContext:
    """
    Basic configuration for Cloud fetcher. Currently just for development
    """
    # TODO use configuration file
    ENTITY = [BUILDINGS, RECORDINGS, SLAMS, IDMS, KPI_BENCHMARKS, KPIS]
    ENVIRONMENT = [DEV, PROD, TEST]
    repeats = 30
    timeout = 10

    # url of cloud
    server = {DEV: 'https://slam-dev.indoo.rs/cloud-api/cache/',
              TEST: 'https://slam-test.indoo.rs/cloud-api/cache/',
              PROD: 'https://slam.indoo.rs/cloud-api/cache/'}

    indoors_cache = os.environ.get('INDOORS_CACHE_DIR',
                                   "{}/.indoors_cache".format(
                                       os.environ.get('HOME', ".")))

    # extensions of files
    proto_ext = 'pb'
    idm_ext = 'idm'

    ser_upload_err = 502
    ser_file_err = 404
    ser_in_process = 202

    @staticmethod
    def validate_env():
        """
        Check if credentials are in os environ
        Returns
        -------
        bool: are credential for cloud in os envirn
        """
        if None in [os.environ.get('HTTP_PASS'),
                    os.environ.get('HTTP_USER')]:
            logger.fatal('Authentication for cloud access is missing, '
                         'check env variables: $HTTP_USER and $HTTP_PASS')
            FetcherError('Authentication for cloud access is missing, '
                         'check env variables: $HTTP_USER and $HTTP_PASS')

    @staticmethod
    def get_instance_name(entity, ident):
        """
        In cloud the instance is defined as endpoint + entity/identifier
        Parameters
        ----------
        entity:  from indoorsdatapy.server_utils.cloud_entity import BUILDINGS,RECORDINGS,IDMS,SLAMS
        ident: id of entity. If not specified than is returned the path to entity

        Returns
        -------
        string: instance
        """
        return '%s/%s' % (entity, ident)

    @staticmethod
    def get_extension(entity):
        """
        For given entity return folder
        Parameters
        ----------
        entity:  from indoorsdatapy.server_utils.cloud_entity import BUILDINGS,RECORDINGS,IDMS,SLAMS

        Returns
        -------
        string: extension of entity
        """
        if entity in [BUILDINGS, RECORDINGS, SLAMS, KPI_BENCHMARKS, KPIS]:
            return CloudContext.proto_ext
        if entity == IDMS:
            return CloudContext.idm_ext
        logger.fatal('Wrong entity')
        FetcherError('CloudContext: Wrong entity')

    @staticmethod
    def get_cache(env, entity, ident=None, extension=None, dir=None, **kwargs):
        """
        For given specification return path to cache
        Parameters
        ----------
        env type of env: from indoorsdatapy.server_utils.cloud_env import DEV,TEST,PROD
        entity:  from indoorsdatapy.server_utils.cloud_entity import BUILDINGS,RECORDINGS,IDMS,SLAMS
        ident: id of entity. If not specified than is returned the path to entity
        extension: format of file, if not specified than is returned path to file fithout extension
        kwargs: not used

        Returns
        -------
        string: path to file
        """

        path = dir or os.path.join(CloudContext.indoors_cache, env, entity)

        if ident:
            if extension:
                ident = "%s.%s" % (ident, extension)
            path = os.path.join(path, ident)
        return path

    @staticmethod
    def init_cache_structure():
        for env in CloudContext.ENVIRONMENT:
            for ent in CloudContext.ENTITY:
                path = CloudContext.get_cache(env, ent)
                if not os.path.isdir(path):
                    os.makedirs(path)


class CacheFetcher(object):
    def __init__(self, env, entity, ident, extension, metadata=None, **kwargs):
        """

        Parameters
        ----------
        env type of env: from indoorsdatapy.server_utils.cloud_env import DEV,TEST,PROD
        entity:  from indoorsdatapy.server_utils.cloud_entity import BUILDINGS,RECORDINGS,IDMS,SLAMS
        idend: unique identifier of entity
        extension: file extension
        metadata: not used
        kwargs
        """
        self.env = env
        self.entity = entity
        self.ident = ident
        self.extension = extension
        self.metadata = metadata

    def get_file(self, dir=None):
        path = CloudContext.get_cache(self.env, self.entity, self.ident,
                                      self.extension, dir=dir)
        return path if os.path.exists(path) else ''


class CloudFetcher(object):
    def __init__(self, endpoint, instance, upload_job, extension=None,
                 **kwargs):
        """

        Parameters
        ----------
        endpoint: API end point of cloud
        instance: is defined as entity/identifier
        upload_job: some instances are not available and upload_job allows to
        convert them on server and upload to the cloud cache. Than are available for download
        extension: specify the
        """
        self.endpoint = endpoint  # https://slam-dev.indoo.rs/cloud-api/cache/
        self.instance = instance  # idms/219.idm
        self.fetched_data = None
        self.upload_job = upload_job
        self.extension = extension

    def get_file(self, to):
        r = self._download()

        if isinstance(to, str):
            try:
                with open(to, 'wb') as f:
                    r.raw.decode_content = True
                    shutil.copyfileobj(r.raw, f)
                    logger.info('File saved to: %s' % to)
                return to
            except Exception as e:
                os.remove(to)
                FetcherError('Saving file error %s' % e)
        else:
            to.write(r.raw)

    @staticmethod
    def _open_url(url):
        """`
        For given url return response
        Parameters
        ----------
        url path

        Returns
        -------
        response to object of server
        """
        response = requests.get(url,
                                auth=HTTPBasicAuth(os.environ['HTTP_USER'],
                                                   os.environ['HTTP_PASS']),
                                stream=True)
        return response

    @staticmethod
    def _get_log(url):
        return url.replace('pb', 'log').replace('idm', 'log')

    def _download(self, forced=False):
        """
        Download data object from cloud API
        Parameters
        ----------
        forced: if true than the conversion of file will be triggered in any case

        Returns
        -------
        response to object of server
        """
        upload_err = 502
        url = self.endpoint + self.instance
        force_url = url + '?force_upload=true'
        if self.extension:
            url += '.' + self.extension

        logger.info('Attempting to fetch file %s' % url)

        if forced:
            response = self._open_url(force_url)
            logger.debug('Forced conversion %s:' % response.status_code)

        response = self._open_url(url)

        if response.status_code == 200:
            logger.debug('File available: status code 200')
            return response

        if response.status_code in [401, 403]:
            FetcherError(
                'Authentication error %s: %s' % (response.status_code, url))

        if response.status_code == 404:
            if self.upload_job:
                logger.debug('Starting upload job(conversion) job')
                response = self._open_url(force_url)
                if response.status_code == upload_err:
                    FetcherError(
                        'Status Code %s: Conversion file error:  %s' % (
                        response.status_code, self._get_log(url)))
            else:
                FetcherError(
                    'File is not available: status code 404: %s' % self._get_log(
                        url))

        for _ in range(CloudContext.repeats):
            logger.debug('Next attempt to get file: %s' % url)
            response = self._open_url(url)

            if response.status_code == 200:
                return response

            if response.status_code == 202:
                logger.debug(
                    "HTTP Status 202: The request has been accepted for processing,"
                    " but the processing has not been completed yet.")
                time.sleep(CloudContext.timeout)
                continue

            if response.status_code == 503:
                logger.debug(
                    "HTTP Error 503: The server is currently unable to handle the"
                    " request due to a temporary overload or scheduled maintenance,"
                    " which will likely be alleviated after some delay.")
                continue

            if response.status_code is upload_err:
                FetcherError('Status Code %s: Conversion file error:  %s' % (
                response.status_code, self._get_log(url)))

            if response.status_code == 404:
                FetcherError(
                    'File is not available: status code 404: %s' % self._get_log(
                        url))

        FetcherError("File is not downloaded")


class CachedFetcher(object):
    def __init__(self, env, entity, out=None, force=False):
        """
        Module for getting protobuf files of given environment and entity. The module initialize structure for cache
                .
        ├── dev
        │   ├── buildings
        │   ├── idms
        │   ├── recordings
        │   └── slams
        ├── prod
        │   ├── buildings
        │   ├── idms
        │   ├── recordings
        │   └── slams
        └── test
            ├── buildings
            ├── idms
            ├── recordings
            └── slams
        and check if the file is available. If not than is fetched from cloud
        Parameters
        ----------
        env type of env: from indoorsdatapy.server_utils.cloud_env import DEV,TEST,PROD
        entity:  from indoorsdatapy.server_utils.cloud_entity import BUILDINGS,RECORDINGS,IDMS,SLAMS
        out: output folder, hint:if None than is use cache folder
        force: if true than local cache is skipped and data are fetched from cloud
        """
        self.sett = dict(
            env=env if env in CloudContext.ENVIRONMENT else logger.error(
                'Wrong environment'),
            entity=entity if entity in CloudContext.ENTITY else logger.error(
                'Wrong entity'),
            out=out)

        CloudContext.init_cache_structure()
        self.force_upload = force
        self.paths = []

    def get_path(self, ident):
        """
        For given id (ident) return list of paths of protobuffers files.
        Parameters
        ----------
        ident: identifier of entity to be download

        Returns
        -------
        list of string: string Path to dto in list()
        """

        if self.sett['out']:
            if not os.path.isdir(self.sett['out']):
                try:
                    os.mkdir(self.sett['out'])
                except:
                    pass

        self.sett['ident'] = ident if isinstance(ident, int) else logger.fatal(
            'Ident must be integer')
        self.sett['instance'] = CloudContext.get_instance_name(
            self.sett['entity'], self.sett['ident'])
        self.sett['endpoint'] = CloudContext.server[self.sett['env']]
        self.sett['extension'] = CloudContext.get_extension(self.sett['entity'])

        cache = CacheFetcher(**self.sett)
        path = cache.get_file(dir=self.sett['out'])

        if not path or self.force_upload is True:
            CloudContext.validate_env()

            if self.sett['entity'] in [BUILDINGS, RECORDINGS, IDMS, KPIS,
                                       KPI_BENCHMARKS]:
                self.sett['upload_job'] = True
            elif self.sett['entity'] in [SLAMS]:
                self.sett['upload_job'] = False

            cache_path_text = CloudContext.get_cache(**self.sett)

            self.sett['out'] = os.path.join(self.sett['out'],
                                            os.path.basename(cache_path_text)) \
                if self.sett['out'] else self.sett['out']
            path = CloudFetcher(**self.sett).get_file(
                self.sett['out'] or cache_path_text)

        logger.info(" %s %s is located in: %s" % (
        self.sett['entity'].upper(), ident, path))
        return path


class ParallelCachedFetcher(object):
    """

    Parameters
    ----------
    env type of env: from indoorsdatapy.server_utils.cloud_env import DEV,TEST,PROD
    entity:  from indoorsdatapy.server_utils.cloud_entity import BUILDINGS,RECORDINGS,IDMS,SLAMS
    out: output folder, hint:if None than is use cache folder
    force: if true than local cache is skipped and data are fetched from cloud
    """

    def __init__(self, env, entity, out=None, force=False):
        self.sett = dict(
            env=env if env in CloudContext.ENVIRONMENT else logger.error(
                'Wrong environment'),
            entity=entity if entity in CloudContext.ENTITY else logger.error(
                'Wrong entity'),
            out=out,
            force=force)
        self.paths = []

    def _process(self, id):
        c = CachedFetcher(**self.sett)
        self.paths.append(c.get_path(id))

    def get_paths(self, idents):
        """
        For given id or list of ids return list of paths
        Parameters
        ----------
        idents: identifier

        Returns
        -------
        list of path to dto
        """
        if isinstance(idents, (int, str)):
            idents = [int(idents)]

        logger.debug('Fetching files in parallel')
        threads = []

        for _id in idents:
            t = threading.Thread(target=self._process, args=(_id,))
            t.start()
            threads.append(t)

        for t in threads:
            t.join()

        return self.paths
