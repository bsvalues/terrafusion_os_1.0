"""GP tool interface to call PublishRoutingServices."""

import json
import logging
import os
import traceback
import time
from pathlib import Path

import requests
import urllib3
import arcpy
import prs
import nast

nast.FOR_PUBLISHING = True
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

LOG_LEVEL = logging.DEBUG


class GPMessageHandler(logging.Handler):
    """Allows GP messages to be written as part of the logging module."""

    def __init__(self):
        """Set the logger."""
        logging.Handler.__init__(self)

    def emit(self, record):
        """Log messages using GP message functions based on the log levels.

        Args:
            record - An instance of log record object passed by the logger.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        # Select a GP message function based on the log level
        msg_function = arcpy.AddMessage
        msg_type = "INFORMATIVE"
        if record.levelno in (logging.WARN, ):
            msg_function = arcpy.AddWarning
            msg_type = "WARNING"
        elif record.levelno in (logging.CRITICAL, logging.FATAL, logging.ERROR):
            msg_function = arcpy.AddError
            msg_type = "ERROR"
        # If we get kwargs, use arcpy.AddIDMessage
        if hasattr(record, "message_ID"):
            msg_args = []
            if hasattr(record, "add_argument1"):
                msg_args.append(record.add_argument1)
            if hasattr(record, "add_argument2"):
                msg_args.append(record.add_argument2)
            arcpy.AddIDMessage(msg_type, record.message_ID, *msg_args)
        else:
            # Add the message using standard GP message function
            msg_function(record.getMessage())
        # Add any exeception info
        if record.exc_info:
            msgs = traceback.format_exception(*record.exc_info)
            for msg in msgs:
                if msg:
                    msg_function(msg)


class GPMessageJSONHandler(logging.Handler):
    """Allows GP messages to be written to a dict as part of the logging module."""

    def __init__(self):
        """Set the logger."""
        logging.Handler.__init__(self)
        self._json_messages = []

    def emit(self, record):
        """Log messages using GP message functions based on the log levels.

        Args:
            record - An instance of log record object passed by the logger.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        # Select a GP message function based on the log level
        msg_type = "esriJobMessageTypeInformative"
        msg_code = 0
        msg_description = record.getMessage()
        msg_parameters = {}
        if record.levelno in (logging.WARN, ):
            msg_type = "esriJobMessageTypeWarning"
        elif record.levelno in (logging.CRITICAL, logging.FATAL, logging.ERROR):
            msg_type = "esriJobMessageTypeError"
        # Check if we got message code
        if hasattr(record, "message_ID"):
            msg_code = record.message_ID
        # Check if got message parameters
        if hasattr(record, "add_argument1"):
            msg_parameters["argument1"] = record.add_argument1
        if hasattr(record, "add_argument2"):
            msg_parameters["argument2"] = record.add_argument2

        self._json_messages.append({
            "type": msg_type,
            "code": msg_code,
            "description": msg_description,
            "parameters": msg_parameters,
        })

        # Add any exeception info as "esriJobMessageTypeInformative" with code 0.
        if record.exc_info:
            msgs = traceback.format_exception(*record.exc_info)
            for msg in msgs:
                if msg:
                    self._json_messages.append({
                        "type": "esriJobMessageTypeInformative",
                        "code": 0,
                        "description": msg,
                    })

    def get_messages(self):
        """Return the messages and flush the internal list storing the messages."""
        msgs = list(self._json_messages)
        self._json_messages = []
        return msgs


class PRSGPTool:
    """Publish Routing Services GP tool."""

    OUTPUT_PARAM_INDEX = 6

    def __init__(self, **tool_params):
        """Set up names."""
        self.tool_params = tool_params
        self.prs_params = {}  # Parameters required to call core PublishRoutingServices tool.
        self.prs_tool = None  # instance of the prs.PublishRoutingServices that does all the main work.
        self.logger = self._setup_logger(LOG_LEVEL)
        self.token_info = None  # Dict containing "token" and "referer"
        self.network_dataset = ""  # Catalog path to the network dataset
        self.network_dataset_extents = ""  # Catalog path to the network dataset extents
        self.org_resource_file_name = "publishroutingservices_status.json"  # Stores tool execution messages
        self.org_resource_update_failed = False  # Keep track of org resource update failure
        self.job_start_time = None  # Keep track of when the job started executing

        server_props = json.loads(arcpy.gp.serverProperties())
        self.server_admin_url = server_props["adminURL"]  # URL used to make server admin API calls
        # Private URL of the owning system when ArcGIS Server is federated. None otherwise.
        self.owning_system_url = server_props.get("owningSystemPrivateURL", "")

    @staticmethod
    def _setup_logger(log_level=logging.INFO):
        """Configure and return the logger instance."""
        logger = logging.getLogger(__name__)
        logger.setLevel(log_level)
        # Add the GPMessageHandler GPMessageJSONHandler in case the logger is not initialized with one
        if not logger.hasHandlers():
            gp_msg_handler = GPMessageHandler()
            gp_msg_handler.setLevel(log_level)
            logger.addHandler(gp_msg_handler)
            gp_msg_json_handler = GPMessageJSONHandler()
            gp_msg_json_handler.setLevel(log_level)
            logger.addHandler(gp_msg_json_handler)
        return logger

    def _validate_inputs(self):
        """Return a terminating error if the input datasets do not exists."""
        if self.tool_params["network_dataset"] and self.tool_params["nd_extents"]:
            msg = "Only specify a value for networkDataset parameter or networkDatasetExtents parameter but not both."
            self.logger.error(msg, extra={
                "message_ID": 30258
            })
            raise SystemExit(1) from None

        # network_dataset and nd_extents value should be JSON string with "datastoreId" and "path" properties
        req_prop_names = {"datastoreId", "path"}
        dataset_msg = ("Invalid value for the %s parameter. "
                       "The value must be a JSON containing %s properties.")
        network_dataset_json = self.tool_params["network_dataset"]
        nd_extents_json = self.tool_params["nd_extents"]
        if network_dataset_json:
            try:
                network_dataset_json = json.loads(network_dataset_json)
            except json.JSONDecodeError:
                self.logger.error(dataset_msg, "networkDataset", " and ".join(req_prop_names), extra={
                    "message_ID": 30259,
                    "add_argument1": "networkDataset",
                    "add_argument2": ", ".join(req_prop_names)
                })
                raise SystemExit(1) from None
            if set(network_dataset_json.keys()) != req_prop_names:
                self.logger.error(dataset_msg, "networkDataset", " and ".join(req_prop_names), extra={
                    "message_ID": 30259,
                    "add_argument1": "networkDataset",
                    "add_argument2": ", ".join(req_prop_names)
                })
                raise SystemExit(1) from None
            self.network_dataset = self._get_dataset_catalog_path(network_dataset_json)
            if not arcpy.Exists(self.network_dataset):
                msg = "Network dataset '%s' does not exist within the data store."
                self.logger.error(msg, network_dataset_json["path"], extra={
                    "message_ID": 30260,
                    "add_argument1": network_dataset_json["path"]
                })
                raise SystemExit(1) from None

        if nd_extents_json:
            try:
                nd_extents_json = json.loads(nd_extents_json)
            except json.JSONDecodeError:
                self.logger.error(dataset_msg, "networkDatasetExtents", " and ".join(req_prop_names), extra={
                    "message_ID": 30259,
                    "add_argument1": "networkDatasetExtents",
                    "add_argument2": ", ".join(req_prop_names)
                })
                raise SystemExit(1) from None
            if set(nd_extents_json.keys()) != req_prop_names:
                self.logger.error(dataset_msg, "networkDatasetExtents", " and ".join(req_prop_names), extra={
                    "message_ID": 30259,
                    "add_argument1": "networkDatasetExtents",
                    "add_argument2": ", ".join(req_prop_names)
                })
                raise SystemExit(1) from None
            self.network_dataset_extents = self._get_dataset_catalog_path(nd_extents_json)
            if not arcpy.Exists(self.network_dataset_extents):
                msg = "Network dataset extents '%s' does not exist within the data store."
                self.logger.error(msg, nd_extents_json["path"], extra={
                    "message_ID": 30261,
                    "add_argument1": nd_extents_json["path"],
                })
                raise SystemExit(1) from None

        # for param_name in ("network_dataset", "nd_extents", "config_file"):
        #     param_value = self.tool_params[param_name]
        #     if param_value and not arcpy.Exists(param_value):
        #         self.logger.error("", extra={
        #             "message_ID": 30101,
        #             "add_argument1": param_value,
        #         })
        #         raise SystemExit(1)

    def _get_token(self):
        """Return the token and the referer of the user calling the tool or the token passed in as part of auth info.

        Returns:
            A dict containing the token and the referer.

        Raises:
            SystemExit is the token is not found.

        """
        token_props = {}
        # If we get token passed in as tool parameter, use it. Otherwise get the token of the signed in user.
        if "authentication_info" in self.tool_params:
            token_props = self.tool_params.pop("authentication_info")
            self.logger.debug("authentication_info: %s", token_props)
        if token_props:
            err_msg = "Invalid authentication info '%s'. The value must be a JSON containing 'token' property"
            try:
                token_props = json.loads(token_props)
            except Exception:
                self.logger.error(err_msg, token_props, extra={
                    "message_ID": 30320,
                    "add_argument1": token_props,
                })
                raise SystemExit(1) from None
            if not token_props.get("token", ""):
                self.logger.error(err_msg, token_props, extra={
                    "message_ID": 30320,
                    "add_argument1": token_props,
                })
                raise SystemExit(1) from None
        else:
            token_props = json.loads(arcpy.gp.serverRequestProperties())
        if not token_props.get("token", ""):
            self.logger.error("Failed to get the token.", extra={
                "message_ID": 30262
            })
            raise SystemExit(1) from None
        return token_props

    def _http_post(self, url, data=None, token_info=None):
        """Make an HTTP post request and return the JSON response.

        Args:
            url: The full URL.
            data: A dict of request parameters. The method adds f=json and token parameters before
                  submitting the request.
            token_info: A dict containing "token" and "referer" and optionally "serverKey".

        Returns:
            The JSON response as a dict.

        """
        if data is None:
            data = {}
        if token_info is None:
            token_info = self.token_info
        data["f"] = "json"
        data["token"] = token_info["token"]
        token_referer = token_info.get("referer", "")
        server_key = token_info.get("serverKey", "")
        request_headers = {}
        if token_referer:
            request_headers["Referer"] = token_referer
        if server_key:
            request_headers["serverKey"] = server_key

        response = requests.post(url, verify=False, data=data, headers=request_headers)
        return response.json()

    def _get_server_info(self):
        """Determine information about ArcGIS Server site.

        This methods sets the following options for prs_params
            user_name, password, server_name, portal_name

        """
        admin_info_url = f"{self.server_admin_url}/info"
        info_response = self._http_post(admin_info_url)
        if "error" in info_response or info_response.get("status", "") == "error":
            # try to get the token for the logged in user
            self.logger.debug("Response from %s", admin_info_url)
            self.logger.debug(info_response)
            self.logger.debug("Ignoring the authentication_info because it contains an expired token")
            self.logger.debug("Using signed in user's token")
            self.token_info = self._get_token()
            info_response = self._http_post(admin_info_url)
            if "error" in info_response or info_response.get("status", "") == "error":
                error_code = info_response.get("code", -1)
                if error_code == 498:
                    msg = "The token has expired. Use a token that is valid for at least %s minutes."
                    self.logger.debug("Response from %s", admin_info_url)
                    self.logger.debug(info_response)
                    self.logger.error(msg, prs.agsadmin.AdminDirectory.MIN_TOKEN_VALIDITY,
                                      extra={
                                          "message_ID": 30321,
                                          "add_argument1": prs.agsadmin.AdminDirectory.MIN_TOKEN_VALIDITY,
                                          }
                                      )
                    raise SystemExit(1) from None
        logged_in_user = info_response.get("loggedInUser", "")
        username = logged_in_user.split("::")[logged_in_user.count("::") * -1]
        self.prs_params["user_name"] = username
        if not username:
            self.logger.debug("Response from %s", admin_info_url)
            self.logger.debug(info_response)
            self.logger.error("Failed to get the logged in user.", extra={
                "message_ID": 30263
            })
            raise SystemExit(1) from None

        self.prs_params["password"] = self.token_info
        # Set server_name and portal_name to be private URLs
        self.prs_params["server_name"] = os.path.dirname(self.server_admin_url)
        self.prs_params["portal_name"] = self.owning_system_url

    def _get_dataset_catalog_path(self, dataset_json):
        """Determine the catalog path to a dataset from it's connection properties in the data store.

        Args:
            dataset_json: A python dict containing the connection properties for the dataset.

        Returns:
            The catalog path to the dataset.

        Raises:
            SystemExit is datastoreId from dataset_json does not exist.

        """
        ds_item = None
        ds_id = dataset_json["datastoreId"]
        url = f"{self.server_admin_url}/data/findItems"
        for ds_type in ("fileShares", "enterpriseDatabases"):
            ds_items = self._http_post(url, data={"ancestorPath": f"/{ds_type}"}).get("items", [])
            for item in ds_items:
                if item["id"] == ds_id or item["path"] == f"/{ds_type}/{ds_id}":
                    ds_item = item
                    break
            if ds_item:
                break
        if ds_item is None:
            self.logger.error("Invalid data store id: %s", ds_id, extra={
                "message_ID": 30264,
                "add_argument1": ds_id
            })
            raise SystemExit(1) from None

        if ds_item["type"] == "folder":
            catalog_path = Path(ds_item["info"]["path"]).joinpath(dataset_json["path"].lstrip("/"))
            return str(catalog_path)

        dataset_parts = dataset_json["path"].lstrip("/").split("/")
        if len(dataset_parts) != 2:
            msg = ("Invalid path '%s' for the network dataset as it does not contain a feature dataset name and a "
                   "network dataset name.")
            self.logger.error(msg, dataset_json["path"], extra={
                "message_ID": 30265,
                "add_argument1": dataset_json["path"]
            })
            raise SystemExit(1) from None

        return ("CIMDATA=<CIMFeatureDatasetDataConnection xsi:type='typens:CIMFeatureDatasetDataConnection' "
                "xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xs='http://www.w3.org/2001/XMLSchema' "
                "xmlns:typens='http://www.esri.com/schemas/ArcGIS/3.0.0'>"
                f"<FeatureDataset>{dataset_parts[0]}</FeatureDataset>"
                f"<WorkspaceConnectionString>{ds_item['info']['connectionString']}</WorkspaceConnectionString>"
                f"<WorkspaceFactory>SDE</WorkspaceFactory><Dataset>{dataset_parts[1]}</Dataset>"
                "<DatasetType>esriDTNetworkDataset</DatasetType></CIMFeatureDatasetDataConnection>")

    def execute(self):
        """Tool execution logic."""
        self.token_info = self._get_token()
        self._get_server_info()
        self._validate_inputs()
        for param, value in self.tool_params.items():
            self.logger.debug("%s: %s", param, value)

        self.prs_params["service_definition_folder"] = arcpy.env.scratchFolder  # False +ve. pylint:disable=no-member
        self.prs_params.update(self.tool_params)
        self.prs_params["network_dataset"] = self.network_dataset
        self.prs_params["nd_extents"] = self.network_dataset_extents
        # Only required to populate routingServicesSource in PRS core
        if self.tool_params["network_dataset"]:
            self.prs_params["nd_datastore"] = json.loads(self.tool_params["network_dataset"])
        elif self.tool_params["nd_extents"]:
            self.prs_params["nd_datastore"] = json.loads(self.tool_params["nd_extents"])

        prs.LOGGER = self.logger
        # Set the job status to executing in the org resource since we are starting a new tool execution. While the
        # tool is executing, we also do not want to have the org resource with messages from previous execution.
        self.job_start_time = int(time.time() * 1000)
        self.update_org_resource("esriJobExecuting")

        # Call core execution logic
        try:
            self.prs_tool = prs.PublishRoutingServices(**self.prs_params)
            self.prs_tool.execute()
            self.prs_tool.cleanup()
            arcpy.SetParameterAsText(self.OUTPUT_PARAM_INDEX, json.dumps(self.prs_tool.published_services))
        except arcpy.ExecuteError as err:
            if not str(err).isnumeric():
                self.logger.error("A geoprocessing error occurred during tool execution.", extra={
                    "message_ID": 30206,
                })
                self.logger.error(err)
                self.logger.debug("Error details.", exc_info=True)
            raise SystemExit(1) from None
        except Exception:  # pylint: disable=broad-except
            self.logger.error("An unexpected error occurred during tool execution.", extra={
                "message_ID": 30206,
            })
            self.logger.debug("Error details.", exc_info=True)
            raise SystemExit(1) from None

    def update_org_resource(self, job_status="esriJobExecuting"):
        """Write the job status and the tool execution GP messages as portal org resource.

        Args:
           job_status: One of 'esriJobExecuting', 'esriJobFailed', 'esriJobSucceeded'.

        """
        if not self.owning_system_url:
            return
        if self.org_resource_update_failed:
            return

        # Do not use self.logger in this method since we don't want those messages to be in org resource file.
        messages = []
        job_end_time = None
        if job_status != "esriJobExecuting":
            for log_handler in self.logger.handlers:
                if hasattr(log_handler, "_json_messages"):
                    messages = log_handler.get_messages()
            job_end_time = int(time.time() * 1000)
        arcpy.AddMessage(f"Writing job status and messages to org resource {self.org_resource_file_name}")
        resource_content = {
            "jobStatus": job_status,
            "jobStartTime": self.job_start_time,
            "jobEndTime": job_end_time,
            "messages": messages,
        }
        if self.prs_tool and self.prs_tool.ags_admin_dir and self.prs_tool.ags_admin_dir.token:
            # Use any renewed token if available
            token_info = {
                "token": self.prs_tool.ags_admin_dir.token,
                "referer": self.prs_tool.ags_admin_dir.token_referrer,
                "serverKey": self.prs_tool.ags_admin_dir.common_headers.get("serverKey", ""),
            }
        else:
            # use the signed in user's token which should happen only when prs web tool fails its validation checks.
            # or when we are updating the job status to esriJobExecuting. Both these calls shouldnot fail due to
            # token expiry.
            token_info = json.loads(arcpy.gp.serverRequestProperties())
        request_params = {
            "access": "org",
            "key": self.org_resource_file_name,
            "text": json.dumps(resource_content)
        }
        add_resource_response = self._http_post(f"{self.owning_system_url}/sharing/rest/portals/self/addResource",
                                                request_params, token_info)
        if "error" in add_resource_response:
            self.org_resource_update_failed = True
            arcpy.AddMessage(f"Response from addResource call: {add_resource_response}")
            arcpy.AddError("Failed to update job status and messages to org resource.")
            raise SystemExit(1)


def main():
    """Program execution logic."""
    config_file = arcpy.GetParameterAsText(4)
    if not config_file:
        config_file = str(Path(__file__).parent.joinpath("publishroutingservices.json"))
    tool_params = {
        "network_dataset": arcpy.GetParameterAsText(0),
        "nd_extents": arcpy.GetParameterAsText(1),
        "service_folder": arcpy.GetParameterAsText(2),
        "solver_types": arcpy.GetParameter(3),
        "config_file": config_file,
        "authentication_info": arcpy.GetParameterAsText(5),
    }
    try:
        prs_gp_tool = PRSGPTool(**tool_params)
        prs_gp_tool.execute()
        prs_gp_tool_status = "esriJobSucceeded"
    except SystemExit:
        prs_gp_tool_status = "esriJobFailed"
    finally:
        prs_gp_tool.update_org_resource(prs_gp_tool_status)


if __name__ == "__main__":
    main()
