"""Module to work with REST API to manage ArcGIS Server site."""

import json
import logging
import time
import urllib
import os

import requests
import arcpy


# Module logger
LOGGER = logging.getLogger(__name__)
LOGGER.addHandler(logging.NullHandler())


class AdminDirectory:
    """Performs REST API calls for administering ArcGIS Server."""

    logger = LOGGER  # Logger used by the class instance.
    non_sd_props = ("frameworkProperties", "reusejobdir")  # service properties that cannot be set in the SD
    MIN_TOKEN_VALIDITY = 120  # In minutes. Setting 120 since the default OAuth2 token is valid for 120 minutes.
    MAX_TOKEN_VALIDITY = 1440  # In minutes. The validity for any new or renewed tokens.

    def __init__(self, server_url, username, password, portal_url=None, ignore_ssl_errors=True):
        """Set up names that are commonly used when making REST API calls.

        Args:
            server_url: The URL for the server including the web-adaptor name. For example,
                         https://machine.domain.com:6443/arcgis
            username: The username of the user used to manage the ArcGIS Server site.
            password: The password for the user specified as part of the username argument.
            portal_url: The url of the owning system to which your ArcGIS Server site federates with. Pass None if your
                        ArcGIS Server site is not federated.
            ignore_ssl_errors: A boolean indicating if SSL errors should be ignored when making REST API calls.

        Raises:
            arcpy.ExecuteError if
                - username, password, or server_url invalid
                - portal_url is not specified for a federated server

        """
        self.request_url = None  # URL of the request that was last executed
        self.response_json = None  # Response as JSON from the request that was last executed
        self.error_code = -1  # Store error code from a JSON response
        self.error_reason = ""  # Store the error messages from a JSON response
        self.common_query_parameters = {  # query parameters required by each request
            "f": "json",
        }
        self.server_version = ""  # fullVersion from /rest/info of server.
        self.common_headers = {}  # Headers common to all requests
        self.portal_properties = {}  # portalProperties from /admin/security/config
        self.portal_self = {}
        self._is_mms = None  # Is multi-machine site
        # Disable requests warnings when ignoring ssl errors
        if ignore_ssl_errors:
            from requests.packages.urllib3.exceptions import InsecureRequestWarning  # pylint:disable=import-error
            requests.packages.urllib3.disable_warnings(InsecureRequestWarning)  # False +ve. pylint:disable=no-member

        # Store constructor arguments as instance attributes
        self.server_url = server_url
        self.root_url = "{}/admin".format(server_url)
        self.username = username
        self.password = password
        self.portal_url = portal_url
        self.ignore_ssl_errors = ignore_ssl_errors

        # Get the admin token
        self.token = ""
        self.token_referrer = ""
        self.token_validity = 0  # milliseconds since epoch for which the token is valid.
        self._get_admin_token()
        self.common_query_parameters["token"] = self.token
        self._update_common_headers()

    def _update_common_headers(self):
        """Create headers that are used in all the requests."""
        self.common_headers["Referer"] = self.token_referrer
        portal_secret_key = self.portal_properties.get("portalSecretKey", "")
        if portal_secret_key:
            self.common_headers["serverKey"] = portal_secret_key
        else:
            # Get serverKey from the server's security config
            try:
                security_config = self.make_http_request(self.root_url + "/security/config")
                portal_secret_key = security_config.get("portalProperties", {}).get("portalSecretKey", "")
                if portal_secret_key:
                    self.common_headers["serverKey"] = portal_secret_key
            except Exception:
                # It is ok if we don't pass serverKey as a request header if we cannot retrieve it since serverKey
                # request header is really required only when publishing on a federated server that is not same
                # as the hosting server.
                msg = "Skip passing serverKey as the request header since there was an error while retrieving serverKey"
                self.logger.debug(msg)
                pass

    def _check_token_validity(self):
        """Check if the current token is valid for the minimum duration required by the tool."""
        if self.token_validity:
            token_validity = int(self.token_validity) / 1000
            token_validity_seconds = token_validity - time.time()
            self.logger.debug("Got a token that is valid untill: %s", time.asctime(time.localtime(token_validity)))
            # we might be here after some steps have been done. So let's assume it will take at most 2 minutes to
            # be here.
            if (token_validity_seconds) < (self.MIN_TOKEN_VALIDITY - 2) * 60:
                # only raising a warning and not an error since we might have instances where the entire tool takes
                # less than the MIN_TOKEN_VALIDITY
                msg = ("The token is valid for %s minutes and might expire before the tool execution completes. "
                       "Use a token that is valid for at least %s minutes.")
                self.logger.warning(msg, int(token_validity_seconds / 60), self.MIN_TOKEN_VALIDITY,
                                    extra={
                                        "message_ID": 30317,
                                        "add_argument1": int(token_validity_seconds / 60),
                                        "add_argument2": self.MIN_TOKEN_VALIDITY,
                                        }
                                    )

    def _renew_token(self, rest_info):
        """Renew a portal token to a long lived server token.

        Updates self.password with a longer lived server token if running on a federated server and if the intial
        self.password is a token (and not a password.)

        Args:
            rest_info: Response from the rest/info endpoint on the server.

        """
        owning_system_url = rest_info.get("owningSystemUrl", "")
        if not owning_system_url:
            return

        # We are assuming that _renew_token is called only when self.password is a token
        # We are also assuming that self.portal_url is set to owningSystemPrivateURL as want to bypass any web tier
        # authentication when calling generateToken. Bypassing web tier authentication is the reason we are not using
        # rest_info["authInfo"]["tokenServicesUrl"] as the token_url
        token_url = f"{self.portal_url}/sharing/rest/generateToken"
        security_config = self.make_http_request(self.root_url + "/security/config", {"token": self.password["token"]})
        self.portal_properties = security_config.get("portalProperties", {})
        renew_token_params = {
            "serverURL": self.portal_properties.get("serverUrl", self.server_url),
            "token": self.password["token"],
            "expiration": self.MAX_TOKEN_VALIDITY,
            "f": "json"
        }
        renew_token_headers = {}
        portal_secret_key = self.portal_properties.get("portalSecretKey", "")
        if portal_secret_key:
            renew_token_headers["serverKey"] = portal_secret_key
        # Currently the renewed token does not obey the maxTokenExpirationMinutes property set on
        # sharing/rest/portals/self and will always return a token that is valid for MAX_TOKEN_VALIDITY
        # TODO: If this is determined to be a bug, then we need to change the approach and fail early if we know the
        # renewed token is not valid for MIN_TOKEN_VALIDITY.
        try:
            self.logger.debug("Renewing the portal token using %s to a new server token that is valid for %s minutes",
                              token_url, self.MAX_TOKEN_VALIDITY)
            token_response = requests.post(token_url, data=renew_token_params, verify=False, allow_redirects=True,
                                           headers=renew_token_headers)
        except Exception:
            self.logger.error("Failed to renew the portal token",
                              extra={"message_ID": 30327})
            self.logger.debug("Error details", exc_info=True)
            raise arcpy.ExecuteError("30327") from None
        token_response = token_response.json()
        if "error" in token_response:
            self.logger.error("Failed to renew the portal token",
                              extra={"message_ID": 30327})
            self.logger.debug("Renew token params: %s", renew_token_params)
            self.logger.debug("Renew token headers: %s", renew_token_headers)
            self.logger.debug("Renew token response: %s", token_response)
            raise arcpy.ExecuteError("30327") from None

        self.password.update(token_response)

    def _get_admin_token(self):
        """Get an admin token that can be used to manage the site."""
        # Local names used in this method
        token_url = ""
        owning_system_url = ""
        err_invalid_cred = "Invalid User Name or Password"
        err_portal_name_req = ("A value for portal name (option -P or --portal-name) is required since your ArcGIS "
                               "Server is federated.")

        # Get the owning system url to determine if the server is federated
        rest_info_url = "{0}/rest/info".format(self.server_url)
        try:
            # Fail if we cannot get rest info response
            rest_info_response = self.make_http_request(rest_info_url)
            self.server_version = rest_info_response.get("fullVersion", "")
            # We only want to include Major.Minor.Update in the server version.
            if self.server_version:
                self.server_version = ".".join(self.server_version.split(".")[0:3])
            self.logger.debug("server version: %s", self.server_version)
        except Exception:  # Need to fail for all exceptions. pylint:disable=broad-except
            self.logger.error("An error occured when trying to fetch %s. Check if ArcGIS Server is running",
                              rest_info_url)
            self.logger.debug("Error details", exc_info=True)
            raise arcpy.ExecuteError from None

        # if the password itself is a valid admin token, use that as a token
        if isinstance(self.password, dict) and "token" in self.password:
            self._renew_token(rest_info_response)
            self.token = self.password["token"]
            self.token_referrer = self.password.get("referer", "")
            self.token_validity = self.password.get("expires", 0)
            self._check_token_validity()
            return
        owning_system_url = rest_info_response.get("owningSystemUrl", "")
        if owning_system_url:
            # Make sure portal_name is specified and set it as owning system url
            if not self.portal_url:
                self.logger.error(err_portal_name_req)
                raise arcpy.ExecuteError from None
            # Get a portal token
            token_response = self._get_portal_token()
            site_admin_token = token_response.get("token", "")
            if not site_admin_token:
                self.logger.error(err_invalid_cred)
                self.logger.debug(json.dumps(token_response, indent=2))
                raise arcpy.ExecuteError from None
            # Store the portal self response
            self.logger.debug("Getting portal self")
            ps_url = f"{self.portal_url}/sharing/rest/portals/self"
            self.portal_self = self.make_http_request(ps_url)
        else:
            # Get a admin token as the server is not federated
            self.portal_url = ""
            token_url = "{0}/admin/generateToken".format(self.server_url)
            self.token_referrer = self.server_url
            token_params = {
                "username": self.username,
                "password": self.password,
                "client": "referer",
                "referer": self.token_referrer,
                "expiration": self.MAX_TOKEN_VALIDITY,
            }
            self.logger.debug("Getting a server token")
            token_response = self.make_http_request(token_url, token_params)
            site_admin_token = token_response.get("token", "")
            if not site_admin_token:
                self.logger.error(err_invalid_cred)
                self.logger.debug(json.dumps(token_response, indent=2))
                raise arcpy.ExecuteError from None

        self.token = site_admin_token
        self.token_validity = token_response.get("expires", 0)
        self._check_token_validity()

    def _get_portal_token(self):
        """Get a portal token and sets the self.owningSystemUrl accounting for redirects."""
        err_portal_token = "Failed to connect to the portal at %s. Check if Portal for ArcGIS is running."

        token_url = f"{self.portal_url}/sharing/rest/generateToken"
        # Token URL in a portal can have redirects
        try:
            token_response = requests.get(token_url, verify=False, allow_redirects=True)
        except Exception:
            self.logger.error(err_portal_token, self.portal_url)
            self.logger.debug("Error details", exc_info=True)
            raise arcpy.ExecuteError from None
        token_url = token_response.url
        self.portal_url = self.construct_url(token_url, "PORTAL")
        self.logger.debug("Updated owning system URL: %s", self.portal_url)
        self.token_referrer = self.portal_url
        token_params = {
            "username": self.username,
            "password": self.password,
            "client": "referer",
            "referer": self.token_referrer,
            "expiration": self.MAX_TOKEN_VALIDITY,
            "f": "json",
        }
        try:
            self.logger.debug("Getting a portal token from %s", token_url)
            token_response = requests.post(token_url, data=token_params, verify=False, allow_redirects=True)
        except Exception:
            self.logger.error(err_portal_token, self.portal_url)
            self.logger.debug("Error details", exc_info=True)
            raise arcpy.ExecuteError from None

        return token_response.json()

    def make_http_request(self, url, query_parameters=None, headers=None, timeout=None, files=None):
        """Make a POST HTTP request and return the JSON response as dictionary."""
        if not query_parameters:
            query_parameters = {}
        if not headers:
            headers = {}
        # Add f=json to query parameters
        query_parameters.update(self.common_query_parameters)
        # Convert any lists or dicts in query parameters to string so that requests.post can correctly pass them when
        # making REST API call.
        post_data = {}
        for param_name, param_value in query_parameters.items():
            if isinstance(param_value, (dict, list)):
                post_data[param_name] = json.dumps(param_value)
            else:
                post_data[param_name] = param_value

        # Add referrer to the headers
        headers.update(self.common_headers)
        verify = False if self.ignore_ssl_errors else True
        try:
            self.request_url = url
            response = requests.post(url, data=post_data, headers=headers, verify=verify, timeout=timeout,
                                     files=files)
            if response.status_code == 200:
                response_json = response.json()
                self.response_json = response_json
            else:
                raise HTTPError(url, response.status_code, response.reason)
        except Exception:
            self.logger.debug("An error occurred when making a web request to %s.", url, exc_info=True)
            raise
        # if "error" in response_json:
        #     self.log_response()
        # if "status" in response_json and response_json["status"] == "error":
        #     self.log_response()
        # Store code and reason or messages from the response
        self.error_code = response_json.get("code", -1)
        if "error" in response_json or ("status" in response_json and response_json["status"] == "error"):
            self.error_code = response_json.get("error", {}).get("code", -1)
            self.log_response()
            error_reason = []
            for key in ("reason", "messages"):
                if key in response_json:
                    value = response_json[key]
                    if isinstance(value, list):
                        error_reason.append(", ".join(value))
                    else:
                        error_reason.append(value)
            self.error_reason = ", ".join(error_reason)
        if self.error_code == 498:
            msg = "The token has expired. Use a token that is valid for at least %s minutes."
            self.logger.error(msg, self.MIN_TOKEN_VALIDITY,
                              extra={
                                  "message_ID": 30321,
                                  "add_argument1": self.MIN_TOKEN_VALIDITY,
                                }
                              )
            raise arcpy.ExecuteError("30321") from None

        return response_json

    def log_response(self):
        """Log the URL for the request and it's JSON response as debug messages."""
        self.logger.debug("Response obtained from the URL: %s", self.request_url)
        self.logger.debug(json.dumps(self.response_json, indent=2))

    def execute_async_gp_service(self, folder_name, service_name, task_name, task_params=None):
        """Execute async GP service and returns all the output values and messages from the excuted task.

        Args:
            folder_name - Name of the folder containing the GP service. If the service is at the root level, specify ""
            service_name - Name of the GP service
            task_name - Name of the task within the GP service to be executed. The name can contain spaces.
            task_params - A dictionary of parameters required to execute the task.

        Returns:
            A dictinory of output parameter name and its value along with messages from tool execution.

        """
        task_result = {}
        if folder_name:
            service_base_url = u"{}/rest/services/{}".format(self.server_url, folder_name)
        else:
            service_base_url = u"{}/rest/services".format(self.server_url)
        # Task name may be quoted such "My%20Task%20Name" or can be unquoted "My Task Name"
        task_name = urllib.parse.quote(urllib.parse.unquote(task_name))
        task_url = u"{}/{}/GPServer/{}".format(service_base_url, service_name, task_name)
        job_id = self.make_http_request(task_url + "/submitJob", task_params).get("jobId", "")
        job_url = u"{}/jobs/{}".format(task_url, job_id)
        while True:
            job_response = self.make_http_request(job_url)
            job_status = job_response.get("jobStatus", "")
            if job_status in ("esriJobSubmitted", "esriJobWaiting", "esriJobExecuting", "esriJobCancelling"):
                time.sleep(1)
            else:
                break
        task_result = dict(job_response)
        results = job_response.get("results", {})
        for output_param in results:
            output_param_url = results[output_param]["paramUrl"]
            output_param_url = u"{}/{}".format(job_url, output_param_url)
            output_param_value = self.make_http_request(output_param_url)
            task_result["results"][output_param] = output_param_value
        inputs = job_response.get("inputs", {})
        for input_param in inputs:
            input_param_url = inputs[input_param]["paramUrl"]
            input_param_url = u"{}/{}".format(job_url, input_param_url)
            input_param_value = self.make_http_request(input_param_url)
            task_result["inputs"][input_param] = input_param_value
        return task_result

    def service_status(self, folder_name, service_name, service_type):
        """Get the status information for a service.

        Args:
            folder_name - Name of the folder containing the service. If the service is at the root level, specify ""
            service_name - Name of the service
            service_type - The type of the service such as GPServer, MapServer, GeocodeServer

        Returns:
            A dictionary with the service status such as
            {
                "configuredState": "STOPPED",
                "realTimeState": "STARTED"
            }

        Raises:
            No specific exceptions other than the common ones raised when making REST API calls.

        """
        if folder_name:
            service_status_url = f"{self.root_url}/services/{folder_name}/{service_name}.{service_type}/status"
        else:
            service_status_url = f"{self.root_url}/services/{service_name}.{service_type}/status"

        return self.make_http_request(service_status_url)

    def exists(self, folder_name="", service_name="", service_type=""):
        """Determine if a service folder or a service already exists.

        Args:
            folder_name - Name of the folder containing the service. If the service is at the root level, specify ""
            service_name - Name of the service
            service_type - The type of the service such as GPServer, MapServer, GeocodeServer

        Returns:
            True if the service or the service folder exists.

        """
        exists_url = f"{self.root_url}/services/exists"
        request_params = {
            "folderName": folder_name,
            "serviceName": service_name,
            "type": service_type
        }
        response = self.make_http_request(exists_url, request_params)
        if "exists" in response:
            return response["exists"]
        else:
            raise HTTPError(exists_url, self.error_code, self.error_reason)

    def create_folder(self, folder_name, folder_description=""):
        """Create a folder for containing services.

        Returns:
            True if the folder was successfully created, False otherwise
        Raises:
            HTTPError if the create folder response does not have a "status" property.

        """
        create_folder_url = f"{self.root_url}/services/createFolder"
        req_params = {
            "folderName": folder_name,
            "description": folder_description
        }
        response = self.make_http_request(create_folder_url, req_params)
        if "status" in response:
            status = True if response["status"] == "success" else False
            return status
        else:
            raise HTTPError(create_folder_url, self.error_code, self.error_reason)

    def upload_item(self, item_file):
        """Upload a new item to the ArcGIS Server site.

        Args:
           item_file: Full path to the file that needs to be uploaded.

        Returns:
           The JSON response.

        Raises:
            HTTPError if the item fails to upload.

        """
        upload_url = f"{self.root_url}/uploads/upload"
        files = {
            "itemFile": open(item_file, "rb")
        }
        upload_response = self.make_http_request(upload_url, files=files)
        if "status" in upload_response:
            if upload_response["status"] == "success":
                return upload_response
            raise HTTPError(upload_url, self.error_code, self.error_reason)
        raise HTTPError(upload_url, self.error_code, self.error_reason)

    def publish_service_definition(self, sd_file, mod_svc_props=None):
        """Publish a service using the service definition file.

        Args:
            sd_file: Full path to the service definition file.
            mod_svc_props: A dict of service properties to update. If None, do not update any additional properties.

        Returns:
            A dictionary of service URLs if the service is successfully publised. Otherwise raise an exception

        Raises:
            arcpy.ExecuteError if the call to Publish Service Definition GP service is not successful.
            HTTPError if the call to upload service definition is not successful.

        """
        if mod_svc_props is None:
            mod_svc_props = {}
        # Upload the service definition file
        upload_response = self.upload_item(sd_file)
        item_info = upload_response["item"]
        item_id = item_info["itemID"]

        # Get the service configuration from the uploaded item
        service_config_url = f"{self.root_url}/uploads/{item_id}/serviceconfiguration.json"
        service_config = self.make_http_request(service_config_url)

        # modify folder name if required
        if "folderName" in mod_svc_props:
            service_config["folderName"] = mod_svc_props["folderName"]

        # Make sure the service is not started as soon as it published. We will start the service later to avoid
        # reaching the service startup timeout
        service_config_dict = service_config["service"]
        service_config_dict["configuredState"] = "STOPPED"
        for prop, value in mod_svc_props.items():
            if prop in service_config_dict:
                self.logger.debug("updating '%s' to %s", prop, value)
                if isinstance(service_config_dict[prop], dict):
                    service_config_dict[prop].update(value)
                else:
                    service_config_dict[prop] = value
            elif prop in self.non_sd_props:
                # reusejobdir should only be set for Synchronous GP services and reusejobdir can be passed as top-level
                # property in mod_svc_props even though it has to be set with "properties" object of the service config
                if prop in ("reusejobdir", ) and service_config_dict["type"] == "GPServer":
                    if service_config_dict["properties"]["executionType"] == "Synchronous":
                        self.logger.debug("updating '%s' to %s", prop, value)
                        service_config_dict["properties"][prop] = value
                else:
                    self.logger.debug("updating '%s' to %s", prop, value)
                    service_config_dict[prop] = value

        # Publish the service
        pubish_task_params = {
            "in_sdp_id": item_id,
            "in_config_overwrite": json.dumps(service_config)
        }
        publish_response = self.execute_async_gp_service("System", "PublishingTools", "Publish Service Definition",
                                                         pubish_task_params)

        # Raise an error if publishing failed
        if publish_response["jobStatus"] != "esriJobSucceeded":
            self.logger.debug(json.dumps(publish_response, indent=2))
            self.logger.error("Failed to publish the service definition, %s, as a service.", sd_file)
            raise arcpy.ExecuteError from None
        # Start the service
        svc_start_url = u"{}/services/{}/{}.{}/start".format(self.root_url, service_config["folderName"],
                                                             service_config_dict["serviceName"],
                                                             service_config_dict["type"])
        svc_start_response = self.make_http_request(svc_start_url)
        if "status" in svc_start_response:
            status = svc_start_response["status"]
            if status != "success":
                self.logger.warning("The following error occurred when starting %s service",
                                    os.path.dirname(svc_start_url))
                self.logger.warning(self.error_reason)
            else:
                self.logger.debug("Successfully published %s as a service", sd_file)
            return publish_response["results"]["out_results"]["value"]
        raise HTTPError(svc_start_url, self.error_code, self.error_reason)

    @property
    def is_multi_machine_site(self):
        """Return true if the ArcGIS Server site has multiple machines."""
        if self._is_mms is not None:
            return self._is_mms
        response = self.make_http_request(self.root_url + "/machines")
        self._is_mms = True if len(response["machines"]) > 1 else False
        return self._is_mms

    @staticmethod
    def construct_url(machine_name, machine_role="SERVER"):
        """Construct ArcGIS Server and enterprise portal URLs from a machine name.

        If the machine name is a URL, return it as is.

        Args:
            machine_name: The fully qualified domain name of the server or portal machine. The value can also be the
                          URL (that has the web adaptor name) for server or portal.
            machine_role: Specify whether the machine_name is for ArcGIS Server or enterprise portal. Valid values
                          are SERVER or PORTAL

        Returns:
            Returns the URL for the machine name.

        Raises:
            arcpy.ExecuteError when a url is specified as machine_name and it
                - Does not start with https
                - Does not include the web adaptor name.

        """
        url = ""
        parts = urllib.parse.urlsplit(machine_name)
        port = 6443 if machine_role == "SERVER" else 7443
        # If the name has no scheme, assume it is machine name
        if parts.scheme in ("http", "https"):
            if parts.scheme != "https":
                AdminDirectory.logger.error("The URL, %s does not use https.", machine_name)
                raise arcpy.ExecuteError from None
            url_path = parts.path.rstrip("/").lstrip("/")
            web_adaptor_name = url_path.split("/")[0]
            if not web_adaptor_name:
                AdminDirectory.logger.error("The URL, %s, does not include the web adaptor name.", machine_name)
                raise arcpy.ExecuteError from None
            url = "{}://{}/{}".format(parts.scheme, parts.netloc, web_adaptor_name)
        else:
            url = "https://{}:{}/arcgis".format(machine_name, port)
        return url


class HTTPError(Exception):
    """Exception raised when the response code from a HTTP request is not 200."""

    def __init__(self, url, code=None, reason=""):
        """Create members used in other methods."""
        super().__init__()
        self.code = code
        self.reason = reason
        self.url = url

    def __str__(self):
        """Provide more informative string representation for the object."""
        return f"An error occured when trying to access {self.url}. Code: {self.code}, Reason: {self.reason}"
