"""Module provide functionalities globally available."""
# Use format for messaging. pylint: disable=W1202
# Use internal function of arcpy. pylint: disable=protected-access
# Custom exception. pylint: disable=unnecessary-pass
# Initialize attributes outside of constructor. pylint: disable=attribute-defined-outside-init
# Use attribute derived from description. pylint: disable=no-member
# pylint: disable=logging-fstring-interpolation
import os
import json
from enum import Enum

from typing import Optional, Any, Union, List, Dict

import arcpy
from arcpy._mp import Layer as mp_layer  # noqa. pylint: disable=import-error

from .popup import PopupInfo
from .palog import LogUtils, ToolExit, GPMessageHandler
from .padata import PASoapInputMixin, PAAnalysisData, PALayer
from .aolutils import AOLUtils
from .paremoteutils import PortalUtils
from .paglobals import DEFAULT_DOWNLOADABLE_FEATCOUNT


SPATIALDATATYPE = Optional[Union[str, int, arcpy.FeatureSet, arcpy.RecordSet, mp_layer]]
LYRCOLLECTION = Union[int, List]  # defined input datatype for PAFeatureLayerColl.

LOGGER = LogUtils.setup_logger(__name__)

__all__ = ["PAOutputName", "PAContext",
           "PALayer", "PAFeatureLayer", "PAOutputFeatureLayer",
           "PAFeatureLayerCollection", "PAEnvironment"]


class PAContext:
    """Class module to carry over the context properties. This is to make the tool backward
    compatible with the original REST API.

    Attributes
    ----------
        context : `dict`
            A json with the context information.

    Examples
    --------
    >>> context = PAContext(5)

    """

    def __init__(self, index: int):
        """Load in the content of the context."""
        context_text = arcpy.GetParameterAsText(index)
        self.context = None

        if context_text:
            try:
                self.context = json.loads(context_text)  # type: ignore
            except ValueError:
                LOGGER.debug("Invalid context information.")
                return

            if "extent" in self.context:
                try:
                    arcpy.env.extent = AOLUtils.create_extent_from_json(self.context.get("extent"))  # type: ignore
                    arcpy.env.extent = AOLUtils.validate_extent(arcpy.env.extent)  # type: ignore
                    LOGGER.debug("extent has been validated.")
                    LOGGER.debug(f"arcpy.env.extent: {arcpy.env.extent}")  # type: ignore
                except RuntimeError as err:
                    LOGGER.error(110348, extra={"message_ID": 110348})
                    raise err
                except Exception as err:
                    LOGGER.error(110349, extra={"message_ID": 110349})
                    raise err

            if "outSR" in self.context:
                try:
                    arcpy.env.outputCoordinateSystem = AOLUtils.get_sr_from_json(self.context["outSR"])  # type: ignore
                    LOGGER.debug("outputCoordinateSystem has been initialized.")
                except Exception as err:
                    LOGGER.error(110350, extra={"message_ID": 110350})
                    raise err


class PAEnvironment(Enum):
    """An Enum class module for the running environment of the tool."""
    ENTERPRISE = 1
    ONLINE = 2
    CUSTOM = 4
    MODELBUILDER = 5


class PAOutputName:
    """Class module to load the output properties.

    Attributes
    ----------
        create_service : `bool`
            True if the a feature service needs to be created and False otherwise.
        service_name : `str`
            Name of the output feature service.
        json : `dict`
            A json represents description of the output.
        output_cost : `int`
            2 if a feature service needs to be created and 1 otherwise.
        environment : `PAEnvironment`
            environment where the output is going to be published to.

    Examples
    --------
    >>> output = PAOutputName(4)

    """
    INVAL_CHARS = {
        PAEnvironment.ENTERPRISE: ['.', '$', '<', '>', '^', ':', '{' '}', '[', ']'],
        PAEnvironment.ONLINE: ['<', '>', ':'],
        PAEnvironment.MODELBUILDER: ['[', ']', '(', ')', '-', '<', '>', '#', '%',
                                     ':', ';', '"', '?', '&', '+', '=', '|', '/',
                                     ' ', '*', '@']
    }

    SUPPORT_OVERWRITE_ITEMTYPE = ["Feature Service"]
    
    def contain_invalid_char(self) -> bool:
        """Check if the service_name contains invalid character.

        Returns:
            bool: True if the service_name contains invalid char(s) and False otherwise.
        """
        invalid_chars = self.INVAL_CHARS.get(self.environment)
        if invalid_chars and self.service_name:
            for char in invalid_chars:
                if char in self.service_name:
                    return True
        return False
    
    def _init_service(self):
        """initialize an empty feature service.

        Raises:
            RuntimeError: if failed to initialie such a feature service.
        """
        folder_id = self.json.get("itemProperties", {}).get("folderId")
        description = self.json.get("itemProperties", {}).get("description")
        snippet = self.json.get("itemProperties", {}).get("snippet")
        resp = PortalUtils.create_service(self.service_name,
                                          description=description,
                                          snippet=snippet,
                                          folder_id=folder_id)
        if resp and resp.get("serviceurl") and resp.get("itemId"):
            self.json["serviceProperties"]["serviceUrl"] = resp["serviceurl"]
            if "itemProperties" in self.json:
                self.json["itemProperties"]["itemId"] = resp["itemId"]
            else:
                self.json["itemProperties"] = {"itemId": resp["itemId"]}
            self.created_item_id = resp["itemId"]
            LOGGER.debug(f"Server create empty feature service via: {self.json}")
            self.item_created_by_server = True
            # update the created item
            item_props = ["description", "snippet", "title"]
            update_param = {}
            for iprop in item_props:
                if iprop in self.json["itemProperties"]:
                    update_param[iprop] = self.json["itemProperties"][iprop]

            PortalUtils.update_portal_item(resp["itemId"], update_param)
            LOGGER.debug("Item has been updated.")
            # newly created item no need to overwrite
            if self.json.get("itemProperties", {}).get("overwrite"):
                LOGGER.debug("New item created so no need to overwrite.")
                self.json["itemProperties"]["overwrite"] = False
        else:
            self.log_error(110342, {"serviceName": self.service_name})

    def _get_itemid_from_url(self, url: str) -> str:
        """Get itemId from a service URL.

        Args:
            url (str): URL of a feature service.

        Raises:
            ToolExit: failed in finding the itemid
        """
        try:
            fs_resp = PortalUtils.get_url_resp_json(url)
            if not fs_resp.get("serviceItemId"):
                LOGGER.debug(f"Unable to get serviceItemId from {fs_resp}")
                raise ToolExit
            LOGGER.debug(f"{fs_resp['serviceItemId']=}")
            return fs_resp["serviceItemId"]
        except ToolExit:
            self.log_error(100373, {"url": url})

    def _check_input(self):
        if "serviceProperties" in self.json:
            if "name" in self.json["serviceProperties"]:
                self.service_name = self.json["serviceProperties"]["name"]
                self.create_service = True

            if (
                "serviceUrl" not in self.json["serviceProperties"]
                and self.service_name
            ):
                # Check if the service name is usable.
                if self.contain_invalid_char():
                    self.log_error(100375)
                (name_usable, item_id) = PortalUtils.is_service_name_available(self.service_name)
                if item_id:
                    self.log_error(100372)
                if not name_usable:
                    self.log_error(100292)
                if not self.validate_only:
                    self._init_service()
            elif "serviceUrl" in self.json["serviceProperties"] and not self.service_name:
                self.log_error(100374)

    def _check_overwrite_input(self):
        item_id = self.json.get("itemProperties", {}).get("itemId")
        item_url = self.json.get("serviceProperties", {}).get("serviceUrl")
        self.service_name = self.json.get("serviceProperties", {}).get("name", "")
        if self.service_name:
            self.create_service = True
        existing_item_to_ow = True
        if (not item_id and item_url):
            item_id = self._get_itemid_from_url(item_url)
        elif (not item_id and self.service_name):
            (name_usable, item_id) = PortalUtils.is_service_name_available(self.service_name)
            if not item_id and name_usable:
                if not self.validate_only:
                    self._init_service()
                    item_id = self.json["itemProperties"]["itemId"]
                existing_item_to_ow = False
            elif not item_id and not name_usable:
                self.log_error(100314)

        if not item_id and existing_item_to_ow:
            self.log_error(100317)

        if item_id:
            self.json["itemProperties"]["itemId"] = item_id

        if existing_item_to_ow:
            try:
                # item_info should look like the json below if the fuction succeeds.
                # {"title": "cb_test_901", "url": "https://", "type": "Feature Service",
                #  "spatialReference": 102100}
                self.overwrite_item_info: Dict = arcpy.gp.isitemoverwriteable(item_id)
                LOGGER.debug(f"item_info: {self.overwrite_item_info}")
                if self.overwrite_item_info.get("type") not in self.SUPPORT_OVERWRITE_ITEMTYPE:
                    self.log_error(100315)

                if self.overwrite_item_info.get("url"):
                    # check if this FS contains dependent view
                    fs_resp = PortalUtils.get_url_resp_json(self.overwrite_item_info["url"])
                    if fs_resp.get("hasViews"):
                        self.log_error(100327)
                    # replace the wkt name by the wkt string
                    wkt = fs_resp.get("spatialReference", {}).get("wkt")
                    if wkt:
                        self.overwrite_item_info["spatialReference"] = wkt
                    service_prop = {"name": self.overwrite_item_info.get("title", ""),
                                    "serviceUrl": self.overwrite_item_info["url"]}
                    self.service_name = self.overwrite_item_info.get("title", "")
                    self.create_service = True
                    if self.json.get("serviceProperties") is None:
                        self.json["serviceProperties"] = service_prop
                    else:
                        if (
                            self.json["serviceProperties"].get("name")
                            and self.json["serviceProperties"]["name"].lower() != service_prop["name"].lower()
                        ):
                            LOGGER.warning(100316, extra={"message_ID": 100316})
                        self.json["serviceProperties"].update(service_prop)
                else:
                    self.log_error(100313)

            except RuntimeError as err:
                if "Item does not exist" in str(err):
                    err_code = 100313
                elif "Item is not a hosted feature service" in str(err):
                    err_code = 100315
                else:
                    err_code = 100314
                self.log_error(err_code)

    def __init__(self, name_val: Union[int, Dict], environment: Optional[PAEnvironment] = None,
                 validate_only: bool = False):
        """initialize an instance of PAOutputName.

        Args:
            name_val (Union[int, Dict]): the index of the outputName parameter in the
            script tool if it is an integer. Otherwise it represents the content of the
            outputName parameter.
            environment (Optional[PAEnvironment], optional): specify the running environment.
            Defaults to None.
            validate_only (bool, optional): True if this is used in MB validating and
            False otherwise. Defaults to False.

        Raises:
            ToolExit: if any unexpected error happen in initializing.
        """
        from .paremoteutils import PortalUtils
        self.validate_only = validate_only
        if isinstance(name_val, int):
            output_text = arcpy.GetParameterAsText(name_val)
            if not output_text.strip():  # type: ignore
                self.json = {}
            else:
                self.json = json.loads(output_text)  # type: ignore
            # environment is either ENTERPRISE or ONLINE
            if environment is None:
                self.environment = PAEnvironment.ENTERPRISE if PortalUtils.is_portal_env() else PAEnvironment.ONLINE
            else:
                self.environment = environment
        elif isinstance(name_val, dict):
            self.json = name_val
            # If the PAOutputName is set through a dict (RasterAnalysis tools), default to CUSTOM.
            if environment:
                self.environment = environment
            else:
                self.environment = PAEnvironment.CUSTOM
        else:
            LOGGER.debug("Unsupported value to construct PAOutputName.")
            raise ToolExit
        self.create_service = False
        self.service_name = ""
        # overwrite configuration
        self.overwrite_item_info = None  # type: Optional[Dict]
        # properties of analysis studio
        self.created_item_id: Optional[str] = None
        # True if the output item is created by server and False means by client
        self.item_created_by_server = False
        # return a featureCollection if output_text is empty.
        LOGGER.debug(f"output_name.json: {self.json}")

        if self.json:
            self.overwrite = self.json.get("itemProperties", {}).get("overwrite")
            if not self.overwrite:
                self._check_input()
            else:
                self._check_overwrite_input()

    @property
    def output_cost(self) -> int:
        """Get the cost used for usage log.

        Returns:
            2 if a feature service needs to be created and 1 otherwise.

        """
        return 2 if self.create_service else 1
    
    def log_error(self, err_code: int, err_params: Optional[Dict] = None):
        """Properly log the error.

        Args:
            err_code (int): error code of the message.
            err_params (Optional[Dict], optional): parameters for the error message.
            Defaults to None.

        Raises:
            ToolExit: after setting the error.
        """
        if self.validate_only:
            if err_params:
                raise ToolExit(GPMessageHandler().get_msg(err_code, None, **err_params))
            else:
                raise ToolExit(GPMessageHandler().get_msg(err_code, None))
        else:
            msg_extra = {"message_ID": err_code}
            if err_params:
                msg_extra.update(err_params)
            LOGGER.error(err_code, extra=msg_extra)
            raise ToolExit


class PAFeatureLayer(PASoapInputMixin, PAAnalysisData, PALayer):
    """Create a PAFeatureLayer object used for analysis.

    Attributes
    ----------
        catalogPath : `str`
            CatalogPath of the data. If description does not have such a property, return "".
        FIDSet : `str`
            FIDSet of the layer property.
        Additionally includes all attributes as properties which are valid for the data
        property (FeatureSet or RecordSet).

    Methods
    -------
        __repr__():
            Return parameterName if metadata contains that information. Otherwise return the layer_name or str(data)
            if layer_name is "".
        __bool__():
            True if the data property is not None and False otherwise.
        __getattr__():
            Overwrite the meta function so to grab attributes from description property if it is not in __dict__.

    """
    def __init__(self,
                 data: Any,
                 metadata: Optional[Dict] = None,
                 for_extract: bool = False,
                 select_features_in_extent: bool = True,
                 max_download_feature_count: Optional[int] = DEFAULT_DOWNLOADABLE_FEATCOUNT,
                 verify_feature_count: bool = True,
                 use_as_soap_input: bool = False,
                 remote_server_version: Optional[float] = None):
        """Initialize the properties of the object

        Args:
            data (Any): raw data to wrap for analysis
            metadata (Optional[Dict], optional): metadata of the raw data. Defaults to None.
            for_extract (bool, optional): True if the data is used for ExtractData and False otherwise. Defaults
            to False.
            select_features_in_extent (bool, optional): True to explicitly select features within the context extent
            and false otherwise. Defaults to True.
            max_download_feature_count (Optional[int], optional): limitation on feature download (or fetch through
            feature server DB). Defaults to DEFAULT_DOWNLOADABLE_FEATCOUNT. If max_download_feature_count is set to
            None, then no check will be performed against the input.
            verify_feature_count (bool, optional): an error is raised if this property is True and the count property
            of the object is 0. Defaults to True.
            use_as_soap_input (bool, optional): True if the data is going to be passed into a SOAP service as input.
            Defaults to False.
        """
        PALayer.__init__(self, data, metadata, select_features_in_extent)
        PAAnalysisData.__init__(self, data, metadata, for_extract,
                                select_features_in_extent,
                                max_download_feature_count,
                                verify_feature_count)
        PASoapInputMixin.__init__(self, use_as_soap_input, remote_server_version)
        self.load()
        # Purposefully call this to update the initial selection of the layer.
        if self.data and not self.is_table_view and select_features_in_extent:
            LOGGER.debug(f"layer: {self.layer}")
            # desc = arcpy.Describe(self.layer)
            # if hasattr(desc, "catalogPath"):
            #     LOGGER.debug(f"catalogPath of {self.layer} is {desc.catalogPath}")  # type: ignore

    def __repr__(self):
        """Customize __repr__ method so either the parameterName or layer_name is used
        (if parameterName is not available)."""
        if self.metadata:
            return self.metadata.get("parameterName", self.layer_name)
        else:
            return self.layer_name if self.layer_name else str(self.data)

    def __bool__(self) -> bool:
        """Check if the data property is empty.

        Returns:
            bool: True if the data is not empty and False otherwise.
        """
        if self.data is None:
            return False
        return True

    def __getattr__(self, name: str):
        """Overwrite the __getattr__ metamethod to use the property from the object. If the object contains the
        property specified, return the property as it is. Otherwise, get the property from self._description."""
        if name in self.__dict__:
            return self.__dict__[name]
        elif self.description and hasattr(self.description, name):
            return getattr(self.description, name)
        # data loaded from feature collection does not have the catalogPath property, default to "" instead of
        # raising an error
        elif name == "catalogPath":
            LOGGER.debug("description does not have catalogPath.")
            return ""
        # redirect the FIDSet to the description on the layer
        elif name == "FIDSet":
            # Purposefully keep the FIDSet as dynamic since this might change
            tmp_desc = AOLUtils.describe(self.layer)
            return tmp_desc.FIDSet
        else:
            raise AttributeError("Object has no attribute '{}'".format(name))


class PAOutputFeatureLayer(PALayer):
    """Object used to store and publish the analysis output.

    Attributes
    ----------
        drawing_info : `Optional[Dict]`
            A json represents the symbology of the layer.
        popup : `Optional[Dict]`
            A json represents the popup of the layer.

    Methods
    -------
        get_publish_json()
            Get the json used for publishing.

    Examples
    --------
        >>> output_layer = PAOutputFeatureLayer(0)

    """

    def __init__(
        self,
        dataset: SPATIALDATATYPE,
        metadata: Optional[Dict] = None,
        select_features_in_extent: bool = False
    ):
        """Initialize the drawing_info and popup properties.

        Args:
            dataset (SPATIALDATATYPE): the input data for the layer object. The dataset for the PAOutputLayer can only
            be a str (either layer name or catalog path). Majority of the time, the dataset parameter is the absolute
            path of the output.
            metadata (Optional[Dict], optional): a dictionary with metadata of the data (i.e., {"parameterDataType": ,
            "parameterName":, "optional":}). Defaults to None.
            select_features_in_extent (bool, optional): derived the same behavior of the parent class (PALayer).
            Defaults to False.
        """
        super(PAOutputFeatureLayer, self).__init__(dataset, metadata, select_features_in_extent)
        self.data_type = "CatalogPath"
        self.drawing_info = None  # type: Optional[dict]
        self.popup = None  # type: Optional[dict]
        self.relationships = []
        # a list of field names to exclude when creating field_alias json
        self.fname_to_exclude = ["shape_area", "shape_length", "st_area_shape_", "st_length_shape_"]
        # a list of field alias to exclude when creating field_alias json
        self.falias_to_exclude = ["st_length(shape)", "st_area(shape)"]
        # fields_description should be in terms of {field_name: {'description': '', 'valueType': ''}}
        self.fields_description: Optional[Dict] = None
        self.charts = []

    def __repr__(self):
        """Return the table name if data is a catalogpath."""
        if isinstance(self.data, str):
            return os.path.basename(self.data)
        else:
            return str(self.data)

    def __getattr__(self, name: str):
        """Overwrite the __getattr__ metamethod to use the property from the object. If the object contains the
        property specified, return the property as it is. Otherwise, get the property from self._description."""
        if name in self.__dict__:
            return self.__dict__[name]
        elif self.description and hasattr(self.description, name):
            return getattr(self.description, name)
        else:
            raise AttributeError("Object has no attribute '{}'".format(name))

    def get_publish_json(
        self,
        position: int,
        name: str = "",
        layer_id: int = 0,
        copy_to_sde: bool = True
    ) -> Dict:
        """Get the json used for publish under new framework.

        Args:
            position (int): index of parameters for saving the output feature service.
            name (str, optional): name of the layer in the output feature service. Defaults to "".
            layer_id (int, optional): index of the layer in the output feature service. Defaults to 0.
            copy_to_sde (bool, optional): whether to copy the current data to the sde. Defaults to True.

        Returns:
            Dict: A json with all the information needed to publish the feature service. For example a publish json
            should be {"properties": {"drawingInfo": "", "alias": ""}, "position": 0, "name": "", "id": 0,
            "catalogPath": "", "copyToManagedDS": True}
        """
        publish_json = {"position": position,
                        "name": name,
                        "id": layer_id,
                        "catalogPath": self.data,
                        "copyToManagedDS": copy_to_sde}
        if self.drawing_info:
            properties = {"drawingInfo": self.drawing_info, "alias": self.get_fields_alias()}
        else:
            properties = {"alias": self.get_fields_alias()}
            LOGGER.debug("drawing_info of the layer has not been initialized.")

        # If popup has not been initialized, use the default popup.
        if self.popup:
            properties["popupInfo"] = self.popup  # type: ignore

        # If relationships is not blank, use the defined relationship
        if self.relationships:
            properties["relationships"] = self.relationships

        publish_json["properties"] = properties
        return publish_json

    def get_as_publish_json(
        self,
        name: str = "",
        layer_id: int = 0,
    ) -> Dict:
        geometry_lookup = {"Point": "esriGeometryPoint",
                           "Polyline": "esriGeometryPolyline",
                           "Polygon": "esriGeometryPolygon"}
        advanced_query_capabilities = {"supportsPagination": True,
                                       "supportsPaginationOnAggregatedQueries": True,
                                       "supportsQueryRelatedPagination": True,
                                       "supportsQueryWithDistance": True,
                                       "supportsReturningQueryExtent": True,
                                       "supportsStatistics": True,
                                       "supportsOrderBy": True,
                                       "supportsDistinct": True,
                                       "supportsQueryWithResultType": True,
                                       "supportsSqlExpression": True,
                                       "supportsAdvancedQueryRelated": True,
                                       "supportsCountDistinct": True,
                                       "supportsPercentileStatistics": True,
                                       "supportsLod": True,
                                       "supportsQueryWithLodSR": False,
                                       "supportedLodTypes": ["geohash"],
                                       "supportsReturningGeometryCentroid": False,
                                       "supportsQueryWithDatumTransformation": True,
                                       "supportsHavingClause": True,
                                       "supportsOutFieldSQLExpression": True,
                                       "supportsMaxRecordCountFactor": True,
                                       "supportsTopFeaturesQuery": True,
                                       "supportsDisjointSpatialRel": True,
                                       "supportsQueryWithCacheHint": True,
                                       "supportsQueryAnalytic": True}
        as_lyr_json = {"adminLayerInfo": {"tableName": os.path.basename(self.data),
                                          "geometryField": {"name": self.shapeFieldName},
                                          "xssTrustedFields": ""},
                       "id": layer_id,
                       "name": name,
                       "type": "Feature Layer",
                       "displayField": "",
                       "description": "",
                       "defaultVisibility": True,
                       "isDataVersioned": False,
                       "supportsAppend": True,
                       "supportsASyncCalculate": True,
                       "supportsTruncate": False,
                       "supportsAttachmentsByUploadId": True,
                       "supportsAttachmentsResizing": True,
                       "supportsRollbackOnFailureParameter": True,
                       "supportsStatistics": True,
                       "supportsExceedsLimitStatistics": True,
                       "supportsAdvancedQueries": True,
                       "supportsValidateSql": True,
                       "supportsCoordinatesQuantization": True,
                       "supportsLayerOverrides ": True,
                       "supportsTilesAndBasicQueriesMode": True,
                       "supportsContingentValues": True,
                       "supportsFieldDescriptionProperty": True,
                       "supportsQuantizationEditMode": True,
                       "supportsApplyEditsWithGlobalIds": False,
                       "supportsReturningQueryGeometry": True,
                       "advancedQueryCapabilities": advanced_query_capabilities,
                       "useStandardizedQueries": True,
                       "minScale": 0,
                       "maxScale": 0,
                       "allowGeometryUpdates": True,
                       "hasAttachments": False,
                       "typeIdField": "",
                       "supportedQueryFormats": "JSON, geoJSON, PBF",
                       "supportedAppendFormats": "sqlite,gpkg,shapefile,filegdb,featureCollection,geojson,csv,excel",
                       "hasStaticData": True,
                       "maxRecordCount": 2000,
                       "standardMaxRecordCount": 32000,
                       "standardMaxRecordCountNoGeometry": 32000,
                       "tileMaxRecordCount": 8000,
                       "maxRecordCountFactor": 1,
                       "capabilities": "Query",
                       "exceedsLimitFactor": 1}

        if self.shapeType:  # type: ignore
            as_lyr_json["geometryType"] = geometry_lookup[self.shapeType]  # type: ignore

        if self.extent:  # type: ignore
            as_lyr_json["extent"] = json.loads(self.extent.JSON)  # type: ignore

        if self.drawing_info:
            as_lyr_json["drawingInfo"] = self.drawing_info

        if self.popup:
            as_lyr_json["popupInfo"] = self.popup  # type: ignore
        else:
            as_lyr_json["htmlPopupType"] = "esriServerHTMLPopupTypeNone"

        if self.relationships:
            as_lyr_json["relationships"] = self.relationships

        if self.OIDFieldName:  # type: ignore
            as_lyr_json["objectIdField"] = self.OIDFieldName  # type: ignore
            as_lyr_json["uniqueIdField"] = {"name": self.OIDFieldName,  # type: ignore
                                            "isSystemMaintained": True}
        as_lyr_json["fields"] = self.get_analysis_studio_fields()
        as_lyr_json["indexes"] = self.get_indexes()

        return as_lyr_json

    def set_drawing(self, renderer: "Optional[Renderer]", drawing_json: Optional[Dict] = None):
        """Set the drawing json for the layer. So the layer can be used for publish.

        Args:
            renderer (Renderer): an instance of Renderer.
            drawing_json (Optional[Dict], optional): a json with the drawing information. Defaults to None.
        """
        # If user passed in an instance of Renderer, then call get_drawing_json to get the drawing information.
        if renderer:
            self.drawing_info = renderer.get_drawing_json()
        # Otherwise use the drawing_info generated externally (not recommended though).
        else:
            self.drawing_info = drawing_json

    def set_popup(self,
                  popup_info: Optional[PopupInfo],
                  popup_title: str,
                  date_format: str = "shortDateShortTime",
                  hide_fields: Optional[List] = None,
                  field_names_display_order: Optional[List] = None):
        """Set the popup of the layer.

        Args:
            popup_info (Optional[PopupInfo]): Use the popup_info's get_popup_info() result if popup_info is an
            instance of PopupInfo. Otherwise, customize the popup based on user's inputs. Omits OID, globalid,
            shape, shape_length, and shape_area fields from the popup. Use default formatting as defined in the
            PopupInfo class for double and date fields. For more info about JSON for popup objects refer to
            http://resources.arcgis.com/en/help/arcgis-rest-api/#/popupInfo/02r300000042000000/.
            popup_title (str): title of the popup that appears at the top of the pop-up window. This can contain a field name
            enclosed in {}, such as {NAME}.
            date_format (str, optional): format style that is used to format date-time fields. Defaults to "shortDateShortTime".
            hide_fields (Optional[List], optional): sequence of field names that is set to unvisible. Defaults to None.
            field_names_display_order (Optional[List], optional): sequence of field names that are in the order in which they are to be drawn in
            the popup. If None, the fields are drawn in the default order which is the order in which the fields were
            added to the table. Defaults to None.
        """
        if isinstance(popup_info, PopupInfo):
            self.popup = popup_info.get_popup_info()
        else:
            layer_popup = PopupInfo(popup_title)
            # Add all fields to the popup except the OID, GlobalID, shape, shape_length, shape_area fields
            omit_fields = ["shape_length", "shape_area", "globalid"]
            if hasattr(self, "OIDFieldName"):
                omit_fields.append(self.OIDFieldName.lower())  # type: ignore
            if hasattr(self, "shapeFieldName"):
                omit_fields.append(self.shapeFieldName.lower())  # type: ignore
            omit_fields = tuple(omit_fields)

            # layer field objects are used to look up properties for a field such as field type based on the field name
            layer_field_objects = {fld.name: fld for fld in self.fields}

            if field_names_display_order:
                layer_field_names = field_names_display_order
            else:
                layer_field_names = [fld.name for fld in self.fields]

            # Set a format for fields of type date and double
            for name in layer_field_names:
                fld = layer_field_objects[name]
                fld_name = fld.name
                if fld_name.lower() in omit_fields:
                    continue
                is_field_visible = True
                if hide_fields and fld_name in hide_fields:
                    is_field_visible = False
                # Use the field alias as the label for the popup. For date and double fields, set a format
                fld_type = fld.type.lower()
                if fld_type == "double":
                    layer_popup.add_field_info(fld_name, fld.aliasName, True, visible=is_field_visible)
                elif fld_type == "date":
                    layer_popup.add_field_info(fld_name, fld.aliasName, True, date_format=date_format,
                                               visible=is_field_visible)
                else:
                    layer_popup.add_field_info(fld_name, fld.aliasName, visible=is_field_visible)
            # LOGGER.debug(f"popup_info: {layer_popup.get_popup_info()}")
            self.popup = layer_popup.get_popup_info()

    def get_fields_alias(self) -> List:
        """Get the alias of all fields as a list to feed the publish json.

        Returns:
            List: A list with each item as a dictionary like {"alias": "", "name": ""}. shape related fields are not
            included.
        """
        if self.fields_description:
            self.fields_description = {k.lower(): v for (k, v) in self.fields_description.items()}
        fields_alias = []
        for field in self.fields:
            fnl = field.name.lower()
            if (
                fnl not in self.fname_to_exclude
                and field.aliasName.lower() not in self.falias_to_exclude
                and field.type not in ["OID", "Geometry"]
            ):
                tmp_field = {"alias": field.aliasName, "name": field.name}
                if self.fields_description and field.name.lower() in self.fields_description:
                    tmp_field["description"] = json.dumps({"value": self.fields_description[fnl].get("description", ""),
                                                           "fieldValueType": self.fields_description[fnl].get("valueType", "")})
                fields_alias.append(tmp_field)

        return fields_alias

    def add_relationship(self, rel_name: str, related_id: int, key_field: str = "JOIN_ID",
                         is_origin: bool = True, is_one_to_many: bool = True,
                         is_composite: bool = True):
        """Create a relationship json used for publishing.
        Args:
            rel_name (str): name of the relationship.
            related_id (int): The ID of the intermediate table in the feature service for attributed relationships.
            key_field (str, optional): The name of the primary key field in the destination table.
            Defaults to "JOIN_ID".
            is_origin (bool, optional): True if the related_id is pointing to the original layer and False otherwise.
            Defaults to True.
            is_one_to_many (bool, optional): True the cardinality is esriRelCardinalityManyToMany and
            esriRelCardinalityOneToMany if False. Defaults to True.
            is_composite (bool, optional): Indicates whether the relationship is composite. Defaults to True.
        """
        relationship_def = {"name": "GroupBySummary",
                            "relatedTableId": 1,
                            "cardinality": "esriRelCardinalityOneToMany",
                            "role": "esriRelRoleOrigin",
                            "keyField": "",
                            "composite": True}
        relationship_def["name"] = rel_name
        relationship_def["relatedTableId"] = related_id
        relationship_def["keyField"] = key_field
        relationship_def["composite"] = is_composite
        if not is_origin:
            relationship_def["role"] = "esriRelRoleDestination"

        if not is_one_to_many:
            relationship_def["cardinality"] = "esriRelCardinalityManyToMany"
        self.relationships.append(relationship_def)

    def get_analysis_studio_fields(self) -> List:
        fields_info = []
        for field in self.fields:
            if (
                field.name.lower() not in ["shape_area", "shape_length", "st_area_shape_", "st_length_shape_"]
                and field.aliasName.lower() not in ["st_length(shape)", "st_area(shape)"]
                and field.type not in ["Geometry"]
            ):
                tmp_field = {"alias": field.aliasName, "name": field.name,
                             "type": field.type, "nullable": field.isNullable,
                             "editable": field.editable, "visible": True,
                             "domain": field.domain, "defaultValue": field.defaultValue}
                fields_info.append(tmp_field)
        return fields_info

    def get_indexes(self) -> List:
        indexes_info = []
        indexes = arcpy.ListIndexes(self.data)
        for idx in indexes:  # type: ignore
            tmp_index = {"name": idx.name,
                         "fields": ";".join([fid.name for fid in idx.fields]),
                         "isAscending": idx.isAscending,
                         "isUnique": idx.isUnique,
                         "description": ""}
            indexes_info.append(tmp_index)
        return indexes_info

    def add_chart(self, chart: arcpy.Chart):
        """add chart to the output"""
        if not chart.dataSource:
            chart.dataSource = self.data
        elif chart.dataSource != self.data:
            LOGGER.error("dataSource of the chart to add is different from the layer.")
            raise RuntimeError
        self.charts.append(chart)


class PAFeatureLayerCollection:
    """A collection of feature layers.

    Attributes
    ----------
        data : `List[PAFeatureLayer]`
            Return a list of PAFeatureLayer object.
        count : `int`
            The total # of features of all layers.

    Methods
    -------
        get_extract_data_json()
            Return a json with the URL information of all the layers that can be used for createReplica.
        __bool__()
            True if len(data) > 0 and False otherwise.

    Examples
    --------
        >>> lyr_coll = PAFeatureLayerCollection(0)

    """

    def __init__(
        self,
        dataset: LYRCOLLECTION,
        metadata: Optional[Dict] = None,
        verify_feature_count: bool = True,
        select_features_in_extent: bool = True,
        for_extract: bool = False,
        max_download_featcount: Optional[int] = DEFAULT_DOWNLOADABLE_FEATCOUNT,
        use_as_soap_input: bool = False
    ):
        """Load data and perform validation.

        Args:
            dataset: either the parameter index or a list of data.
            verify_feature_count: check if there is any features within the context extent.
            select_features_in_extent: whether to select features fall within the context extent or not.
            for_extract: whether the purpose of using layers is for data extract. The feature layer needs to be checked
            and see if it is downloadable if for_extract is True. No need to check if the layer is downloadable
            otherwise.
            max_download_featcount: an integer indicates the maximum # of features allow for downloading.
        Returns:
            No returns.
        Raises:
            AO_100032 if no features of any of the input layers fall within context extent and verify_feature_count
            is True.

        """
        self.verify_feature_count = verify_feature_count
        self.select_features_in_extent = select_features_in_extent
        self.for_extract = for_extract
        self.max_download_featcount = max_download_featcount
        self.metadata: Dict = metadata  # type: ignore
        self.use_as_soap_input = use_as_soap_input

        self._data = []
        self.load_data(dataset)
        self._count = None
        self._index = 0

        # Check if all the layers does not have any features within extent
        if self._data and self.verify_feature_count:
            total_feat_within = 0
            for paf_lyr in self._data:
                if paf_lyr.count == 0:
                    LOGGER.warning(100024, extra={"message_ID": 100024, "inputLayer": paf_lyr.layer_name})
                total_feat_within += paf_lyr.count
            if total_feat_within == 0:
                LOGGER.error(100049, extra={"message_ID": 100049})
                raise RuntimeError

    def __bool__(self) -> bool:
        return len(self.data) > 0

    def __iter__(self):
        return self

    def __next__(self):
        try:
            result = self.data[self._index]
        except IndexError:
            raise StopIteration
        self._index += 1
        return result

    def load_data(self, dataset: LYRCOLLECTION):
        """Load data from a RecordSet dataset."""
        self._data = []

        if isinstance(dataset, int):
            param_data_type = self.metadata.get("parameterDataType", "")
            param_name = self.metadata.get("parameterName", "")
            param_type = self.metadata.get("parameterType", "")
            # get parameterDataType, parameterType and parameterName through GetParameterInfo
            if not param_data_type or not param_name:
                data_index = dataset
                params = arcpy.GetParameterInfo()
                param_data_type = params[data_index].datatype  # type: ignore
                param_name = params[data_index].name  # type: ignore
                param_type = params[data_index].parameterType  # type: ignore
                self.metadata.update({"parameterDataType": param_data_type})
                self.metadata.update({"parameterName": param_name})
                self.metadata.update({"parameterType": param_type})

            # explicitly set the source to ParameterIndex so the data is used as it is.
            if self.metadata.get("parameterType") == "Optional":
                if arcpy.GetParameterAsText(dataset):
                    dataset = arcpy.GetParameter(dataset)  # type: ignore
                else:
                    dataset = []
            else:
                dataset = arcpy.GetParameter(dataset)  # type: ignore

            self.metadata.update({"source": "ParameterIndex"})

        LOGGER.debug("dataset: {}".format(type(dataset).__name__))
        for data in dataset:  # type: ignore
            if not isinstance(data, PAFeatureLayer):
                paf_lyr = PAFeatureLayer(data,
                                         self.metadata,  # type: ignore
                                         verify_feature_count=False,
                                         select_features_in_extent=self.select_features_in_extent,
                                         for_extract=self.for_extract,
                                         max_download_feature_count=self.max_download_featcount,
                                         use_as_soap_input=self.use_as_soap_input)
            else:
                paf_lyr = data
            self._data.append(paf_lyr)

    @property
    def data(self) -> List[PAFeatureLayer]:
        """Getter of data property."""
        return self._data

    @property
    def count(self) -> int:
        """Get the total # of features of all layers."""
        if self._count is None:
            self._count = 0
            for paf_lyr in self._data:
                self._count += paf_lyr.count  # type: ignore
        return self._count  # type: ignore

    def get_extract_data_json(self) -> Dict:
        """Get the json to feed createReplica logic of ExtractData.

        Args:
            No arguments.
        Returns:
            A dictionary with keys of featureServices and featureCollections where layers in the category of
            featureServices are going to be feteched through createReplica and layers in featureCollections
            will be extracted in regular logic.
        Raises:
            No exceptions.

        """
        feature_services = {}
        feature_collections = []
        for layer in self.data:
            if layer.url_json is None:
                feature_collections.append(layer)
            else:
                tmp_url = layer.url_json.get("url")  # type: ignore
                if tmp_url and tmp_url not in feature_services:
                    layer_id = layer.url_json.get("layerId")  # type: ignore
                    token = layer.url_json.get("token")  # type: ignore
                    fl_filter = layer.url_json.get("filter")  # type: ignore
                    if fl_filter:
                        tmp_fl_info = {"id": "{}".format(layer_id), "filter": fl_filter}
                    else:
                        tmp_fl_info = {"id": "{}".format(layer_id)}
                    tmp_fl_json = {"url": tmp_url, "layers": [tmp_fl_info]}
                    if token:
                        tmp_fl_json["token"] = token
                    feature_services[tmp_url] = tmp_fl_json
                elif tmp_url and tmp_url in feature_services:
                    layer_id = layer.url_json.get("layerId")  # type: ignore
                    token = layer.url_json.get("token")  # type: ignore
                    fl_filter = layer.url_json.get("filter")  # type: ignore
                    if fl_filter:
                        tmp_fl_info = {"id": "{}".format(layer_id), "filter": fl_filter}
                    else:
                        tmp_fl_info = {"id": "{}".format(layer_id)}

                    if "token" not in feature_services[tmp_url] and token:
                        feature_services[tmp_url]["token"] = token
                    feature_services[tmp_url]["layers"].append(tmp_fl_info)
                else:
                    LOGGER.error("Invalid url_json of layer.")
                    raise RuntimeError
        fs_list = [feature_services[url] for url in feature_services]
        return {"featureServices": fs_list, "featureCollections": feature_collections}
