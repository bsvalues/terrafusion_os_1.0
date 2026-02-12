# pylint: disable=logging-fstring-interpolation
from typing import Optional, Dict, Any, Union, List
import json
from urllib.parse import quote, urlencode
import locale
import urllib3
from dataclasses import dataclass
import logging
import os
import uuid

import requests
from requests.exceptions import Timeout, HTTPError
import arcpy
import arcpy.management

from .palog import LogUtils, ToolExit
from .paglobals import Workspace

LOGGER = LogUtils.setup_logger(__name__)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)  # type: ignore
# need to set this for other non-english os
locale.setlocale(locale.LC_ALL, '')

__all__ = ["AOLUtils", "DescribeOutput"]


@dataclass(frozen=True)
class DescribeOutput:
    fields: List[arcpy.Field]
    oidFieldName: str
    shapeFieldName: str
    spatialReference: arcpy.SpatialReference
    extent: arcpy.Extent
    FIDSet: str
    shapeType: str
    catalogPath: str
    featureType: str


class AOLUtils:
    """Utility functions for arcgis online/enterprise. These utility functions
    were moved out of PAUtils to avoid circular import.

    Methods
    -------
        get_sr_from_json(extent_json)
            Get a spatialReference object from a json with extent information.
        create_extent_from_json(extent_json)
            Create an arcpy.Extent object from a json with extent information.
        create_featureset_from_json(featurecollection: Dict)
            Create an arcpy.FeatureSet object from a feature collection json.
        get_featureset_extent(featureset: Dict)
            Get the extent of a feature collection.
        mk_get_request(url: str, params: Dict, headers: Dict, verify: bool,
                       stream: bool, timeout: int)
            Get reponse from a certain URL through requests.get().
        mk_post_request(url: str, params: Dict, headers: Dict, verify: bool,
                        stream: bool, timeout: int)
            Get response from a certain URL through requests.post().
        get_featureservice_extent(featureservice_url: Dict)
            Get the extent of a feature layer through its URL.
        construct_fsextent_query(featureservice: Dict)
            Create a URL to query the extent of the featureservice.
        get_total_feature_count(feature_path: str, within_curr_extent: bool)
            Get the total number of features from a catalog path.
        select_features_in_extent(input_layer: Union[str, arcpy.FeatureSet],
                                  validate_extent: bool,
                                  customed_extent: Optional[arcpy.Extent])
            Select features from input_layer that intersect with the customed extent or arcpy.env.extent.
        atof(input_str: str)
            Convert a string to float number through locale.atof method.
        validate_extent(extent: Optional[arcpy.Extent]) -> Optional[arcpy.Extent]
            Validate if the extent is within the projection domain. Clipping the extent if it falls out.
        get_output_wkspc(count: Optional[int])
            Get the output workspace based on the # of features.
        get_output_wkspcx(count: Optional[int])
            Get the output workspace (either scratchGDB or memory) based on the # of features.

    """
    @staticmethod
    def get_sr_from_json(
        extent_json: Dict
    ) -> Optional[arcpy.SpatialReference]:
        """To create an instance of arcpy.SpatialReference from the extent json.

        Args:
            extent_dict: a json with the extent value.
        Returns:
            An instance of spatial reference (None if able to create an spatial reference).
        Raises:
            No exception. If failed to create the SpatialReference instance, None will be returned.

        """
        if "spatialReference" in extent_json:
            sr_info = extent_json["spatialReference"]
        elif "outSR" in extent_json:
            sr_info = extent_json["outSR"]
        elif isinstance(extent_json, dict):
            sr_info = extent_json
        else:
            LOGGER.debug("Input does not contain valid spatialReference information.")
            return None

        if isinstance(sr_info, dict):
            latestwkid = sr_info.get('latestWkid')
            wkid = sr_info.get('wkid')
            wkt = sr_info.get('wkt')

            if wkt:
                new_sr = arcpy.SpatialReference()
                new_sr.loadFromString(wkt)
                return new_sr
            elif latestwkid:
                return arcpy.SpatialReference(latestwkid)
            elif wkid:
                return arcpy.SpatialReference(wkid)
            else:
                LOGGER.debug("Input does not contain valid spatialReference information.")
                return None
        else:
            LOGGER.debug("Malformed json for spatialReference.")
            return None

    @staticmethod
    def create_extent_from_json(
        extent_json: Dict
    ) -> arcpy.Extent:
        """Create extent from extent json.

        Args:
            extent_json: a json represents extent.
        Returns:
            An instance of arcpy.Extent.
        Raises:
            No exception.

        """
        # This is to deal with the case that user input is from context.
        if "extent" in extent_json:
            extent_json = extent_json["extent"]

        xmin = extent_json['xmin']
        ymin = extent_json['ymin']
        xmax = extent_json['xmax']
        ymax = extent_json['ymax']

        extent = arcpy.Extent(xmin, ymin, xmax, ymax)
        spa_ref = AOLUtils.get_sr_from_json(extent_json)
        extent.spatialReference = spa_ref
        return extent

    @staticmethod
    def create_featureset_from_json(
        featurecollection: Dict
    ) -> Optional[arcpy.FeatureSet]:
        """Create an instance of arcpy.FeatureSet from json.

        Args:
            featureset_json: a json with the featureset content.
        Returns:
            An instance of arcpy.FeatureSet.
        Raises:
            No exceptions.

        """
        if "featureSet" not in featurecollection:
            LOGGER.debug("Invalid feature collection json.")
            return None
        else:
            try:
                poly_str = json.dumps(featurecollection.get("featureSet"), ensure_ascii=False)
                return arcpy.gp.fromEsriJson(poly_str)
            except (ValueError, arcpy.ExecuteError):
                return None

    @staticmethod
    def get_featureset_extent(
        featureset: Dict
    ) -> Optional[arcpy.Extent]:
        """Get the extent of a featureset.

        Args:
            featureset: a feature-collection json.
        Returns:
            An instance of arcpy.Extent.
        Raises:
            No exceptions.

        """
        feature_set = AOLUtils.create_featureset_from_json(featureset)

        if feature_set:
            tmp_lyr = arcpy.management.MakeFeatureLayer(feature_set).getOutput(0)  # type: ignore
            return arcpy.Describe(tmp_lyr.name).extent  # type: ignore
        else:
            return None

    @staticmethod
    def mk_get_request(
        url: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        verify: bool = False,
        stream: bool = True,
        timeout: int = 60,
        response_as_json: bool = True
    ) -> Union[Dict, requests.Response]:  # type: ignore
        """Get the response through requests.get()."""
        try:
            if headers is None:
                headers = {}

            if params:
                params = urlencode(params)  # type: ignore

            response = requests.get(url,
                                    params=params,
                                    data=data,
                                    headers=headers,
                                    verify=verify,
                                    stream=stream,
                                    timeout=timeout)
            if response.status_code == 200:
                return response.json() if response_as_json else response
            else:
                response.raise_for_status()
        except (Timeout, HTTPError, ValueError, AttributeError) as err:
            LOGGER.debug(f"Failed in making get request against {url} due to {str(err)}")
            raise ToolExit from err

    @staticmethod
    def mk_post_request(
        url: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        verify: bool = False,
        stream: bool = True,
        timeout: int = 60
    ) -> Dict:   # type: ignore
        """To get the response from feature count query."""
        try:
            if headers is None:
                headers = {}

            if params:
                params = urlencode(params)  # type: ignore

            response = requests.post(url,
                                     params=params,
                                     data=data,
                                     headers=headers,
                                     verify=verify,
                                     stream=stream,
                                     timeout=timeout)
            if response.status_code == 200:
                return response.json()
            else:
                response.raise_for_status()
        except (Timeout, HTTPError, ValueError, AttributeError) as err:
            LOGGER.debug(f"Failed in making post request against {url} due to {str(err)}")
            raise ToolExit from err

    @staticmethod
    def get_featureservice_extent(
        featureservice_url: Dict
    ) -> Optional[arcpy.Extent]:
        """Get the extent of a feature service layer.

        Args:
            featureservice_url: a json with the url, token information.
        Returns:
            An instance of arcpy.Extent.
        Raises:
            No exceptions.

        """
        if "url" not in featureservice_url:
            LOGGER.debug("Invalid feature_url of: {}".format(featureservice_url))
            return None

        try:
            extent_query_url = AOLUtils.construct_fsextent_query(featureservice_url)
            fs_response = AOLUtils.mk_get_request(extent_query_url)
            return AOLUtils.create_extent_from_json(fs_response.get("extent"))  # type: ignore
        except:  # noqa. pylint: disable=bare-except
            try:
                # If get extent failed, re-try using the signin token
                signin_token = arcpy.GetSigninToken()
                lyr_token = signin_token.get("token")
                headers = {"referer": signin_token.get("referer")} if "referer" in signin_token else {}
                featureservice_url["serviceToken"] = lyr_token
                extent_query_url = AOLUtils.construct_fsextent_query(featureservice_url)
                fs_response = AOLUtils.mk_get_request(extent_query_url, headers=headers)
                return AOLUtils.create_extent_from_json(fs_response.get("extent"))  # type: ignore
            except:  # noqa. pylint: disable=bare-except
                LOGGER.debug("Unable to get the extent from {}".format(featureservice_url))
                return None

    @staticmethod
    def construct_fsextent_query(
        featureservice: Dict
    ) -> str:
        """Create a URL to query the extent of the featureservice.

        Args:
            featureservice: a dictionary with the URL and possibly containing token and filter information.
        Returns:
            A string with the URL to perform extent query.

        """
        fs_url = featureservice["url"]
        service_token = featureservice.get("serviceToken")
        where_clause = featureservice.get("filter", "1=1")
        query_variables = ["returnExtentOnly=true"]
        query_variables.append("where={}".format(quote(where_clause)))
        time_query = featureservice.get("time")
        if time_query:
            query_variables.append("time={}".format(quote(time_query)))
        if service_token:
            query_variables.append("token={}".format(service_token))
        query_variables.append("f=json")
        query_str = '&'.join(query_variables)
        query_url = fs_url + '/query?' + query_str
        LOGGER.debug("query_url: {}".format(query_url))
        return query_url

    @staticmethod
    def get_total_feature_count(
        feature_data: Any,
        within_curr_extent: bool = True
    ) -> int:
        """Get the total # of features from a catalog path.

        Args:
            feature_data: any feature_data that is valid as input for arcpy.management.GetCount.
            within_curr_extent: whether to count features within the current extent or not.
        Returns:
            An integer of the total number of features. If within_curr_extent is true, then only features within
            the current extent is counted. Otherwise all features are counted.

        """
        if not within_curr_extent:
            with arcpy.EnvManager(extent=None):
                total_count = int(arcpy.management.GetCount(feature_data).getOutput(0))  # type: ignore
        else:
            total_count = int(arcpy.management.GetCount(feature_data).getOutput(0))  # type: ignore
        return total_count

    @staticmethod
    def select_features_in_extent(
        input_layer: Union[str, arcpy.FeatureSet],
        validate_extent: bool = False,
        customed_extent: Optional[arcpy.Extent] = None
    ) -> bool:
        """Select features fall within the specified extent.

        Args:
            input_layer: a dataset where features are going to be selected from.
            validate_extent: whether to call the AOLUtils.extent_update to update the extent before selection. Default
            is False since the arcpy.env.extent has been updated when each tool starts.
            customed_extent: a customed extent to use. If None, use the arcpy.env.extent.
        Returns:
            A bool value. True if either customed_extent or arcpy.env.extent exists. False otherwise.
        Raises:
            No exceptions.

        """
        if not isinstance(customed_extent, arcpy.Extent):
            extent = arcpy.env.extent  # type: ignore
        else:
            extent = customed_extent

        if extent:
            if validate_extent:
                arcpy.env.extent = AOLUtils.validate_extent(extent)  # type: ignore

            with arcpy.EnvManager(outputCoordinateSystem=extent.spatialReference):
                arcpy.management.SelectLayerByLocation(input_layer, "INTERSECT", extent.polygon, "#", "NEW_SELECTION")
            return True
        else:
            return False

    @staticmethod
    def validate_extent(extent: Optional[arcpy.Extent]) -> Optional[arcpy.Extent]:
        """Compare the extent with the domain. Clip the extent if it is larger than domain defined by the Extent.

        Args:
            extent (Optional[arcpy.Extent]): an instance of arcpy.Extent.

        Returns:
            Optional[arcpy.Extent]: an instance of arcpy.Extent. For the extent that falls outside of the domain,
            the extent will be truncated.
        """
        if not extent:
            return extent

        spa_ref = extent.spatialReference
        if spa_ref:
            xydomain = spa_ref.domain.split(" ")
            if len(xydomain) >= 4:
                xmin1 = AOLUtils.atof(xydomain[0])
                ymin1 = AOLUtils.atof(xydomain[1])
                xmax1 = AOLUtils.atof(xydomain[2])
                ymax1 = AOLUtils.atof(xydomain[3])
                LOGGER.debug("XY Domain: {},{},{},{}".format(xmin1, ymin1, xmax1, ymax1))

                (xmin, ymin, xmax, ymax) = (extent.XMin, extent.YMin, extent.XMax, extent.YMax)

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
                    extent = arcpy.Extent(xmin, ymin, xmax, ymax)
                    extent.spatialReference = spa_ref
        else:
            LOGGER.debug("Input extent does not have spatialReference.")
        return extent

    @staticmethod
    def atof(input_str: str):
        """Wrap locale.atof function to convert a string to a floating number.

        Args:
            input_str: a string with possibily localed floating number.
        Returns:
            Float number converted from the string.
        Raises:
            ValueError if failed to convert string to float.

        """
        try:
            return locale.atof(input_str)
        except UnicodeDecodeError:
            return locale.atof(input_str.encode("utf-8", "ignore"))  # type: ignore
        except Exception as err:  # noqa. pylint: disable=bare-except
            if isinstance(input_str, (str, bytes)):
                if "," in input_str:
                    input_str = input_str.replace(",", ".")
                    return float(input_str)
            else:
                LOGGER.error("Unable to convert {} to float".format(input_str))
                raise ValueError from err

    @classmethod
    def get_feature_count(cls, dataset: Union[str, arcpy.FeatureSet, arcpy.RecordSet]) -> int:
        """Wrapper of arcpy's GetCount method.

        Args:
            dataset (Union[str, arcpy.FeatureSet, arcpy.RecordSet]): _description_

        Returns:
            int: total count of features/rows in dataset.
        """
        return int(arcpy.management.GetCount(dataset).getOutput(0))  # type: ignore
    
    @classmethod
    def make_feature_layer(cls, data: Union[arcpy.FeatureSet, str],
                           lyr_name: Optional[str] = None,
                           where_clause: Optional[str] = None) -> str:
        """Wrapper of arcpy's MakeFeatureLayer function.

        Args:
            data (Union[arcpy.FeatureSet, str]): dataset to create feature layer from.
            lyr_name (Optional[str], optional): layer name specified. Defaults to None.
            where_clause (Optional[str], optional): where clause to define a subset of features. Defaults to None.

        Returns:
            str: name of the created feature layer.
        """
        return arcpy.management.MakeFeatureLayer(data, f"{lyr_name}{str(uuid.uuid4())}",
                                                 where_clause).getOutput(0).name  # type: ignore
    
    @classmethod
    def create_unique_name(cls, base_name: str, workspace: str) -> str:
        """Wrapper of arcpy's CreateUniqueName function.

        Args:
            base_name (str): base name of the table to created in the workspace.
            workspace (str): absolute path of the workspace.

        Returns:
            str: table name that is unique in the workspace.
        """
        if workspace.lower() == "scratchgdb":
            workspace = arcpy.env.scratchGDB  # type: ignore
        return arcpy.CreateUniqueName(base_name, workspace)  # type: ignore
    
    @classmethod
    def list_fields(cls, data: Union[arcpy.FeatureSet, arcpy.RecordSet, str],
                    field_name: Optional[str]=None,
                    field_type: Optional[str]=None) -> List[arcpy.Field]:
        """Wrapper of arcpy's ListFields function.

        Args:
            data (Union[arcpy.FeatureSet, arcpy.RecordSet, str]): data to get fields from.
            field_name (Optional[str], optional): wild card of the field name to search from. Defaults to None.
            field_type (Optional[str], optional): wild card of the field type to search from. Defaults to None.

        Returns:
            List[arcpy.Field]: a list of fields.
        """
        return arcpy.ListFields(data, field_name, field_type)  # type: ignore

    @classmethod
    def describe(cls, data: Union[str, arcpy.FeatureSet, arcpy.RecordSet]) -> DescribeOutput:
        """Wrapper of arcpy's Describe function.

        Args:
            data (Union[str, arcpy.FeatureSet, arcpy.RecordSet]): data to describe.

        Returns:
            DescribeOutput: an instance of DescribeOutput.
        """
        return arcpy.Describe(data)  # type: ignore

    @classmethod
    def get_output_wkspc(cls, count: Optional[int]) -> Any:
        """Get the output workspace as either scratchGDB or in_memory workspace.

        Args:
            count: it can either be None or an integer/long with the total count of
            features/rows that will be involved in the analysis. If count is set to
            None, then the output wkspc is decided by the log level. Otherwise, the
            output wkspc is determined by the # of features.
        Returns:
            If count is None and current LOGGER level is debug, then return scracthGDB.
            If count is None and current LOGGER level is not debug, then return "in_memory".
            If count > 1000, then return scrathGDB. Otherwise return "in_memory".
        Raises:
            No exception.

        """
        if count is None and LOGGER.level == logging.DEBUG:
            return arcpy.env.scratchGDB  # type: ignore
        elif count is None:
            return "in_memory"
        elif count > 1000:
            return arcpy.env.scratchGDB  # type: ignore
        else:
            return "in_memory"

    @staticmethod
    def get_output_wkspcx(count: Optional[int]) -> str:
        """Get output workspace as either scratchGDB or memory workspace.

        Args:
            count (Optional[int]): total number of features to store in the workspace.

        Returns:
            str: arcpy.env.scratchGDB if count is not specified and tool run in debug environment or
            the total number of features to store is more than 1,000. Otherwise memory database is
            returned.
        """
        if count is None and LOGGER.level == logging.DEBUG:
            return arcpy.env.scratchGDB  # type: ignore
        elif count is None:
            return "memory"
        elif count > 1000:
            return arcpy.env.scratchGDB  # type: ignore
        else:
            return "memory"

    @staticmethod
    def get_scratch_wkspc(is_scratch_gdb: bool = True) -> str:
        if is_scratch_gdb:
            return arcpy.env.scratchGDB  # type: ignore
        else:
            return arcpy.env.scratchFolder  # type: ignore
    
    @staticmethod
    def get_wkspc_from_path(catalog_path: str) -> Workspace:
        """Get the workspace from a catalog path.

        Args:
            catalog_path (str): catalog path of a data.

        Raises:
            RuntimeError: If no workspace can be found.

        Returns:
            Workspace: an instance of Workspace.
        """
        if catalog_path.startswith("http://") or catalog_path.startswith("https://"):
            return Workspace.FSDB
        else:
            dir_path = os.path.dirname(catalog_path)
            if dir_path == "in_memory":
                return Workspace.InMemory
            elif dir_path == "memory":
                return Workspace.Memory
            elif ".gdb" in dir_path:
                return Workspace.FGDB
            elif ".sde" in dir_path:
                return Workspace.SDE
            else:
                LOGGER.debug(f"Unable to get workspace from the catalog path of {catalog_path}")
                raise RuntimeError

    @staticmethod
    def is_point_geometry(data: Any, is_desc: bool = True) -> bool:
        """Check if the data is in point gemetry (Point/MultiPoint)

        Args:
            data (Any): dataset or the description of the dataset.
            is_desc (bool): True if the data is output from arcpy.Describe
            and False otherwise.

        Returns:
            bool: True if the data is in point geometry and False otherwise.
        """
        if is_desc:
            return "point" in data.shapeType.lower()
        else:
            desc = AOLUtils.describe(data)
            if "point" in desc.shapeType.lower():
                return True
            return False
