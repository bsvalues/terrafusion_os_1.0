"""Provides execution logic for GetToolInfo tool."""

import logging
import os
import json
import arcpy

import nat
from nast import time_exec


class GetToolInfo(nat.NATool):
    """Provides execution logic for GetToolInfo tool."""

    # Define instance attributes in slots primarily for faster attribute lookups
    __slots__ = ("tool_info_file", "service_name", "tool_name", "tool_info", "include_network_source_info")
    logger = logging.getLogger(__name__)  # logger used by the class

    def __init__(self, **kwargs):
        """Store names used in all methods."""
        super().__init__()
        # print parameter values when debugging
        if self.logger.level == logging.DEBUG:
            for param_name, param_value in kwargs.items():
                self.logger.debug("%s: %s, %s", param_name, type(param_value), param_value)

        # Store tool parameter values as instance names.
        self.tool_info_file = kwargs["toolInfoFile"]
        self.service_name = kwargs["serviceName"]
        self.tool_name = kwargs["toolName"]
        self.include_network_source_info = kwargs["includeNetworkSourceInfo"]

        # Outputs created by the tool
        self.tool_info = {}

    @time_exec
    def execute(self):
        """Get the service limits and info about the network dataset."""
        if not os.path.exists(self.tool_info_file):
            self.logger.error("", extra={"message_ID": 10061, "add_argument1": self.tool_info_file})
            raise nat.ToolExit

        with open(self.tool_info_file, "r", encoding="utf-8") as ti_fp:
            tool_info_json = json.load(ti_fp)
        network_dataset_props = tool_info_json["networkDataset"]

        # Do not include supported travel modes as we have a separate tool to get travel modes
        if "supportedTravelModes" in network_dataset_props:
            network_dataset_props.pop("supportedTravelModes")

        # Include networkSources only when asked for
        if not self.include_network_source_info and "networkSources" in network_dataset_props:
            network_dataset_props.pop("networkSources")

        is_portal = True
        owning_system_url = arcpy.GetActivePortalURL()
        if owning_system_url.endswith(".arcgis.com"):
            is_portal = False
        service_limits = tool_info_json["serviceLimits"][self.service_name]
        if self.tool_name not in service_limits:
            self.logger.error("", extra={
                "message_ID": 30101, "add_argument1": "Tool Name"})
            raise nat.ToolExit from None
        tool_info = {
            "networkDataset": network_dataset_props,
            "serviceLimits": service_limits[self.tool_name],
            "isPortal": is_portal,
        }
        self.tool_info = json.dumps(tool_info, ensure_ascii=False, sort_keys=True)
