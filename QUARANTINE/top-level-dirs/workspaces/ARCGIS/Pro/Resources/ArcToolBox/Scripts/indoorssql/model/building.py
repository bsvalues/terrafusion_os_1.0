#!/usr/bin/env python
# -*- coding: utf-8 -*-
import logging
from tempfile import NamedTemporaryFile
from urllib.request import Request, urlopen
from indoorssql.model.abstract import ModelSQL

logger = logging.getLogger(__name__)


class BuildingSQL(ModelSQL):

    def __call__(self):
        return None


class BuildingDB(object):
    """Downloads building database from remote API"""

    BUILDING_DB = "{}/buildings/{}/db?api_key={}"

    def __init__(self,
                 building_id,
                 building_key,
                 endpoint="https://api.indoo.rs/indoors/rest"):
        """Construct building database instance for given building.

        :param building_id: unique identifier of the building
        :param building_key: api key for accessing building data from API
        :param endpoint: option to change api [BuildingDB.ENDPOINT]
        """
        self._id = building_id
        self._key = building_key
        self._temp = None
        self._endpoint = endpoint
        self.download()

    def download(self):
        """Download database from API to local storage.

        :return: path to local database file
        """
        url = self.BUILDING_DB.format(self._endpoint, self._id, self._key)
        logger.info("Url of building is < %s >" % url)
        request = Request(url)
        self._temp = NamedTemporaryFile()
        self._temp.write(urlopen(request).read())
        self._temp.flush()

        return self._temp.name

    @property
    def db_url(self):
        """Get database URL in in RFC 1738 format.

        :return: string in RFC 1738 format
        """
        return "sqlite:///{}".format(self.path)

    @property
    def path(self):
        """Get full path to local database file.

        :return: string containing path to local database file
        """
        return self._temp.name
