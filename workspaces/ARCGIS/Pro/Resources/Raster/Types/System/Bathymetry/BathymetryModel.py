# ------------------------------------------------------------------------------
# Copyright 2022 Esri
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ------------------------------------------------------------------------------

import json
import os
import chardet
import uuid

FIELD_NAME_BIS_ID = 'BisDatasetId'
FIELD_NAME_DATASET_PATH = 'BisDatasetPath'
DATA_TYPE = 'DataType'
PROXY_RASTER_PATH = 'ProxyRasterPath'
RASTER_DATA_TYPES = ['GeoTiff (Elevation)', 'GeoTiff (RGB)', 'BAG', 'ASCII Grid', 'Esri Grid', 'GDB Raster', 'Floating Point Grid', 'MRF', 'S102']
POINT_DATA_TYPES = ['Point Cloud (LAS)', 'Point Cloud (LASD)', 'Point', 'Multipoint', 'ShapeFile']


class logger():
    logfile = None

    def log(s):
        log_path = os.path.join(
            os.path.dirname(os.getenv('APPDATA')), "Local", "Esri", "ArcGISPro", "Workflow", "Logs")
        if not os.path.exists(log_path):
            os.makedirs(log_path)
        if not logger.logfile:
            logger.logfile = open(os.path.join(log_path, "bathymetry_model.log"), "w+", encoding="utf-8")  # unicode

        logger.logfile.write(s)
        logger.logfile.write('\n')
        logger.logfile.flush()

    def close():
        logger.logfile.close()


class DataSourceType():
    File = 1
    Folder = 2
    RasterDataset = 128


class RasterTypeFactory():

    def getRasterTypesInfo(self):
        return [
            {
                'rasterTypeName': 'Bathymetry Model',
                'builderName': 'BathymetryDatasetBuilder',
                'crawlerName': 'BathymetryModelCrawler',
                'description': 'Add bathymetric data to mosaic dataset',
                'supportsOrthorectification': True,
                'enableClipToFootprint': False,
                'allowSimplification': False,
                'isRasterProduct': False,
                'dataSourceType': (DataSourceType.File),
                'dataSourceFilter': '*.json'
            }
        ]


class BathymetryDatasetBuilder():

    def __init__(self, **kwargs):
        self.RasterTypeName = 'Bathymetry Model'

    def build(self, itemURI):
        if len(itemURI) <= 0:
            logger.log("Error: No items returned from crawler")
            return None
        try:
            # ItemURI dictionary passed from crawler containing: path, display name, uriProperties
            metadata = {}
            path = None
            if 'path' in itemURI:
                unique_path = itemURI['path']
                path = unique_path.split('@EndOfPath')[0]
            else:
                logger.log("Error: itemURI does not have path property")
                return None
            if 'uriProperties' in itemURI:
                metadata = itemURI['uriProperties']
                logger.log("uriProperties - {}".format(metadata))
            else:
                logger.log("Error: itemURI does not have uriProperties")
                return None
            builtItem = {}
            itemURI['path'] = path # re-assign it to be real path so as to avoid impact on Analyze Mosaic Dataset tool, Export Mosaic Dataset Paths tool
            builtItem['raster'] = {'uri': path}
            builtItem['itemUri'] = itemURI
            builtItem['keyProperties'] = metadata
            builtItemsList = list()
            builtItemsList.append(builtItem)
            logger.log("Building ... {}".format(builtItemsList))
            return builtItemsList
        except Exception as ex:
            logger.log('Exception when BathymetryModelBuilder - {}'.format(str(ex)))
            return None


class BathymetryModelCrawler():

    def __init__(self, **crawlerProperties):
        try:
            self.paths = crawlerProperties['paths']
            self.recurse = crawlerProperties['recurse']
            self.filter = crawlerProperties['filter'] if crawlerProperties['filter'] is not (None or "") else "*.json"
            self.bis_metadata = {}
            self.all_metadata = {}
            self.encoding = None
            self.len_bis_len, self.bis_metadata, self.encoding = self.readMetadata()
            self.pathGenerator = self.createGenerator(self.len_bis_len, self.bis_metadata, self.encoding)
        except Exception as ex:
            logger.log("Exception when BathymetryModelCrawler, unable to construct {}".format(str(ex)))
            return None

    def readMetadata(self):
        logger.log("Read dataset.json")
        for json_path in self.paths:
            # use correct method to decode data from json file, to handle foreign characters
            with open(json_path, 'rb') as jsonfile:  # read binary
                raw_data = jsonfile.read()
            encoding = chardet.detect(raw_data)['encoding']  # detect the encoding method
            with open(json_path, 'r', encoding=encoding) as jf:  # read using correct encoding method
                json_data = jf.read()
                bathy_model = json.loads(json_data)  # decoded data
            # correct some key names to be in line with field names in MD
            all_metadata = bathy_model
            logger.log("all_metadata - {}".format(all_metadata))
            # exclude overviews from the value
            bis_metadata = {}
            all_ids_values = self.getValuePerKwCase(all_metadata, FIELD_NAME_BIS_ID)
            if len(all_ids_values) > 0:
                bis_ids = []
                for i in range(len(all_ids_values)):
                    if all_ids_values[i] != None:
                        bis_ids.append(i)
                len_bis_ids = len(bis_ids)
                if len_bis_ids > 0:
                    for key, value in all_metadata.items():
                        bis_value = []  # reset for each key
                        for i in bis_ids:
                            # only keep the value with BisDatasetId not null to exclude overviews
                            bis_value.append(value[i])
                        bis_metadata[key] = bis_value
        return len_bis_ids, bis_metadata, encoding  # bis_metadata excludes overviews (blank id), inconsistent keywords format from all_metadata

    def next(self):
        logger.log("BathymetryModelCrawler next, to return URI dictionary to Builder")
        return self.getNextUri()

    def getNextUri(self):
        logger.log("getNextUri was called")
        try:
            try:
                self.curRow = {}
                self.curRow = next(self.pathGenerator)
            except StopIteration as ex:
                logger.log("StopException when getNextUri - {}".format(str(ex)))
                return None
            row_dict = self.curRow
            logger.log("row_dict - {}".format(row_dict))
            # extract dataype
            data_type = self.getValuePerKwCase(row_dict, DATA_TYPE)
            # extract source dataset path
            source_dataset_path = self.getValuePerKwCase(row_dict, FIELD_NAME_DATASET_PATH)
            # return path to mosaic dataset, return proxyraster if datatype is point
            path = None
            if data_type in RASTER_DATA_TYPES:
                path = source_dataset_path
            elif data_type in POINT_DATA_TYPES:
                # extract proxyraster path
                proxyraster_path = self.getValuePerKwCase(row_dict, PROXY_RASTER_PATH)
                if proxyraster_path:
                    path = proxyraster_path
            if source_dataset_path:
                display_name = os.path.basename(source_dataset_path).partition(".")[0]
            elif proxyraster_path:
                display_name = os.path.basename(proxyraster_path).partition(".")[0]
            else:
                display_name = ""

            path_unique_guids = path + '@EndOfPath' + self.getValuePerKwCase(row_dict, FIELD_NAME_BIS_ID) + '{{{}}}'.format(str(uuid.uuid4()))  # make the path unique to avoid triggering caching
            uri = {
                'path': path_unique_guids,
                'displayName': display_name,
                # {'BisDatasetPath':'', 'BisDatasetId':'', ...}
                'uriProperties': row_dict
            }
            return uri
        except Exception as ex:
            logger.log("Exception when getNextUri - {}".format(str(ex)))
            return None

    def createGenerator(self, len_bis_len, bis_metadata, encoding):
        logger.log("createGenerator was called")
        try:
            logger.log("Go ahead to use existing bis_metadata read from dataset.json")
            # yield each row
            row = {}
            logger.log("bis_metadata - {}".format(bis_metadata))
            logger.log("length - {}".format(len_bis_len))
            if len_bis_len > 0:
                for order in range(len_bis_len):
                    for key, value in bis_metadata.items():
                        if key == FIELD_NAME_BIS_ID:  # deal with id inconsistent issue
                            if encoding == "utf-8":
                                row[key] = u"{}".format(value[order])  # unicode
                            else:
                                row[key] = value[order]  # used if encoding is not utf-8, rather, it is like ascii
                        else:
                            row[key] = value[order]
                        logger.log(
                            "key - {}, value - {}".format(key, value[order]))
                    logger.log("crawler yield metadata - {}".format(row))
                    yield row  # {'BisDatasetPath':'', 'BisDatasetId':'', ...}
            else:
                yield None

        except Exception as ex:
            logger.log("Exception when createGenerator - {}".format(str(ex)))
            yield None

    def getValuePerKwCase(self, metadata_dict, dict_key):
        dict_value = None
        if not metadata_dict:
            logger.log("Error when getValuePerKwCase - metadata dictionary is None")
            return None
        if metadata_dict.get(dict_key):
            dict_value = metadata_dict[dict_key]
        elif metadata_dict.get(dict_key.upper()):  # for the gdb uses upper case
            dict_value = metadata_dict[dict_key.upper()]
        elif metadata_dict.get(dict_key.lower()):
            dict_value = metadata_dict[dict_key.lower()]  # for the gdb uses lower case
        else:
            logger.log("Error when getValuePerKwCase - No {}, {} or {} exists in metadata dictionary.".format(dict_key, dict_key.upper(), dict_key.lower()))
        return dict_value
