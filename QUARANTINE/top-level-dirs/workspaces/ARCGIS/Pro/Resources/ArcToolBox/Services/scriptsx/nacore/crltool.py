"""CreateRouteLayers tool implementation."""
# functions called implicitly in __init__. noqa. pylint: disable=attribute-defined-outside-init
# import internal modules. noqa. pylint: disable=import-error,no-name-in-module
import os
import json
import ast

import arcpy

from common import (PATool, ToolExit, LogUtils, LogExecutionTime, PAPrivileges, PortalUtils,
                    NoCostMixin, ModelBuilderMixin, AOLUtils)
from .crldexecutor import CRLDExecutor


LOGGER = LogUtils.setup_logger(__name__)


class CRLTool(ModelBuilderMixin, NoCostMixin, PATool):
    """Implementation of CreateRouteLayers tool."""

    def get_parameters(self):
        """Implement the abstractmethod of get_parameters."""
        # Check the NA privilege
        LOGGER.debug("Checking privileges")
        if not self.check_privileges([PAPrivileges.NETWORK_ANALYSIS]):
            LOGGER.error(100111, extra={"message_ID": 100111})
            raise ToolExit

        # Tool signature matches the descriptions here:
        # https://developers.arcgis.com/rest/analysis/api-reference/create-route-layers.htm
        LOGGER.debug("Retrieving parameters from tool dialog")
        route_data_item: str = arcpy.GetParameterAsText(0)  # type: ignore
        self.delete_route_data_item = arcpy.GetParameter(1)

        # Parse the input json so we can get the item ID. Input should look like:
        # {"itemId" : {item id of the route data item}}
        invalid_json_msg_num = 100219
        invalid_json_msg_params = {"message_ID": invalid_json_msg_num, "paramName": "routeData"}
        try:
            route_data_json = ast.literal_eval(route_data_item)
        except ValueError as ex:
            LOGGER.error(invalid_json_msg_num, extra=invalid_json_msg_params)
            raise ToolExit
        if "itemId" not in route_data_json:
            LOGGER.error(invalid_json_msg_num, extra=invalid_json_msg_params)
            raise ToolExit

        # Get the route data zip file from the portal
        self.route_data_item_id = route_data_json["itemId"]
        route_data_file = os.path.join(AOLUtils.get_scratch_wkspc(False), "route_data.zip")
        try:
            PortalUtils.get_itemdata_as_file(self.route_data_item_id, route_data_file)
        except ToolExit:
            LOGGER.error(100224, extra={"message_ID": 100224, "itemId": self.route_data_item_id})
            raise ToolExit

        # This tool does not charge credits
        self.refund_param = None

        LOGGER.debug("Initializing tool executor")
        # warn_if_limit_exceeded used to be set to True for an unknown reason, and this would cause the tool
        # to error later.  Updated for https://devtopia.esri.com/ArcGISPro/Network-Analyst/issues/7243 at 11.3
        # to fail with an error if the limit is exceeded.
        self.executor: CRLDExecutor = CRLDExecutor(route_data_file, warn_if_limit_exceeded=False)

    def publish_outputs(self):
        """Publish the tool's outputs.

        Override the default publishing function to use shared code in the executor class. This is done in order to
        share the publishing code with other tools, such as PlanRoutes. This method also sets symbology for the outputs.
        """
        try:
            with LogExecutionTime("executor.publish_route_layers()"):
                self.executor.publish_route_layers(self.output_name)
            arcpy.SetParameterAsText(4, json.dumps(self.executor.output_items))
        finally:
            # Try to delete the route data item if asked to even if creating route layers has failed.
            if self.delete_route_data_item:
                PortalUtils.delete_portal_item(self.route_data_item_id, {"permanentDelete": True})

    def set_visualization(self):
        """Dummy method to make parent class happy.

        Visualization is done using the executor class when publish_outputs() is called because we need to share that
        code with other tools, such as the PlanRoutes tool. Do nothing here, but maintain the function because the
        parent class requires its existence.
        """
        LOGGER.debug(f"Do nothing. Visualization has already been handled by the executor.")

    def log_usage_metering(self):
        """Log the usage of the tool."""
        # This tool does not log anything.
        LOGGER.debug(f"No need to log any usage for {self.task_name}.")
