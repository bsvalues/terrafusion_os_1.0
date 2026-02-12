"""Provides Validation and Execution logic for Share As Route Layers tool."""

import logging
import os
import zipfile
import tempfile
import pickle
import shutil
import json

from requests.exceptions import SSLError
import arcgis
import arcpy
import nat

# Initialize the logger used by this module
LOGGER = logging.getLogger(__name__)


class ShareAsRouteLayers(nat.NATool):
    """Provides execution logic for Share As Route Layers tool."""

    ROUTE_DATA_ITEM_TYPE = "File Geodatabase"

    def __init__(self, route_data, summary, tags, route_name_prefix, portal_folder_name, share_with, groups):
        """Store tool parameter values as instance names."""
        self.route_data = route_data
        self.summary = summary
        self.tags = tags
        self.route_name_prefix = route_name_prefix
        self.portal_folder_name = portal_folder_name
        self.share_with = share_with
        self.groups = groups
        self.output_route_layers = None
        # print parameter values when debugging
        for param, value in vars(self).items():
            LOGGER.debug("%s: %s", param, value)

        # Define Other names
        # Store a list of datasets that should be deleted after tool execution.
        self.temp_datasets = []

    def _export_route_data(self):
        """Export route data from a network analysis layer.

        Args:
            No arguments.
        Returns:
            Full path to the route data file that is exported.
        Raises:
            ToolExit if route data cannot be exported.

        """
        # Get the travel mode applied to the NA layer.
        travel_mode = ""
        lyr_json = self.route_data.getDefinition("V3")
        # Do one more solver check in case this check was skipped in validation because the tool was in a model
        solver = lyr_json.solver["type"]
        if solver not in ["NARouteSolver", "NAClosestFacilitySolver", "NAVRPSolver", "NALastMileDeliverySolver"]:
            # Fail with message: "Network analysis layer is not supported."
            LOGGER.error("", extra={"message_ID": 30018})
            raise nat.ToolExit
        # Export route data requires a travel mode. Return an error if the NA layer does not have a travel mode
        travel_mode = lyr_json.solver["appliedTravelModeJSON"]
        if not travel_mode:
            # Fail with a message "The network analysis layer does not have a travel mode."
            LOGGER.error("", extra={"message_ID": 30199})
            raise nat.ToolExit
        # Export route data
        temp_folder = arcpy.env.scratchFolder  # pylint: disable=no-member
        route_data_file = tempfile.mktemp(dir=temp_folder) + ".zip"
        LOGGER.debug("Exporting route data for the network analysis layer")
        LOGGER.debug("Exporting route data to %s", route_data_file)

        try:
            arcpy.na._na.ExportRouteData(self.route_data, route_data_file,  # pylint: disable=protected-access
                                         travel_mode, True)
            self.temp_datasets.append(route_data_file)
            return route_data_file
        except arcpy.nax.DirectionsError:
            # Fail with a message "Directions are not enabled for this analysis layer."
            LOGGER.error("", extra={"message_ID": 30256})
            raise nat.ToolExit
        except arcpy.nax.VrpResultError:
            # Fail with a message "The analysis layer is not solved in the current session and route data cannot be saved."
            LOGGER.error("", extra={"message_ID": 30257})
            raise nat.ToolExit
        except ValueError:
            # Fail with a message "The network analysis layer is not solved."
            LOGGER.error("", extra={"message_ID": 30200})
            raise nat.ToolExit
        except RuntimeError:
            # Fail with a message "Failed to save route data"
            LOGGER.error("", extra={"message_ID": 30172})
            LOGGER.debug("Exception details:", exc_info=True)
            raise nat.ToolExit

    def execute(self):
        """Tool Execution logic.

        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            nat.ToolExit is raised whenever the method needs to quit. The caller must immidiately terminate the overall
            execution when handling the ToolExit exeception.

        """
        try:
            portal = arcgis.gis.GIS("PRO")
        except SSLError:
            # Enterprise portals with domain certificates are no longer trusted by ArcGIS Python API
            portal = arcgis.gis.GIS("PRO", verify_cert=False)
        signed_user = portal.users.me  # pylint: disable=no-member

        # Fail if portal version is before ArcGIS Enterprise 10.5.1 since the REST API required to create route layers
        # is not available. currentVersion property represents the sharing API version. The value for currentVersion
        # is returned as 5.1, 6.2, 9.4, 10.1 and so on. ArcGIS Enterprise 10.5.1 has sharing API version 5.1.
        # ArcGIS Online June 2017 release has sharing API version 5.2 and March 2022 ArcGIS Online release has
        # Sharing API version 10.1
        portal_version = portal.properties.currentVersion  # pylint: disable=no-member
        LOGGER.debug("Portal version: %s", portal_version)
        portal_major_version = portal_version.split(".")[0]
        if portal_major_version.isnumeric() and int(portal_major_version) < 5:
            # Fail with the error "Sharing analysis result as route layers is only supported with ArcGIS Enterprise
            # 10.5.1 or later."
            LOGGER.error("", extra={"message_ID": 30201})
            raise nat.ToolExit

        # Fail if the signed in user does not have access to the analysis URL. This can happen if the user is in a
        # custom role of type user.
        if "analysis" not in portal.properties.helperServices:  # pylint: disable=no-member
            # Fail with the message "The signed in user does not have the privilege to create content and perform
            # spatial analysis"
            LOGGER.error("", extra={"message_ID": 30202})
            raise nat.ToolExit

        # Fail if the signed-in user does not have portal:user:createItem or premium:user:spatialanalysis privilege
        required_privileges = set(("portal:user:createItem", "premium:user:spatialanalysis"))
        if not required_privileges.issubset(set(signed_user.privileges)):
            # Fail with the message "The signed in user does not have the privilege to create content and perform
            # spatial analysis"
            LOGGER.error("", extra={"message_ID": 30202})
            raise nat.ToolExit

        # Fail if the signed-in user in ArcGIS Enterprise does not have org_publisher or org_admin roles
        if portal.properties.isPortal:
            user_role = portal.properties.get("user", {}).get("role", "")
            if user_role and user_role not in ("org_admin", "org_publisher"):
                LOGGER.error("", extra={"message_ID": 30202})
                raise nat.ToolExit

        # Check if we first need to export route data from the network analysis layer
        if hasattr(self.route_data, "supports"):
            LOGGER.debug("Exporting route data")
            self.route_data = self._export_route_data()
        else:
            # Get the file path to route data
            if hasattr(self.route_data, "value"):
                self.route_data = self.route_data.value
                # Check if the file is a valid zip file
                if not zipfile.is_zipfile(self.route_data):
                    LOGGER.error("", extra={"message_ID": 814})
                    raise nat.ToolExit
                # make a copy of route data zip file with a unique name so that an item for the route data file
                # would never exists in the portal
                route_data_copy = (f"{tempfile.mktemp(dir=arcpy.env.scratchFolder)}-"  # pylint:disable=no-member
                                   f"{os.path.basename(self.route_data)}")
                shutil.copy2(self.route_data, route_data_copy)
                self.route_data = route_data_copy
                self.temp_datasets.append(route_data_copy)

        # Add the route data as a portal item
        # Raise an error if the item already exists
        portal_url = "https://" + portal.properties.portalHostname  # pylint: disable=no-member
        LOGGER.debug("Connected to portal: %s", portal_url)
        rd_file_name = os.path.splitext(os.path.basename(self.route_data))[0]
        if ToolValidator.check_item_exists(portal, rd_file_name, self.ROUTE_DATA_ITEM_TYPE):
            # Fail with the message 'A "%s" item with the name "%s" already exists in your portal.'
            LOGGER.error("", extra={
                "message_ID": 30203,
                "add_argument1": self.ROUTE_DATA_ITEM_TYPE,
                "add_argument2": rd_file_name
                })
            raise nat.ToolExit
        LOGGER.debug("Adding route data as an item to the portal")
        rd_item = portal.content.add({"type": self.ROUTE_DATA_ITEM_TYPE}, self.route_data)  # pylint: disable=no-member
        if not hasattr(rd_item, "itemid"):
            # Fail with message "Failed to add the route data as an item to your portal."
            LOGGER.error("", extra={"message_ID": 30204})
            raise nat.ToolExit
        rd_item_id = rd_item.itemid
        LOGGER.debug("Successfully added route data as a route data item (%s).", rd_item_id)
        LOGGER.debug("Creating route layer items from route data")
        # If the portal folder name is same as the username, pass empty value as folder name
        if self.portal_folder_name == signed_user.username:
            self.portal_folder_name = ""
        # Call CreateRouteLayers task
        try:
            crld_task = arcgis.features.manage_data.create_route_layers( # pylint: disable=too-many-arguments
                rd_item, True, self.tags, self.summary, self.route_name_prefix, self.portal_folder_name, future=True)
            route_lyr_items = crld_task.result()
        except Exception:  # pylint: disable=broad-except
            task_messages = crld_task.messages
            LOGGER.debug(f"Error running create_route_layers task. Task messages: {task_messages}")
            # Error creating route layer items from route data.
            LOGGER.error("", extra={"message_ID": 30371})
            # Collect a list of errors from the remote tool to raise
            error_msgs = []
            for msg in crld_task.messages:
                if "description" not in msg:
                    # Not a valid message we can decode
                    continue
                try:
                    msg_data = json.loads(msg["description"])
                except json.decoder.JSONDecodeError:
                    # Ignore messages that don't have a description in json format because typically they are something
                    # like this and not worth reporting to the user:
                    # {'type': 'esriJobMessageTypeError', 'description': 'Failed to execute (CreateRouteLayers).'}
                    # {'type': 'esriJobMessageTypeError', 'description': 'Failed.'}
                    continue
                # Find all error-type messages.  Also, special handling of limit error AO_100247, which may be a warning
                # due to https://devtopia.esri.com/ArcGISPro/Network-Analyst/issues/7243
                if msg["type"] == "esriJobMessageTypeError" or msg_data.get("messageCode") == "AO_100247":
                    error_msgs.append(msg_data["message"])
            for msg in error_msgs:
                LOGGER.error(msg)
            raise nat.ToolExit

        # Prepare the output dictionary as title: item_url
        item_url = "{}/home/item.html?id=".format(portal_url)
        self.output_route_layers = {item.title: item_url + item.itemid for item in route_lyr_items}
        # Share route layer items
        if self.share_with != "MYCONTENT":
            LOGGER.debug("Sharing route layers")
            sharing_options = {}
            if self.share_with == "EVERYBODY":
                sharing_options["everyone"] = True
            elif self.share_with == "MYORGANIZATION":
                sharing_options["org"] = True
            else:
                # Compute a list of group ids to share the items with
                groups_to_share = []
                # Get the group IDs for the specified groups
                if self.groups:
                    # Get a list of groups that the user belongs to
                    user_groups = {grp["title"].lower(): grp for grp in signed_user.groups}
                    if user_groups:
                        groups_to_share = [user_groups[grp_name.lower()]["id"] for grp_name in self.groups]
                sharing_options["groups"] = ",".join(groups_to_share)

            for item in route_lyr_items:
                item.share(**sharing_options)

        # Delete any temp datasets
        self.delete_intermediate_data()

    def delete_intermediate_data(self):
        """Delete any intermidiate data.

        This method can be called from an exception handler.
        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        if self.temp_datasets and LOGGER.level != logging.DEBUG:
            try:
                for dataset in self.temp_datasets:
                    os.remove(dataset)
            except Exception:  # pylint: disable=broad-except
                LOGGER.debug("Failed to delete temp dataset %s", dataset)
                LOGGER.debug("Exception details:", exc_info=True)


class ToolValidator(nat.NAToolValidator):
    """Class for validating parameter values and controlling the behavior of the tool's dialog."""

    @staticmethod
    def check_item_exists(portal, item_name, item_type):
        """Check if the route data item already exists.

        Args:
            portal: An instance of your portal.
            item_name: The name of the item.
            item_type: The type of the item such as "File Geodatabase".
        Returns:
            A boolean indicating the existence of the item
        Raises:
            Any Exception returned from the underlying API when trying to call the portal services.

        """
        items = portal.content.search(item_name, item_type)
        return bool(items)

    @staticmethod
    def check_analysis_input(analysis_param):
        """Check if the analysis input is a Network Analysis layer or a valid zip file with .zip extension.

        Args:
            analysis_param: A GP parameter object referencing a network analysis layer or a zip file.abs
        Returns:
            No return value.
        Raises:
            No exception.

        """
        analysis_input = analysis_param.value
        try:
            desc_input = arcpy.Describe(analysis_input)
            input_data_type = desc_input.dataType
            if input_data_type == "File":
                # Check if the file has a .zip extension
                file_path = desc_input.catalogPath
                if not os.path.splitext(file_path)[-1].lower() == ".zip":
                    analysis_param.setIDMessage("ERROR", 814)
            elif input_data_type == "NALayer":
                # Check for supported solvers
                solver_name = desc_input.solverName
                if solver_name not in (
                    "Route Solver",
                    "Closest Facility Solver",
                    "Vehicle Routing Problem Solver",
                    "Last Mile Delivery Solver"
                ):
                    analysis_param.setIDMessage("ERROR", 30018)
            elif input_data_type == "Layer":
                analysis_param.setIDMessage("ERROR", 30001)
            else:
                analysis_param.setIDMessage("ERROR", 840)
        except Exception:  # pylint:disable=broad-except
            # The checks above may fail if the parameter .value is returned as a GP Value Object instead of an expected
            # data type. This frequently happens when the tool is in a model.  In this case, just skip the validation
            # checks.  Checks for correct solver type or zip file format will happen on execution anyway.
            # See https://devtopia.esri.com/ArcGISPro/Network-Analyst/issues/8429
            pass

    @staticmethod
    def get_portal_user_info():
        """Return a list of folder names owned by the signed in user and a list of groups that the user belongs to.

        Args:
            No arguments.
        Returns:
            A dictionary that has a list of group names (in a key called groupNames) and a list of folder names
            (in a key called folderNames).
        Raises:
            - A RuntimeError exception is rasied if an issue occurs when trying to call the portal services.
            - A NotSignedInError exception is raised if not signed into any portal.

        """
        # check if the info about the user is already cached
        cache_file = nat.NATool.get_cache_file()
        if os.path.exists(cache_file):
            # read the portal user info from the cache file
            with open(cache_file, "rb") as cache_fp:
                portal_user_info = pickle.load(cache_fp)
        else:
            try:
                portal = arcgis.gis.GIS("PRO")
            except SSLError:
                portal = arcgis.gis.GIS("PRO", verify_cert=False)
            signed_user = portal.users.me  # pylint: disable=no-member
            # Add the username to the beginning of the list of folder names
            user_folders = [signed_user.username] + [fld["title"] for fld in signed_user.folders]
            user_groups = [grp["title"] for grp in signed_user.groups]
            portal_user_info = {
                "folderNames": user_folders,
                "groupNames": user_groups,
            }
            # Save the user info to a cache file
            with open(cache_file, "wb") as cache_fp:
                pickle.dump(portal_user_info, cache_fp)
        return portal_user_info

    def updateMessages(self):  # pylint: disable=invalid-name
        """Modify the messages created by internal validation for each tool parameter.

        This method is called after internal validation.
        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        analysis_param = self.params[0]
        portal_folder_param = self.params[4]

        # Fail if not signed in to any portal
        try:
            portal_user_info = ToolValidator.get_portal_user_info()  # pylint: disable=unused-variable
        except nat.NotSignedInError:
            portal_folder_param.setIDMessage("ERROR", 30189, arcpy.GetActivePortalURL())
        except Exception:  # pylint: disable=broad-except
            portal_folder_param.setIDMessage("ERROR", 30205, arcpy.GetActivePortalURL())

        # Check if the analysis param value is of the correct data type
        if analysis_param.valueAsText:
            ToolValidator.check_analysis_input(analysis_param)

        # Allow adding new portal folder names
        if portal_folder_param.hasError() and portal_folder_param.message.find("000800") > -1:
            portal_folder_param.clearMessage()

    def updateParameters(self):  # pylint: disable=invalid-name
        """Modify the values and properties of parameters before internal validation is performed.

        This method is called whenever a parameter has been changed.
        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        portal_folder_param = self.params[4]
        share_with_param = self.params[5]
        portal_groups_param = self.params[6]
        try:
            portal_user_info = ToolValidator.get_portal_user_info()
        except nat.NotSignedInError:
            return
        except Exception:  # pylint: disable=broad-except
            return

        portal_folder_param.filter.type = "ValueList"
        user_folders = portal_user_info["folderNames"]
        portal_folder_param.filter.list = user_folders
        # Set the default portal folder to be the root folder
        if not portal_folder_param.altered:
            portal_folder_param.value = user_folders[0]

        # Set the groups param only if share_with param is set to MYGROUPS
        if share_with_param.valueAsText == "MYGROUPS":
            portal_groups_param.enabled = True
            portal_groups_param.filter.type = "ValueList"
            portal_groups_param.filter.list = portal_user_info["groupNames"]
        else:
            portal_groups_param.enabled = False
