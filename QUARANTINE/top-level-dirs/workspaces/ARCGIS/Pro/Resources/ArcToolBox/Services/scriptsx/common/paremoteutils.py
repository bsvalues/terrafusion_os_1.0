# noqa. pylint: disable=import-error
# pylint: disable=logging-fstring-interpolation
from typing import Dict, Optional, Tuple, NamedTuple, List
import re
import collections
import json
from urllib.parse import urlsplit, urlunsplit

import arcpy
from arcgisscripting import _hgp  # type: ignore
import requests

from .palog import LogUtils, ToolExit
from .aolutils import AOLUtils


__all__ = ["PortalUtils", "RemoteToolboxUtils"]

LOGGER = LogUtils.setup_logger(__name__)


class OutputFeatureDataset(object):
    """Class to host the output from get_output_catalogpath"""
    def __init__(self):
        self.path = ""
        self._ptr = None


class PortalUtils:
    """Class module with utility functions from hostedgp. These functions will eventually be replaced with arcpy.portal
    namespace where hostedgp's portal related functions will be moved to.

    Methods
    -------
        get_private_url(url: str)
            Get the private url of a portal url.
        get_itemdata_as_file(item_id: str, file_name: str)
            Get the data of a portal item as a file.
        make_generic_sharing_request(sharing_url: str, parameters: Optional[Dict])
            Make a generic request to the portal's sharing API.
        add_portal_item(parameters: Dict, properties: Optional[Dict])
            Add an item to portal.
        update_portal_item(itemId: str, parameters: Dict, properties: Optional[Dict]):
            Update a portal item.
        delete_portal_item(itemId: str, properties: Optional[Dict]):
            Delete a portal item.
        get_output_catalogpath(output_json: Dict):
            Get the path of an empty table in the server's datastore.
        get_server_token(url: str, expire: int = 120):
            Get a dictionary ({"token": "", "referer": ""}) of the server token against the url.
        get_url_resp_json(url: str):
            Perform request get operation against a portal url.
        get_item(item_id: str):
            Get the item content as a json.

    """

    HOSTEDGP = _hgp._hostedgp()

    @classmethod
    def get_private_url(cls, url: str) -> str:
        """Get private url of a portal url.

        Args:
            url (str): a url from the sign-in portal.

        Raises:
            ToolExit if the GetPrivateUrl failed.

        Returns:
            str: the private url.
        """
        try:
            return cls.HOSTEDGP.GetPrivateUrl(url)
        except Exception as err:
            LOGGER.error(f"Failed to get private url for {url} due to {str(err)}.")
            raise ToolExit from err

    @classmethod
    def get_itemdata_as_file(cls, item_id: str, file_name: str):
        """Get the data of an item on portal as a file.

        Args:
            item_id (str): id of the item on the portal.
            file_name (str): local path to download the item data to.

        Raises:
            ToolExit: if the GetItemDataAsFile function fail.
        """
        try:
            cls.HOSTEDGP.GetItemDataAsFile(item_id, file_name)
        except Exception as err:
            LOGGER.error(f"Failed to get item data from {item_id} due to {str(err)}.")
            raise ToolExit from err

    @classmethod
    def make_generic_sharing_request(cls, sharing_url: str, parameters: Optional[Dict]) -> Dict:
        """Make a generic request to the portal's sharing API.

        Args:
            sharing_url (str): sharing API url to execute the request.
            parameters (Optional[Dict]): parameters used for the request.

        Raises:
            ToolExit: if the request fails.

        Returns:
            Dict: response back from the request.
        """
        try:
            if parameters is None:
                parameters = {}
            response = cls.HOSTEDGP.GenericSharingRequest(sharing_url, json.dumps(parameters))
            return json.loads(response)
        except Exception as err:
            LOGGER.debug(f"Failed to serve the request against {sharing_url} due to {str(err)}.")
            if "arcgis online backend system is currently running in the read-only mode" in str(err).lower():
                LOGGER.error(100367, extra={"message_ID": 100367})
            raise ToolExit from err

    @classmethod
    def add_portal_item(cls, parameters: Dict, properties: Optional[Dict] = None) -> str:
        """Add an item to a portal.

        Args:
            parameters (Dict): parameters to feed the add item request.
            properties (Optional[Dict], optional): properties to feed the add item request. Defaults to None.

        Raises:
            ToolExit: if the AddItem request fails.

        Returns:
            str: response back from the request.
        """
        try:
            # check for type keyword parameter
            if properties is None:
                properties = {}
            return cls.HOSTEDGP.AddUpdateItem(str(""), json.dumps(parameters), json.dumps(properties))
        except Exception as err:
            LOGGER.error(f"Failed to add portal item because {str(err)}.")
            raise ToolExit from err

    @classmethod
    def update_portal_item(cls, itemId: str, parameters: Dict, properties: Optional[Dict] = None):
        """Update a portal item.

        Args:
            itemId (str): id of the item to update.
            parameters (Dict): parameters to feed the update item request.
            properties (Optional[Dict], optional): properties to feed the update item request. Defaults to None.

        Raises:
            ToolExit: if the UpdateItem request fails.

        """
        try:
            if properties is None:
                properties = {}
            return cls.HOSTEDGP.AddUpdateItem(itemId, json.dumps(parameters), json.dumps(properties))
        except Exception as err:
            LOGGER.error(f"Failed to update portal item because {str(err)}.")
            raise ToolExit from err

    @classmethod
    def delete_portal_item(cls, itemId: str, properties: Optional[Dict] = None):
        """Delete a portal item.

        Args:
            itemId (str): ID of the item to delete.
            properties (Optional[Dict], optional): properties to feed the delete item request. Defaults to None.
        """
        try:
            LOGGER.debug(f"Deleting portal item with ID {itemId}...")
            if properties is None:
                properties = {}
            cls.HOSTEDGP.DeleteItem(itemId, json.dumps(properties))
        except Exception as err:
            LOGGER.error(f"Failed to delete portal item because {str(err)}.")
            raise ToolExit from err

    @classmethod
    def get_system_property(cls, property_name: str) -> Optional[str]:
        try:
            return cls.HOSTEDGP.GetSystemProperty(property_name)
        except Exception as err:
            LOGGER.debug(f"Failed to get the system property of {property_name} due to {str(err)}")
            return None

    @classmethod
    def get_output_catalogpath(cls, output_json: Dict) -> str:
        x = OutputFeatureDataset()
        try:
            cls.HOSTEDGP.GetOutputCatalogPath(str(output_json), x)
        except Exception as err:
            raise arcpy.ExecuteError(f"Failed to get output catalogPath since {str(err)}")
        return x.path

    @classmethod
    def copy_data_to_sds(cls, data_path: str,
                         output_name: Optional[str] = None,
                         index_field_name: Optional[str] = None,
                         index_name: Optional[str] = None,
                         is_unique: bool = True,
                         is_ascending: bool = True) -> Dict:
        """Copy local dataset to the datastore of the server.

        Args:
            data_path (str): absolute path of the local dataset.
            output_name (Optional[str]): name of the table in the datastore. A
            random name is initialized if not specified.

        Returns:
            Dict: a json with information of the dataset (table) in server datastore.
            The output is like: {"outputTableName": "xxx", "fieldNames": ["field1"...]}
        """
        try:
            return cls.HOSTEDGP.SimpleCopyToDatastore(data_path, output_name,
                                                      index_field_name, index_name,
                                                      is_unique, is_ascending)
        except Exception as err:
            LOGGER.debug(f"Failed to copy {data_path} since {str(err)}")
            raise err

    @classmethod
    def get_server_token(cls, url: str, expire: int = 120) -> Dict:
        """Get a server token against a certain url.

        Args:
            url (str): url to ping to.
            expire (int, optional): time in minutes that the token will expire.
            Defaults to 120.

        Raises:
            ToolExit: if the GetServerToken call failed.

        Returns:
            Dict: a dictionary with the token and referer information.
        """
        token, referer = cls.HOSTEDGP.GetServerToken(url, expire)
        if token and referer:
            return {"token": token, "referer": referer}
        elif token:
            return {"token": token}
        else:
            LOGGER.debug(f"unable to create server token for {url}.")
            raise ToolExit

    @classmethod
    def get_self(cls) -> Dict:
        return json.loads(cls.HOSTEDGP.GetSelf())

    @classmethod
    def get_url_resp_json(cls, url: str) -> Dict:
        """Perform request get operation against a portal url.

        Args:
            url (str): url of a portal item.

        Raises:
            ToolExit: if any failures happened during accessing the url.

        Returns:
            Dict: the response in format of json of the item.
        """
        try:
            token = cls.get_server_token(url)
            params = {"token": token["token"], "f": "json"}
            headers = {"referer": token["referer"]} if "referer" in token else None
            return AOLUtils.mk_get_request(url, params=params, verify=False,
                                           headers=headers)
        except (KeyError, ValueError, ToolExit):
            # might be a public resource that do not need to access with token
            try:
                params = {"f": "json"}
                return AOLUtils.mk_get_request(url, params=params, verify=False)
            except (ValueError, ToolExit) as err:
                LOGGER.debug(f"Unable to access {url}")
                raise ToolExit from err

    @classmethod
    def get_item(cls, item_id: str) -> Dict:
        try:
            return json.loads(cls.HOSTEDGP.GetItem(item_id))
        except Exception as err:
            LOGGER.debug(f"get_item failed in accessing {item_id}")
            raise ToolExit from err

    @classmethod
    def create_service(
        cls,
        service_name: str,
        capabilities: str = "Query",
        description: str = "",
        snippet: str = "",
        sync_enabled: bool = False,
        tables: List = [],
        folder_id: Optional[str] = None
    ) -> Dict:
        """Create an empty feature service.

        Args:
            service_name (str): name of the feature service.
            capabilities (str, optional): capabilities of the feature service. Defaults to "Query".
            description (str, optional): description of the feature service. Defaults to "".
            sync_enabled (bool, optional): True to enable sync and false otherwise. Defaults to False.
            tables (List, optional): definition for tables of the service. Defaults to [].
            folder_id (Optional[str], optional): id of the folder to publish it to. Defaults to None.

        Raises:
            AO_110342: if failed to create the feature service.

        Returns:
            Dict: response of the create serivce request.
        """
        create_params = {
            "currentVersion": 10.2,
            "serviceDescription": "",
            "hasVersionedData": False,
            "supportsDisconnectedEditing": False,
            "hasStaticData": True,
            "maxRecordCount": 2000,
            "supportedQueryFormats": "JSON",
            "capabilities": capabilities,
            "description": description,
            "copyrightText": "",
            "allowGeometryUpdates": False,
            "syncEnabled": sync_enabled,
            "editorTrackingInfo": {
                "enableEditorTracking": False,
                "enableOwnershipAccessControl": False,
                "allowOthersToUpdate": True,
                "allowOthersToDelete": True
            },
            "xssPreventionInfo": {
                "xssPreventionEnabled": True,
                "xssPreventionRule": "InputOnly",
                "xssInputRule": "rejectInvalid"
            },
            "tables": tables,
            "name": service_name
        }
        if snippet:
            create_params["snippet"] = snippet
        params = {"createParameters": create_params, "outputType": "featureService",
                  "f": "json"}
        params = json.dumps(params, skipkeys=False, ensure_ascii=False)
        try:
            if folder_id is None:
                folder_id = ""
            resp = cls.HOSTEDGP.CreateService(str(params), str(folder_id))
            # LOGGER.debug(f"CreateService response: {resp}")
            if resp is not None:
                return json.loads(resp)
            return resp
        except Exception as err:
            LOGGER.debug(f"Failed to create service due to {str(err)}")
            LOGGER.error(110342, extra={"message_ID": 110342, "serviceName": service_name})
            raise err

    @classmethod
    def is_portal_env(cls) -> bool:
        """Check if the tool running in enterprise (portal) environment."""
        try:
            portal_desc = arcpy.GetPortalDescription()
        except Exception as err:
            LOGGER.debug(f"Unable to get the description of the environment due to {str(err)}")
            return False
        if not isinstance(portal_desc, dict):
            return False
        return portal_desc.get("isPortal", False)

    @classmethod
    def is_service_name_available(cls, service_name: str, service_type: str="featureService") -> Tuple:
        """Check if a certain service_name is usable or not.

        Args:
            service_name (str): name of the service to check.
            service_type (str, optional): type of the service to check.. Defaults to "featureService".

        Returns:
            a tuple where the first item is a boolean indicates that if a certain service_name is usable,
            and the second item is a string with the itemId of the service.

        """        
        params = {"f": "json", "includeitemid": True, "type": service_type, "name": service_name}
        resp = PortalUtils.make_generic_sharing_request("portals/self/isServiceNameAvailable", params)
        if "available" in resp:
            avail = resp["available"]
            if not avail:
                item_id = resp.get("itemId")
            else:
                item_id = None
            return (avail, item_id)
        return (False, None)


class RemoteToolboxUtils:
    """Class module with remote toolbox operation related functionalities.

    Methods
    -------
        get_remote_toolbox(service_name: str, portal_description: Dict)
            Get the toolbox path that can be added via arcpy.gp.AddToolbox.
        get_helper_service_url(service_name: str, portal_description: Dict)
            Get the URL of the helper service together with token and referer.
        check_url_validity(url_to_check: str, token: str, referer: str, portal_helper_services_key: str)
            Check if the url is valid.
        convert_rest_url(url: str):
            unpack the url with the toolbox information (i.e., toolbox, serviceName, taskName...)
        verify_url(url: str):
            Check if a certain url is valid.

    """

    @staticmethod
    def get_remote_toolbox(
        service_name: str,
        portal_description: Dict
    ) -> str:
        """Get the toolbox string that can be used to add using arcpy.gp.AddToolbox.

        Args:
            service_name: name of the property that defines the URL for the service within the helperServices.
            portal_description: portal description json that can ge obtained through arcpy.GetPortalDescription()
        Returns:
            A string that can be added to the remote toolbox using arcpy.gp.AddToolbox.
        Raises:
            ToolExit if failed to get the string represens the remote toolbox.

        """
        try:
            service_rest_url, token, referer = RemoteToolboxUtils.get_helper_service_url(service_name,
                                                                                         portal_description)
            gp_service = RemoteToolboxUtils.convert_rest_url(service_rest_url)
            if token:
                tbx = "{0};token={1};{2}".format(gp_service.toolbox, token, referer)  # type: ignore
            else:
                tbx = "{0};{1}".format(gp_service.toolbox, referer)  # type: ignore
            return tbx
        except Exception as err:  # noqa. pylint: disable=bare-except
            LOGGER.error("Exception @get_remote_toolbox")
            raise ToolExit from err

    @staticmethod
    def get_helper_service_url(
        service_name: str,
        portal_description: Dict,
        token: Optional[str] = None,
        referer: Optional[str] = None,
        log_error: bool = True
    ) -> Tuple:
        """Get the URL of the helper service together with token and referer information.

        Args:
            service_name (str): name of the property that defines the URL for the service within the helperServices.
            portal_description (Dict): portal description json that can ge obtained through arcpy.GetPortalDescription().
            token (Optional[str], optional): token explicitly passed in from caller function. Defaults to None.
            referer (Optional[str], optional): referer explicitly passed in from caller function. Defaults to None.
            log_error (bool, optional): True to explicit log error and False otherwise. Defaults to True.

        Raises:
            ToolExit: ToolExit if get the information failed.

        Returns:
            Tuple: A three items tuple in the order of (helper service URL, token, referer).
        """
        helper_services = portal_description.get("helperServices", portal_description)
        try:
            if not (helper_services.get(service_name) and helper_services[service_name].get("url")):
                if log_error:
                    LOGGER.error(100144, extra={"message_ID": 100144, "serviceName": service_name})
                else:
                    LOGGER.debug(f"The {service_name} utility is not registered for the portal.")
                raise ToolExit
            service_base_url = helper_services[service_name]["url"]

            # Get a service token before computing the private service url as generating server tokens fails with
            # private urls to service proxies
            if not token:
                try:
                    token, referer = _hgp._hostedgp().GetServerToken(service_base_url, 720)
                # default to generate server token via hostedgp, but if hostedgp is not working, generate token
                # via arcpy.GetSigninToken
                except RuntimeError:
                    token_json = arcpy.GetSigninToken()
                    token = token_json["token"]
                    referer = token_json["referer"]

            owning_sys_parse = requests.utils.urlparse(arcpy.GetActivePortalURL())  # type: ignore
            service_url_parse = requests.utils.urlparse(service_base_url)  # type: ignore
            if owning_sys_parse.netloc.lower() == service_url_parse.netloc.lower():
                if owning_sys_parse.path:
                    service_url_path = service_url_parse.path[:len(owning_sys_parse.path)].lower()
                    if owning_sys_parse.path.lower() == service_url_path:
                        service_base_url = PortalUtils.get_private_url(service_base_url)
                else:
                    service_base_url = PortalUtils.get_private_url(service_base_url)

            url_chk_res = RemoteToolboxUtils.check_url_validity(service_base_url, token, referer,
                                                                service_name)
            if url_chk_res[0]:
                return (service_base_url, token, referer)
            else:
                # retry without token just in case the service is public.
                tmp_url_chk_res = RemoteToolboxUtils.check_url_validity(service_base_url,
                                                                        token=None,
                                                                        referer=referer,
                                                                        portal_helper_services_key=service_name)
                if tmp_url_chk_res[0]:
                    return (service_base_url, token, referer)
                else:
                    if log_error:
                        LOGGER.error(url_chk_res[1].get("message_ID"),
                                     extra=url_chk_res[1])
                    else:
                        LOGGER.debug("check_url_validity failed.")
                    raise ToolExit
        except Exception as err:  # noqa. pylint: disable=bare-except
            LOGGER.debug(f"Exception @ get_helper_services_url: {str(err)}")
            raise err

    @staticmethod
    def check_url_validity(
        url_to_check: str,
        token: Optional[str],
        referer: Optional[str],
        portal_helper_services_key: str
    ) -> Tuple:
        """Check whether url is valid by sending a request."""
        params = {"f": "json", "token": token}
        try:
            if "GPServer" in url_to_check:
                url_to_check = "{}GPServer".format(url_to_check[:url_to_check.find("GPServer")])
            resp = AOLUtils.mk_post_request(url_to_check, data=params,
                                            verify=False,
                                            headers={'referer': referer})

            if "error" in resp:
                code = resp["error"].get("code")
                if code == 403:
                    msg_extra = {"message_ID": 100148,
                                 "serviceName": portal_helper_services_key}
                    return (False, msg_extra)
                else:
                    msg = resp["error"].get("message")
                    msg_extra = {"message_ID": 100149,
                                 "serviceName": portal_helper_services_key,
                                 "cause": msg}
                    return (False, msg_extra)
            else:
                return (True, None)
        except Exception as err:  # noqa. pylint: disable=broad-except
            LOGGER.debug(f"check_url_validity failed due to: {str(err)}")
            msg_extra = {"message_ID": 100149,
                         "serviceName": portal_helper_services_key,
                         "cause": str(err)}
            return (False, msg_extra)

    @staticmethod
    def convert_rest_url(
        url: str
    ) -> NamedTuple:
        """Unpack the rest url to a named tuple with information that can be directly used by the service.

        Args:
            url: a string with the REST url for the remote toolbox.
        Returns:
            A four value tuple from the rest url to the GP service. First value is a string that can be used with
            arcpy.gp.AddToolbox function. Second value is the GP service name. Third value is the task name within
            the GP service. The last value is the server URL.
        Raises:
            No exceptions.

        """
        gp_service = collections.namedtuple("GPService", ("toolbox", "serviceName", "taskName", "server"))

        url_split = list(urlsplit(url))
        path = url_split[2].split("/")
        path_lower = [p.lower() for p in path]
        index_of_rest = path_lower.index("rest")
        index_of_gpserver = path_lower.index("gpserver")
        url_split[2] = "/".join(path[0:index_of_rest] + ["services"])
        # Shift by 2 as we do not want to include rest/services in service name
        service_name = "/".join(path[index_of_rest + 2: index_of_gpserver])
        gp_service.toolbox = "{0};{1}".format(urlunsplit(url_split), service_name)  # type: ignore
        gp_service.serviceName = service_name  # type: ignore
        gp_service.taskName = "" if path_lower[-1] == "gpserver" else path[-1]  # type: ignore
        gp_service.server = "{0}://{1}".format(url_split[0], url_split[1])  # type: ignore
        return gp_service  # type: ignore

    @staticmethod
    def verify_url(url: str) -> bool:
        """Django url validation regex.

        Args:
            url: a string represents the URL to verify.
        Returns:
            True if the url is valid and False otherwise.
        Raises:
            No exception.

        """
        regex = re.compile(
            r'^(?:http|ftp)s?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?][\S| ]+)$', re.IGNORECASE)

        if re.match(regex, url):
            return True
        else:
            return False

    @staticmethod
    def renew_remote_tbx_token(
        tbx: str
    ) -> Tuple:
        """Renew the token of a remote toolbox.

        Args:
            tbx (str): a remote toolbox (in the format of <gpservice.toolbox>;<token>;<referer>)

        Returns:
            Tuple: a two items tuple where the first item is the renew toolbox string and the
            second item is whether the renew complete successfully.
        """
        tbx_comp = tbx.split(";")
        if len(tbx_comp) != 4:
            # tbx should consist of 4 components with token. No need to renew
            # without token
            return (tbx, False)
        (tbx_url, tbx_service_name, tbx_token, tbx_referer) = tbx_comp
        if not tbx_token.startswith("token"):
            return (tbx, False)
        else:
            params = {"expiration": 720, "f": "json", "serverUrl": tbx_url}
            resp = PortalUtils.make_generic_sharing_request("generateToken", params)
            LOGGER.debug(f"generateToken response: {resp}")
            if resp:
                token = resp.get("token")
                if token:
                    tbx_token = f"token={token}"
                    return (f"{tbx_url};{tbx_service_name};{tbx_token};{tbx_referer}", True)
            return (tbx, False)

    @staticmethod
    def add_remote_tbx(
        tbx: str
    ):
        """load remote toolbox string as a gp toolbox

        Args:
            tbx (str): a string of the remote toolbox

        Raises:
            RuntimeError: if failed to load toolbox based on the tbx string.
        """
        try:
            arcpy.gp.addToolbox(tbx)
        except RuntimeError as err:
            # Regenerate the token
            if "Token-based authentication failure" in str(err):
                LOGGER.debug({str(err)})
                (tbx, updated) = RemoteToolboxUtils.renew_remote_tbx_token(tbx)
                if updated:
                    LOGGER.debug("Retry with renewed token.")
                    arcpy.gp.AddToolbox(tbx)
                    LOGGER.debug("Toolbox added successfully with the renewed token.")
                else:
                    raise err
            else:
                raise err
