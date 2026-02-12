"""Module provides functionality to read data in"""
# noqa. pylint: disable=import-error
# pylint: disable=logging-fstring-interpolation
import os
from abc import ABC, abstractmethod
from typing import Any, Union, Optional, Dict, List
from copy import deepcopy
import logging

import arcpy
from arcpy._mp import Layer as mp_layer  # noqa. pylint: disable=import-error

from .palog import LogUtils, ToolExit
from .paglobals import DEFAULT_LAYER_NAME, DEFAULT_DOWNLOADABLE_FEATCOUNT
from .aolutils import AOLUtils


LOGGER = LogUtils.setup_logger(__name__)

__all__ = ["PAData", "PAAnalysisData", "PALayer", "PAAnalysisDataReader",
           "ParameterDataReader", "LocalDataReader"]


class PAData:
    """Class module define the basic interface of spatial data used for portal analysis.

    Attributes
    ----------
        data : `Any`
            data to be wrapped as a property.
        data_type : `str`
            type of the data which is default to "". It is assigned when the data is actually
            unpacked/loaded.
        metadata : `Optional[Dict]`
            metadata of the data. Usually is dictionary with description on parameter type, name, etc.
        select_features_in_extent : `bool`
            True to explicitly select features of the data that fall within the context extent.
            False to use all the features.
        count : `Optional[int]`
            The total # of features within the context extent if select_features_in_extent is set to True.
            Otherwise count represents the total # of features of the data.
        description : `Any`
            Arcpy's Describe output using data as input.
        fields : `Optional[List]`
            A list of all the fields of the data.

    """

    def __init__(self, data: Any, metadata: Optional[Dict], select_features_in_extent: bool = True):
        """Initialize the attributes

        Args:
            data (Any): data to load into the object
            metadata (Optional[Dict]): a dictionary with metadata of the data (i.e.,
            {"parameterDataType": , "parameterName":})
            select_features_in_extent (bool, optional): True to explicitly select data by the context
            extent and False otherwise. Defaults to True.

        """
        self.data = data
        self.data_type = ""
        self.metadata = metadata
        self.select_features_in_extent = select_features_in_extent
        self._count = None
        self._description = None
        self._fields = []

    @property
    def count(self) -> int:
        """Return the count of features/rows of the data.

        Raises:
            ValueError: raised if data property is empty.

        Returns:
            int: if select_features_in_extent is True, count represents the number of
            features within the context extent. Otherwise, count represents the
            total number of features of the data.

        """
        if not self.data:
            LOGGER.debug("Unable to get the count from empty dataset.")
            return 0

        if self._count is None:
            self._count = AOLUtils.get_total_feature_count(self.data, self.select_features_in_extent)
        return self._count

    @count.setter
    def count(self, value: int):
        """Set the count property of the object

        Args:
            value (int): an integre represents the count to set.
        """
        self._count = value

    @property
    def description(self):
        """Get the description of the data property.

        Raises:
            ValueError: raised if data property is empty.

        Returns:
            arcpy.Describe(): output from arcpy.Describe(data).
        """
        if not self.data:
            LOGGER.error("Unable to get the description from empty dataset.")
            raise ValueError

        if self._description is None:
            self._description = arcpy.Describe(self.data)
        return self._description

    @description.setter
    def description(self, value: Any):
        """Set the description property of the object.

        Args:
            value (Any): output from arcpy.Describe(data)
        """
        self._description = value

    @property
    def fields(self) -> List:
        """Get the fields of the data.

        Returns:
            Optional[List]: a list of arcpy's Field objct if the data is not empty,
            otherwise, None is returned.
        """
        if not self._fields and self.data:
            self._fields = AOLUtils.list_fields(self.data)
        return self._fields  # type: ignore
    
    def contains_field_type(self, field_type: str) -> bool:
        """Check if the layer object contains the specified field type.

        Args:
            field_type (str): the field type to check against.

        Returns:
            bool: True if the layer contains field(s) with the type specified
            and False otherwise.
        """
        if not self.fields:
            LOGGER.debug("No fields found. Check if the layer has been initialized.")
            return False
        for fld in self.fields:
            if fld.type.lower() == field_type.lower():
                return True
        return False


class PAAnalysisData(PAData):
    """Child-class of PAData which defines the properties of the data that is used for analysis purpose.

    Attributes:
    -----------
        for_extract : `bool`
            True if the data is used for extraction purpose and False otherwise.
        max_download_feat_count : `Optional[int]`
            An integer indicating the limitation of downloading (or features fetched through feature service DB).
            If set to None, then there is no limitation on downloading.
        verify_feature_count : `bool`
            An error is raised if the total # of features fall within the context is zero and verify_feature_count
            is set to True.
        use_as_soap_input : `bool`
            True if the analysis data is used as soap input (passed into the soap request) and False otherwise.
        is_table_view : `Optional[bool]`
            True if the data is a table view (that does not contain any geometry) and False otherwise.
        is_hosted_data : `Optional[bool]`
            True if the data is hosted feature layer and False otherwise.
        esri_laal_catalogpath : `str`
            The path of the local copy ofthe LAAL. If "" means that either the input layer is not a LAAL or a
            local copy can't be found.
        url_json : `Optional[Dict]`
            A json showing the source of the data (i.e., {"url": "", "layerId": 0...}). It is None if the data is
            loaded from a none url source (i.e., local feature class).
        layer_name : `str`
            Name of the data. Used for error message labeling.

    Methods:
    --------
        get_data_source():
            Get the source of the data.
        load():
            Unpack the data and setup the properties accordingly.
        get_layer_url():
            Return the url of the feature layer if the url_json is not None. Otherwise return "".
        access_fslyr(`str`, `Optional[str]`, `Optional[Dict]`):
            Check if the feature service layer is accessible with the specified token and referer.
        validate_as_soap_input():
            If the data is used as input for SOAP and external token is needed to pass, make a local copy of the
            data and pass that to the soap instead.

    """
    def __init__(self,
                 data: Any,
                 metadata: Optional[Dict] = None,
                 for_extract: bool = False,
                 select_features_in_extent: bool = True,
                 max_download_feat_count: Optional[int] = DEFAULT_DOWNLOADABLE_FEATCOUNT,
                 verify_feature_count: bool = True):
        """Initialize the properties of the object.

        Args:
            data (Any): data to load into the object
            metadata (Optional[Dict], optional): a dictionary with metadata of the data (i.e.,
            {"parameterDataType": , "parameterName":, "optional":}). Defaults to None.
            for_extract (bool, optional): is the data to be used for extraction. Defaults to False.
            select_features_in_extent (bool, optional): True to explicitly select features from the
            data and False otherwise. Defaults to True.
            max_download_feat_count (Optional[int], optional): the limitation of total # of features to
            download. Defaults to DEFAULT_DOWNLOADABLE_FEATCOUNT.
            verify_feature_count (bool, optional): If the count property is 0 and this property is True,
            raise an error indicating that no features for analysis. Defaults to True.
        """
        if metadata is None or "source" not in metadata:
            if metadata is None:
                metadata = self.get_data_source()
            else:
                metadata.update(self.get_data_source())

        super(PAAnalysisData, self).__init__(data, metadata, select_features_in_extent)
        self.data_type = metadata.get("source")
        LOGGER.debug(f"data_type: {self.data_type}")

        self.for_extract = for_extract
        self.select_features_in_extent = select_features_in_extent
        self.max_download_feat_count = max_download_feat_count
        self.verify_feature_count = verify_feature_count

        # properties
        self.is_table_view = None  # type: Optional[bool]
        self.is_hosted_data = None  # type: Optional[bool]
        self.esri_laal_catalogpath = ""  # type: str
        self.url_json = None  # type: Optional[Dict]
        self.layer_name = ""  # type: str

    def get_data_source(self) -> Dict:
        """Initialize the metadata information.

        Raises:
            TypeError: If the data type is not supported, 'TypeError' will be thrown.

        Returns:
            Dict: A json with the data source information (i.e., {"source": "Layer"}). The source information can only be
            one of the following ["None", "ParameterIndex", "Layer", "FeatureSet", "RecordSet", "LayerName",
            "CatalogPath"].
        """
        source_type = ""
        if self.data is None:
            source_type = "None"
        elif isinstance(self.data, int):
            source_type = "ParameterIndex"
        elif isinstance(self.data, mp_layer):
            source_type = "Layer"
        elif isinstance(self.data, arcpy.FeatureSet):
            source_type = "FeatureSet"
        elif isinstance(self.data, arcpy.RecordSet):
            source_type = "RecordSet"
        elif isinstance(self.data, str):
            local_path_exists = os.path.exists(self.data) or os.path.exists(os.path.dirname(self.data))
            if (arcpy.Exists(self.data)
                and not local_path_exists
                and not self.data.startswith("in_memory")
                and not self.data.startswith("memory")
            ):
                source_type = "LayerName"
            else:
                # No need to check if the _data exists since it can be an output path which is going to be generated
                # later.
                source_type = "CatalogPath"
        else:
            LOGGER.error("Unable to get data type.")
            raise TypeError
        return {"source": source_type}

    def load(self):
        """Read data in and set the properties accordingly.

        Raises:
            AO_100032: if data is not empty and count of features is 0 while verify_feature_count
            is set to True.
        """
        if self.data is None:
            return
        elif self.metadata and self.metadata.get("source") == "ParameterIndex":
            ParameterDataReader(self).read()
        else:
            LocalDataReader(self).read()

        if self.layer_name == DEFAULT_LAYER_NAME and self.metadata and self.metadata.get("defaultLayerName"):
            self.layer_name = self.metadata.get("defaultLayerName")  # type: ignore
        elif self.layer_name == DEFAULT_LAYER_NAME and self.metadata and self.metadata.get("parameterName"):
            self.layer_name = self.metadata.get("parameterName")  # type: ignore

        # if self.data is None, that means this optional layer is empty. No need to check the feature count.
        if self.data is not None and self.count == 0 and self.verify_feature_count:
            LOGGER.error(100032, extra={"message_ID": 100032, "analysisLayer": self.layer_name})
            raise arcpy.ExecuteError

        # raise a warning if input featureSet data does not have spatial reference
        if self.data is not None and not self.is_table_view:
            sref = self._description.spatialReference  # type: ignore
            if (
                not hasattr(self._description, "spatialReference")
                or sref is None
                or sref.name == "Unknown"
            ):
                LOGGER.warning(100284, extra={"message_ID": 100284, "inputLayer": self.layer_name})
            LOGGER.debug(f"spatialReference: {sref.name}")

    def get_layer_url(self) -> Optional[str]:
        """Construct the url for the layer from the url_json property.

        Returns:
            Optional[str]: the url of the feature layer. If the data is not loaded
            from a URL (url_json is None), return None.
        """
        if self.url_json is None:
            return None
        lyr_url = self.url_json.get("url", "")  # type: ignore
        lyr_id = self.url_json.get("layerId", "")  # type: ignore
        return f"{lyr_url}/{lyr_id}"


class PASoapInputMixin:
    """Mixin class supports data load in as SOAP input. For data used for SOAP input, it is needed to check if the
    data loaded from an external feature service layer contains a token generated outside of server scope. If yes,
    the data need to be copied locally before passing to the remote SOAP service."""

    def __init__(self, use_as_soap_input: bool = False, remote_server_version: Optional[float] = None):
        """Initialize the property.

        Args:
            use_as_soap_input (bool, optional): True if the data loaded will be used
            as SOAP service input and False otherwise. Defaults to False.
        """
        self.use_as_soap_input = use_as_soap_input
        self.remote_server_version = remote_server_version

    def load(self):
        """Load the data. This function explicitly calls the load function of PAAnalysisData."""
        super().load()  # type: ignore
        if self.use_as_soap_input:
            self.validate_as_soap_input()

    def access_fslyr(self, lyr_url: str, token: Optional[str] = None, referer: Optional[Dict] = None) -> bool:
        """Check if an url represents the feature layer is accessible.

        Args:
            lyr_url (str): URL of a feature layer.
            token (Optional[str], optional): token used to access the feature layer URL. Defaults to None.
            referer (Optional[Dict], optional): referer used to access the feature layer URL. Defaults to None.

        Returns:
            bool: True if the feature service layer is accessible with the configuration and False otherwise.
        """
        if token:
            params = {"token": token, "f": "json"}
        else:
            params = {"f": "json"}

        headers = {"referer": referer} if referer else {}
        try:
            response_json = AOLUtils.mk_get_request(lyr_url, params=params,
                                                    headers=headers)
            if "error" in response_json:
                error_message = response_json["error"].get("message")
                LOGGER.debug(f"Failed in accessing {lyr_url} due to {error_message}.")
                return False
            return True
        except (ValueError, KeyError, ToolExit) as err:
            LOGGER.debug(f"Failed in accessing {lyr_url} because {str(err)}.")
            return False

    def validate_as_soap_input(self):
        """Validate if a hostedgp layer object is usable as an input for remote SOAP service."""
        if self.esri_laal_catalogpath.strip():  # type: ignore
            return

        if self.data:
            if not self.is_hosted_data and self.url_json:
                if self.access_fslyr(self.get_layer_url()):
                    return
                else:
                    sign_in_token = arcpy.GetSigninToken()
                    if self.access_fslyr(self.get_layer_url(), sign_in_token["token"], sign_in_token["referer"]):  # type: ignore
                        return
                    else:
                        local_data = AOLUtils.create_unique_name("local_data_for_soap", "scratchgdb")
                        LOGGER.debug(f"local_data: {local_data}")
                        arcpy.management.CopyFeatures(self.data, local_data)  # type: ignore
                        if self.is_table_view:
                            self.data = arcpy.RecordSet(local_data)
                        else:
                            self.data = arcpy.FeatureSet(local_data)
                        self.url_json = None
            if self.remote_server_version and self.remote_server_version < 11.2:
                fields = arcpy.ListFields(self.data)
                for fld in fields:  # type: ignore
                    if fld.type in ["BigInteger", "DateOnly", "TimeOnly", "TimestampOffset"]:
                        LOGGER.error(100357, extra={"message_ID": 100357})
                        raise ToolExit
                if not self.is_table_view:
                    lyr_desc = arcpy.Describe(self.layer)
                    if hasattr(lyr_desc, "hasOID64") and getattr(lyr_desc, "hasOID64"):
                        LOGGER.error(100357, extra={"message_ID": 100357})
                        raise ToolExit


class PALayer(PAData):
    """Class module define the interface for PALayer

    Attributes
    ----------
        layer : `str`
            The name of the layer instance wrapped from the data.

    Methods
    -------
        init_layer_name(`str`):
            Initialize the name of the layer instance.
        make_layer_from_data():
            Create an instance of arcpy._mp.Layer from the data.

    """
    def __init__(self,
                 data: Any,
                 metadata: Optional[Dict] = None,
                 select_features_in_extent: bool = True):
        """Initalize the properties.

        Args:
            data (Any): data to load into the object
            metadata (Optional[Dict]): a dictionary with metadata of the data (i.e.,
            {"parameterDataType": , "parameterName":})
            select_features_in_extent (bool, optional): True to explicitly select data by the context
            extent and False otherwise. Defaults to True.
        """
        super(PALayer, self).__init__(data, metadata, select_features_in_extent)
        if metadata:
            self.data_type = metadata.get("source")
        else:
            self.data_type = None
        self._layer = None

    @property
    def layer(self) -> str:
        """Get the layer property of the PALayer object.

        Raises:
            ValueError: raised if data is None.

        Returns:
            str: name of arcpy's _mp.layer object.
        """
        if self.data is None:
            LOGGER.error("Unable to create layer from empty data.")
            raise ValueError

        if self._layer is None:
            if self.data_type == "LayerName":
                self._layer = self.data
            else:
                self.make_layer_from_data()

        if self._layer is not None and self.select_features_in_extent and arcpy.env.extent:  # type: ignore
            AOLUtils.select_features_in_extent(self._layer)

        return self._layer  # type: ignore

    def init_layer_name(self, prefix: str = "layer") -> str:
        """Generate a unique layer name for the layer property.

        Args:
            prefix (str, optional): prefix of the layer name (default is layer). Defaults to "layer".

        Returns:
            str: layer name that is usable.
        """
        i = 0
        lyr_name = f"{prefix}{i}"
        while arcpy.Exists(lyr_name):
            i += 1
            lyr_name = f"{prefix}{i}"
        return lyr_name

    def make_layer_from_data(self) -> mp_layer:
        """Create a mp_layer instance from the data property.

        Raises:
            ValueError: If the data property is None.
            TypeError: If the data_type property is RecordSet.
            TypeError: If the data_type is not supported.

        Returns:
            mp_layer: An instance of arcpy._mp.Layer created from the data property.
        """
        if self.data is None:
            LOGGER.error("Unable to create layer instance from empty data.")
            raise ValueError
        elif self.data_type == "RecordSet":
            LOGGER.error("Unable to create a layer instance from RecordSet.")
            raise TypeError
        elif self.data_type in ["CatalogPath", "FeatureSet"]:
            tmp_layer = arcpy.management.MakeFeatureLayer(self.data, self.init_layer_name()).getOutput(0)  # type: ignore
            self._layer = tmp_layer.name
            return tmp_layer
        elif self.data_type == "LayerName":
            tmp_layer = arcpy.management.MakeFeatureLayer(self.data, self.init_layer_name()).getOutput(0)  # type: ignore
            return tmp_layer
        elif self.data_type == "Layer":
            self._layer = self.data.name  # type: ignore
            return self.data
        else:
            LOGGER.error("Unsupported data type.")
            raise TypeError


class PAAnalysisDataReader(ABC):
    """Class module in charge of reading the data and setup the properties accordingly.

    Attributes
    ----------
        pa_data : `PAAnalysisData`
            Initially created PAAnalysisData instance from which the data needs to be read and the properties
            need to be set.

    Methods
    -------
        read():
            Read the raw data in.
        assign_data_from_json(`Dict`, `Union[arcpy.FeatureSet, arcpy.RecordSet]`):
            Unpack the data from the source (URL, catalogPath) and assign it to the specified output.
        convert_rs_to_fs:
            Convert the data from arcpy.RecordSet to arcpy.FeatureSet if the data has geometry information. The
            reason for this is some of the tools has input that can either be a table view or a feature class.
            This function will convert the data loaded originally to the FeatureSet so all the downstream spatial
            analysis can be performed.

    """

    def __init__(self, data: PAAnalysisData):
        """Initialize the properties.

        Args:
            data (PAAnalysisData): an instance of PAAnalysisData to unpack/load.
        """
        self.pa_data = data

    @abstractmethod
    def _read(self):
        raise NotImplementedError

    def read(self):
        """Read the data in."""
        self._read()
        if self.pa_data.data and self.pa_data.count is None:
            self.pa_data.count = AOLUtils.get_total_feature_count(self.pa_data.data,  # type: ignore
                                                                  self.pa_data.select_features_in_extent)

        if self.pa_data.data is not None and LOGGER.level == logging.DEBUG:
            parameter_name = ""
            if self.pa_data.metadata:
                parameter_name = self.pa_data.metadata.get("parameterName", "")
            shape_type = self.pa_data._description.shapeType if hasattr(self.pa_data.description, "shapeType") else ""  # type: ignore
            LOGGER.debug(f"{parameter_name},{self.pa_data.layer_name},{shape_type},{self.pa_data.count}")

    def assign_data_from_json(self, input_json: Dict, data_object: Union[arcpy.FeatureSet, arcpy.RecordSet]):
        """Read data from a json with configuration information of a feature layer.

        Args:
            input_json (Dict): a json output from arcpy.RecordSet.geturl() (i.e., {"url": "", "layerId": "", "token": ""...}),
            the input_json can also be a json tweaked from url_json but with catalogpath (i.e., {"catalogpath": "",
            "filter": "", "time": ""}).
            data_object (Union[arcpy.FeatureSet, arcpy.RecordSet]): an instance of either arcpy.FeatureSet or arcpy.RecordSet.

        Raises:
            ValueError: if input_json does not have a key of "url" or "catalogpath".
            RuntimeError: if failed to load the input_json.
        """
        if "url" in input_json:
            lyr_url = "{}/{}".format(input_json["url"], input_json["layerId"])
            lyr_json = {"url": lyr_url}
            if "token" in input_json:
                lyr_json["token"] = input_json["token"]

            if "referer" in input_json:
                lyr_json["referer"] = input_json["referer"]
        elif "catalogpath" in input_json:
            lyr_json = input_json["catalogpath"]
        else:
            LOGGER.error(f"Invalid json to read: {input_json}.")
            raise ValueError

        filter = input_json.get("filter")
        timefilter = input_json.get("time")

        try:
            data_object.load(lyr_json, filter, timefilter)
        except arcpy.ExecuteError as err:
            LOGGER.error("Unable to parse the url_json.")
            raise RuntimeError from err

    def convert_rs_to_fs(self):
        """Convert data with recordSet type to a featureset if recordSet is created from a feature class."""
        if (
            hasattr(self.pa_data.data, "_arc_object")
            and hasattr(self.pa_data.data._arc_object, "istable")
        ):
            self.pa_data.is_table_view = self.pa_data.data._arc_object.istable
        else:
            desc = arcpy.Describe(self.pa_data.data)
            if hasattr(desc, "featureType"):
                self.pa_data.is_table_view = False
            else:
                self.pa_data.is_table_view = True
        if hasattr(self.pa_data._description, "name"):
            self.pa_data.layer_name = self.pa_data._description.name.strip()  # type: ignore
        else:
            self.pa_data.layer_name = "record_set"
        if not self.pa_data.is_table_view:
            self.pa_data.data_type = "FeatureSet"
            if self.pa_data.layer_name == "record_set":
                self.pa_data.layer_name = DEFAULT_LAYER_NAME
            if self.pa_data.url_json is None:
                try:
                    self.pa_data.url_json = self.pa_data.data._arc_object.geturl(self.pa_data.for_extract)
                except AttributeError:
                    LOGGER.debug(f"{type(self.pa_data.data)} does not have the geturl function.")

            if self.pa_data.url_json:
                self.pa_data.data = arcpy.FeatureSet()
                self.assign_data_from_json(self.pa_data.url_json, self.pa_data.data)
            else:
                # a feature collection.
                tmp_description = arcpy.Describe(self.pa_data.data)
                catalog_path = tmp_description.CatalogPath  # type: ignore
                self.pa_data.data = arcpy.FeatureSet()
                self.pa_data.data.load(catalog_path)
            # Point the description to the featureSet
            self.pa_data._description = arcpy.Describe(self.pa_data.data)
        else:
            self.pa_data.data_type = "RecordSet"


class ParameterDataReader(PAAnalysisDataReader):
    """Class to read data from toolbox parameter (i.e., through arcpy.GetParameter).

    Methods:
        verify_download_limitation():
            Check if the data that needs to be downloaded or fetched through feature service DB exceeds the download
            limitation.
        check_is_laal():
            Check if the data is a living atlas analysis layer. If yes, replace the loaded data with the local copy.
        _read():
            Overwrite the abstractmethod to read the data.

    """

    def verify_download_limitation(self):
        """check if the download limitation is met.

        Raises:
            GPEXT_018: if the feature to download exceeds the download limitation.
        """
        if self.pa_data.data is not None:
            if self.pa_data.esri_laal_catalogpath.strip() and arcpy.Exists(self.pa_data.esri_laal_catalogpath):
                self.max_download_featcount = None
            LOGGER.debug(f"max_download_featcount: {self.pa_data.max_download_feat_count}")
            LOGGER.debug(f"count: {self.pa_data.count}")
            # Check the download limitation before select features in extent since the extent
            # is honored when triggering the call to feature layer.
            if (not self.pa_data.is_hosted_data and self.pa_data.url_json):
                LOGGER.debug("About to compare the ")
                if self.pa_data.max_download_feat_count and self.pa_data.count > self.pa_data.max_download_feat_count:  # type: ignore
                    LOGGER.error("018", extra={"message_ID": "018",
                                               "url": self.pa_data.get_layer_url()})
                    raise arcpy.ExecuteError

    def check_is_laal(self):
        """Check if the data is loaded from a living atlas analysis layer. If that is the case,
        use the local feature class instead of downloading the data."""
        if self.pa_data.data is not None and self.pa_data.esri_laal_catalogpath.strip():
            # replace the data with the local feature class
            if arcpy.Exists(self.pa_data.esri_laal_catalogpath):
                tmp_json = deepcopy(self.pa_data.url_json)
                if "url" in tmp_json:  # type: ignore
                    if self.pa_data.is_table_view:
                        self.pa_data.data = arcpy.RecordSet()
                        self.pa_data.data_type = "RecordSet"
                    else:
                        self.pa_data.data = arcpy.FeatureSet()
                        self.pa_data.data_type = "FeatureSet"
                    tmp_json.pop("url")  # type: ignore
                    if tmp_json:
                        tmp_json["catalogpath"] = self.pa_data.esri_laal_catalogpath
                    self.assign_data_from_json(tmp_json, self.pa_data.data)  # type: ignore
                    # Update the description
                    self.pa_data.description = arcpy.Describe(self.pa_data.data)
                    self.pa_data.max_download_feat_count = None

            # Log the esri layer usage
            param_name = self.pa_data.metadata.get("parameterName", "")
            msg = "paramName: {} : LAAL: {}".format(param_name, self.pa_data.esri_laal_catalogpath)
            arcpy.gp._arc_object.LogUsageMetering(7777, msg, self.pa_data.count, 0)

    def _read(self):
        """Load data derived from parameter."""
        param_data_type = ""
        if self.pa_data.metadata:
            param_data_type = self.pa_data.metadata.get("parameterDataType", "")
            param_name = self.pa_data.metadata.get("parameterName", "")
            param_type = self.pa_data.metadata.get("parameterType", "")
            # get parameterDataType, parameterType and parameterName through GetParameterInfo
            if isinstance(self.pa_data.data, int) and (not param_data_type or not param_name):
                data_index = self.pa_data.data
                params = arcpy.GetParameterInfo()
                param_data_type = params[data_index].datatype  # type: ignore
                param_name = params[data_index].name  # type: ignore
                param_type = params[data_index].parameterType  # type: ignore
                self.pa_data.metadata.update({"parameterDataType": param_data_type})
                self.pa_data.metadata.update({"parameterName": param_name})
                self.pa_data.metadata.update({"parameterType": param_type})

        # Even though the source is ParameterIndex, self.data can be non-integer for the case that the data
        # is loaded from a parameter with multivalue set to True.
        if isinstance(self.pa_data.data, int):
            data_index = self.pa_data.data
            if self.pa_data.metadata and self.pa_data.metadata.get("parameterType") == "Optional":
                if arcpy.GetParameterAsText(data_index):
                    self.pa_data.data = arcpy.GetParameter(data_index)
                else:
                    self.pa_data.data = None
            else:
                self.pa_data.data = arcpy.GetParameter(data_index)

        if self.pa_data.data:
            try:
                self.pa_data.is_table_view = self.pa_data.data._arc_object.istable  # type: ignore
                self.pa_data.is_hosted_data = self.pa_data.data._arc_object.ishosted  # type: ignore
                self.pa_data.esri_laal_catalogpath = self.pa_data.data._arc_object.esrilaalcatalogpath  # type: ignore
                self.pa_data.url_json = self.pa_data.data._arc_object.geturl(self.pa_data.for_extract)  # type: ignore
            except (AttributeError, RuntimeError):
                desc = arcpy.Describe(self.pa_data.data)
                self.pa_data.is_table_view = not hasattr(desc, "featureType")
                self.pa_data.is_hosted_data = False
                self.pa_data.esri_laal_catalogpath = ""
                self.pa_data.url_json = None
            self.pa_data.count = AOLUtils.get_total_feature_count(self.pa_data.data,
                                                                  self.pa_data.select_features_in_extent)
            LOGGER.debug(f"esri_laal_catalogpath: {self.pa_data.esri_laal_catalogpath}")

            if hasattr(self.pa_data.description, "name"):
                self.pa_data.layer_name = self.pa_data.description.name.strip()  # type: ignore

            if param_data_type == "Feature Set":
                self.pa_data.data_type = "FeatureSet"

                if self.pa_data.layer_name is None or self.pa_data.layer_name.startswith("feature_set"):
                    self.pa_data.layer_name = DEFAULT_LAYER_NAME

            elif param_data_type == "Record Set":
                self.convert_rs_to_fs()

            else:
                LOGGER.error(f"Unsupported parameter type of {param_data_type}.")
                raise ValueError

        self.check_is_laal()
        self.verify_download_limitation()


class LocalDataReader(PAAnalysisDataReader):
    """Load the data from a local source (i.e., catalogpath).

    Methods
    -------
        _read():
            Overwrite the abstrcatmethod to read data from local source.

    """

    def _read(self):
        """Load data derived from parameter."""
        self.pa_data.is_hosted_data = False

        if self.pa_data.data is None:
            self.pa_data.layer_name = ""
        else:
            if self.pa_data.data_type in ["FeatureSet", "RecordSet"]:
                try:
                    if (hasattr(self.pa_data.data, "_arc_object") and hasattr(self.pa_data.data._arc_object, "esrilaalcatalogpath")):
                        self.pa_data.esri_laal_catalogpath = self.pa_data.data._arc_object.esrilaalcatalogpath
                except RuntimeError:
                    self.pa_data.esri_laal_catalogpath = ""

            if self.pa_data.data_type in ["Layer", "LayerName", "FeatureSet", "CatalogPath"]:
                self.pa_data.layer_name = DEFAULT_LAYER_NAME
                self.pa_data.description = arcpy.Describe(self.pa_data.data)
                if self.pa_data.data_type == "CatalogPath":
                    if not hasattr(self.pa_data.description, "shapeType"):
                        self.pa_data.is_table_view = True
                    else:
                        self.pa_data.is_table_view = False
                else:
                    self.pa_data.is_table_view = False

            elif self.pa_data.data_type == "RecordSet":
                self.is_table_view = self.pa_data.data._arc_object.istable
                self.convert_rs_to_fs()
                self.pa_data.description = arcpy.Describe(self.pa_data.data)
