"""Provides execution logic for GetTravelModes tool."""

import logging
import os
import json

import arcpy
import nat
import nast
from nast import time_exec


class GetTravelModes(nat.NATool):
    """Provides execution logic for GetTravelModes tool."""

    # Define instance attributes in slots primarily for faster attribute lookups
    __slots__ = ("supporting_files", "output_table", "default_travel_mode", "org_id")
    logger = logging.getLogger(__name__)  # logger used by the class

    def __init__(self, **kwargs):
        """Store names used in all methods."""
        super().__init__()
        # print parameter values when debugging
        if self.logger.level == logging.DEBUG:
            for param_name, param_value in kwargs.items():
                self.logger.debug("%s: %s, %s", param_name, type(param_value), param_value)

        # Store tool parameter values as instance names.
        self.supporting_files = dict(nast.NASolverTool.read_value_table(kwargs["supportingFiles"]))

        # Outputs created by the tool
        self.output_table = ""
        self.default_travel_mode = ""

        # Other instance attributes
        self.org_id = ""

    def _get_portal_travel_modes(self):
        """Get travel modes stored in the portal.

        Args:
            None
        Returns:
            A dictionary of travel modes stored in the portal. If travel modes are not stored in the portal, an empty
            dictionary is returned.
        Raises:
            nat.ToolExit is hostedgp cannot be imported or initialized.

        """
        try:
            import hostedgp  # Need to import conditionally. pylint:disable=import-outside-toplevel
            # Do not perform a tenant check as we might run this from a federated server that is not acting as a hosted
            # server (e.g AGOL servers). We are not using hostedgp to create hosted feature services. So tenant check is
            # not required.
            hgp = hostedgp.HostedGP(tenantCheck=False)
        except Exception as ex:
            self.logger.error("An error occured when using hostedgp")
            self.logger.debug("error function: %s, error message: %s", ex.func, ex.errmsg)  # pylint:disable=no-member
            raise nat.ToolExit from None
        try:
            # org_travel_modes_file = os.path.join(arcpy.env.scratchFolder,  # False positive. pylint:disable=no-member
            #                                      "travelmodes.json")
            # hgp.GetResourceAsFile("travelmodes.json", org_travel_modes_file)
            # with open(org_travel_modes_file, "rb") as org_tm_fp:
            #     travel_modes_resource_response = json.load(org_tm_fp)
            tm_resource_response = hgp.GenericSharingRequest(f"portals/{self.org_id}/resources/travelmodes.json",
                                                             {"f": "json"})
            if "error" in tm_resource_response:
                self.logger.debug("Travel modes are not stored in the portal.")
                self.logger.debug(tm_resource_response)
                return {}
            return tm_resource_response
        except Exception as ex:  # Need to fallback to network dataset travel modes. pylint:disable=broad-except
            self.logger.debug("Error when getting travel modes from the portal.")
            self.logger.debug(ex)
            return {}

    def _create_output_table(self, travel_modes_json, alt_travel_mode_names=None):
        """Store the supported travel modes in a geodatabase table."""
        if alt_travel_mode_names is None:
            alt_travel_mode_names = {}
        # Create an empty output table with appropriate fields
        self.output_table = arcpy.management.CreateTable("in_memory", "supportedTravelModes").getOutput(0)
        tm_field = "TravelMode"
        tm_name_field = "Name"
        tm_name_alt_field = "AltName"
        tm_id_field = "TravelModeId"
        arcpy.management.AddFields(self.output_table, [[tm_name_field, "TEXT", "Travel Mode Name", 255],
                                                       [tm_id_field, "TEXT", "Travel Mode Identifier", 50],
                                                       [tm_field, "TEXT", "Travel Mode Settings", 65536],
                                                       [tm_name_alt_field, "TEXT", "Alternate Travel Mode Name", 255]])

        # Write supported travel modes to the output table
        output_table_fields = (tm_name_field, tm_id_field, tm_field, tm_name_alt_field)
        with arcpy.da.InsertCursor(self.output_table, output_table_fields) as cursor:  # pylint:disable=no-member
            for tm_id in travel_modes_json:
                travel_mode = travel_modes_json[tm_id]
                travel_mode_name = travel_mode["name"]
                cursor.insertRow((travel_mode_name,
                                  tm_id,
                                  json.dumps(travel_mode),
                                  alt_travel_mode_names.get(tm_id, travel_mode_name)))

    @time_exec
    def execute(self):
        """Get the travel modes from the network dataset or stored in the portal."""
        # Get the paths to the required supporting files in the supporting files folder. Localized travel modes
        # file only exists for online. So set it to None in case it is not found.
        default_localized_travel_modes_file = self.supporting_files.get("localizedTravelModes", None)
        default_travel_modes_file = self.supporting_files.get("defaultTravelModes", None)
        if default_travel_modes_file is None:
            self.logger.error("", extra={
                "message_ID": 10061,
                "add_argument1": f"travel modes: {default_travel_modes_file}"
            })
            raise nat.ToolExit
        # Read the travel modes from the network dataset
        with open(default_travel_modes_file, "r", encoding="utf-8") as tm_fp:
            file_json = json.load(tm_fp)
            self.default_travel_mode = file_json.get("defaultTravelMode", "")
            nds_travel_modes = {nds_tm["id"]: nds_tm for nds_tm in file_json.get("supportedTravelModes", [])}

        # If not running in a server context such as when run in order to publish the tool as web tool, return the
        # network dataset travel modes
        if not arcpy.gp.IsRunningInServer():
            self._create_output_table(nds_travel_modes)
            return

        # Get the owning system URL for the server hosting the service
        owning_system_url = arcpy.GetActivePortalURL()
        # A server that is not federated with a portal will not have owning system url. Return network dataset
        # travel modes if a server is not federated.
        if not owning_system_url:
            self._create_output_table(nds_travel_modes)
            return

        # Return org specific travel modes
        culture = "en"
        try:
            portal_self_response = arcpy.GetPortalDescription(owning_system_url)
        except ValueError as ex:
            # On standalone servers, arcpy.GetActivePortalURL returns https://www.arcgis.com instead of None.
            if "www.arcgis.com" in str(ex):
                self.logger.debug("Returning travel modes from the network dataset")
                self._create_output_table(nds_travel_modes)
                return
            err_msg = f"Failed to get the description for portal {owning_system_url}"
            raise Exception(err_msg)  # Need to log nested err. pylint:disable=broad-exception-raised,raise-missing-from

        if "id" in portal_self_response:
            # OAuth and non-OAuth based user logins should have id property in portal self response
            self.org_id = portal_self_response.get("id", "")
            # Get the language defined for the user
            if "user" in portal_self_response:
                culture = portal_self_response["user"].get("culture", "en")
                # Some users in orgs can have null cultures. Use the culture defined for the org in such cases.
                if not culture:
                    culture = portal_self_response.get("culture", "en")
        elif "appInfo" in portal_self_response:
            # This block should be executed only when app logins are used
            # App logins do not support retrieving custom travel modes stored as org resource. So return a warning that
            # we are returning default travel modes
            warning_msg = ("Default travel modes are being returned since you are using app logins. "
                           "If you want to get the travel modes from your organization, use named user logins.")
            self.logger.warning(warning_msg)
            app_info = portal_self_response["appInfo"]
            self.org_id = app_info.get("orgId", "")
            # If appInfo does not have a culture, use default en culture
            culture = app_info.get("culture", "en")

        # Fail if we do not get org id since retrieving org based travel modes require org id
        if not self.org_id:
            self.logger.error("Failed to get organization Id")
            raise nat.ToolExit

        # If for some reason we cannot get the culture, use en
        if not culture:
            self.logger.warning("Unable to determine the locale for the user. Returning travel modes for 'en' locale.")
            culture = "en"

        # Get the default travel mode name from asyncRoute helper service. We could have used any helper service.
        helper_services = portal_self_response["helperServices"]
        if "asyncRoute" in helper_services:
            async_route = helper_services["asyncRoute"]
            if "defaultTravelMode" in async_route:
                self.default_travel_mode = async_route.get("defaultTravelMode", self.default_travel_mode)

        # Get a file resource with key travelmodes.json from org resources. If the resource exists, return all
        # travel modes from the resource. Otherwise return default travel modes.
        portal_travel_modes = self._get_portal_travel_modes()
        if portal_travel_modes:
            self._create_output_table(portal_travel_modes)
            return

        # Return network dataset travel modes with localization names and description if localized travel mode file
        # exists
        travel_modes_all_lang = {}
        alt_travel_mode_names = {}
        localized_travel_modes = {}
        if default_localized_travel_modes_file and os.path.exists(default_localized_travel_modes_file):
            with open(default_localized_travel_modes_file, "r", encoding="utf-8") as tml_fp:
                travel_modes_all_lang = json.load(tml_fp)
        # Return localized travel mode names and descriptions based on the user language
        # Check if we can also partially match a language code. For example match "es-mx" to "es"
        culture = culture.lower()
        if culture in travel_modes_all_lang:
            localized_travel_modes = travel_modes_all_lang[culture]
        else:
            partial_culture = culture.split("-")[0]
            localized_travel_modes = travel_modes_all_lang.get(partial_culture, {})
        for travel_mode_id in localized_travel_modes:
            travel_mode = nds_travel_modes[travel_mode_id]
            alt_travel_mode_names[travel_mode_id] = travel_mode.get("name", "")
            travel_mode.update(localized_travel_modes[travel_mode_id])
        self._create_output_table(nds_travel_modes, alt_travel_mode_names)
