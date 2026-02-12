"""Publishes routing services based on a network dataset."""  # Already refactored. pylint:disable=too-many-lines

import os
import logging
import json
import pprint
import glob
import shutil
import datetime
import re
import xml.dom.minidom as DOM
from urllib.parse import urlparse
from collections import defaultdict

import arcpy
from arcpy._na import ApplyLocateSettings
import ndsf
import agsadmin
from vnd import AnalyzeNetworkDataset
from nast import NDSInfo

# Module logger
LOGGER = logging.getLogger(__name__)
LOGGER.addHandler(logging.NullHandler())


class PublishRoutingServices:
    """Core execution logic."""

    ROUTING_SERVICE_FOLDER_DESC = "Contains services used to perform network analysis."
    ags_platform = "linux" if "WINEPREFIX" in os.environ else "windows"  # Platform of ArcGIS Server
    HELP_LINKS = {  # Key is the short url and value is platform dependent long URL
        "http://esriurl.com/crusffs": (f"https://enterprise.arcgis.com/en/portal/latest/administer/{ags_platform}/"
                                       "configure-services.htm#ESRI_SECTION2_A3E5299DB5D349FD94AB25B4F1BFE2C5"),
    }
    ASYNC_GP_HELPER_SVC_NAMES = ("asyncRoute", "asyncClosestFacility", "asyncServiceArea", "asyncVRP",
                                 "asyncLocationAllocation", "asyncODCostMatrix", "asyncFleetRouting")
    SYNC_GP_HELPER_SVC_NAMES = ("syncVRP", "snapToRoads")
    SOLVER_TYPES = ("Route", "ClosestFacility", "ServiceArea", "OriginDestinationCostMatrix", "Location-Allocation",
                    "VehicleRoutingProblem", "LastMileDelivery", "SnapToRoads")
    VALID_NASERVER_LAYER_TYPES = ("ServiceArea", "ClosestFacility", "Route", "OriginDestinationCostMatrix")
    ASYNC_SOLVER_TOOLS = {  # mapping between solver type and async solver GP tool
        "Route": "FindRoutes",
        "ClosestFacility": "FindClosestFacilities",
        "ServiceArea": "GenerateServiceAreas",
        "OriginDestinationCostMatrix": "GenerateOriginDestinationCostMatrix",
        "Location-Allocation": "SolveLocationAllocation",
        "VehicleRoutingProblem": "SolveVehicleRoutingProblem",
        "LastMileDelivery": "SolveLastMileDelivery",
    }
    SYNC_SOLVER_TOOLS = { # mapping between solver type and sync solver GP tool
        "VehicleRoutingProblem": "EditVehicleRoutingProblem",
        "SnapToRoads": "SnapToRoads"
    }
    HELPER_SERVICES_SOLVER_TYPES = {  # Mapping between helper service names and solver types
        "asyncRoute": "Route",
        "asyncClosestFacility": "ClosestFacility",
        "asyncServiceArea": "ServiceArea",
        "asyncODCostMatrix": "OriginDestinationCostMatrix",
        "asyncLocationAllocation": "Location-Allocation",
        "asyncVRP": "VehicleRoutingProblem",
        "asyncFleetRouting": "LastMileDelivery",
        "route": "Route",
        "closestFacility": "ClosestFacility",
        "serviceArea": "ServiceArea",
        "odCostMatrix": "OriginDestinationCostMatrix",
        "syncVRP": "VehicleRoutingProblem",
        "snapToRoads": "SnapToRoads"
    }

    def __init__(self, **kwargs):
        """Set up names used in other methods."""
        # Overwrite outputs created from running GP tools while publishing services
        arcpy.env.overwriteOutput = True
        # Initialize instance attributes
        self.ags_admin_dir = None  # An instance of ArcGIS Server Administrator Directory
        self.owning_system_url = ""
        self.portal_self = {}  # Response from portal self call when running on a federated server.
        self.server_url = ""
        self.token_referrer = None
        self.cwd = os.path.dirname(os.path.abspath(__file__))  # Current working directory
        self.naserver_sd_files = {}  # Service definition files for map service with network analysis capability
        self.nau_gp_sd_file = {}  # Service definition file for network analysis utilities gp service
        self.na_async_gp_sd_files = {}  # Service definition files for async network analysis gp services.
        self.na_sync_gp_sd_files = {}  # Service definition files for sync network analysis gp services.
        self.traffic_map_sd_file = {}  # Service definition file for the dynamic traffic map service.
        self.sync_na_helper_svc_names = [  # helper service names for NAServer based services.
            "route", "closestFacility", "serviceArea", "traffic", "odCostMatrix"
        ]
        self.gp_svc_tbx = None  # Toolbox used to publish GP services
        self.gp_svc_tbx_alias = "nas"  # Alias for the toolbox used to publish GP services
        self.input_points = None  # Input points used to run the solver geoprocessing tools
        self.vrp_inputs = {}  # Inputs required to run VRP solver geoprocessing tools.
        self.lmd_inputs = {}  # Inputs required to run LastMileDelivery solver geoprocessing tool.
        self.ags_platform = "linux" if "WINEPREFIX" in os.environ else "windows"  # Platform of ArcGIS Server
        self.published_services = []  # List of REST URLs and item ids for the services published by the tool
        self.service_item_ids = {}  # Store the portal item ids for the services. Key is serviceName.serviceType
        self.nd_is_using_traffic_data_service = False  # ND is configured with traffic data service
        self.logger = LOGGER

        self.logger.debug("Input parameter values")
        for arg_name in sorted(kwargs):
            if arg_name == "password":
                if kwargs[arg_name]:
                    self.logger.debug("%s: %s", arg_name, "****")
                else:
                    self.logger.debug("%s: %s", arg_name, kwargs[arg_name])
            else:
                self.logger.debug("%s: %s", arg_name, kwargs[arg_name])

        # Store command line options and other values derived from them as instance attributes
        self.user_name = kwargs["user_name"]
        self.password = kwargs["password"]
        self.server_name = kwargs["server_name"]
        self.service_definition_folder = kwargs["service_definition_folder"]
        self.service_folder = kwargs["service_folder"]
        self.dedicated_service = kwargs.get("dedicated_service", False)  # publish dedicated service for each solver.
        self.solver_types = kwargs.get("solver_types", self.SOLVER_TYPES)
        self.portal_name = kwargs.get("portal_name", "")
        self.nd_datastore = kwargs.get("nd_datastore", {})

        # Read the config file
        self.config = self._read_config_file(kwargs.get("config_file", ""))
        self.config_gp_tool_options = self._config_gp_tool_options()
        self.gp_service_limits = self.config_gp_tool_options["serviceLimits"]
        self.solver_tools_limits_param = self.config_gp_tool_options["gpToolLimits"]
        self.map_service_limits = self.config_gp_tool_options["mapServiceLimits"]

        # Determine if we are running as a web tool or CLI tool
        self.is_web_tool = arcpy.gp.isRunningInServer()

        # Create network dataset layers. If we have extents layer, we are working with multiple network datasets.
        self.nd_extents = kwargs.get("nd_extents", "")
        self.nd_extents_layer = None
        self.nd_extents_layer_name = ""
        if self.nd_extents:
            self.nd_extents_layer_name = "Network Dataset Extents"
            self.logger.debug("Creating network dataset extents layer, '%s'", self.nd_extents_layer_name)
            self.nd_extents_layer = arcpy.management.MakeFeatureLayer(self.nd_extents,
                                                                      self.nd_extents_layer_name).getOutput(0)
            self.nd_layers = self._make_nd_layers_from_extents()
            self.network_datasets = [lyr.name for lyr in self.nd_layers]
            # Pick the first network dataset as the template network dataset
            self.network_dataset = self.network_datasets[0]
        else:
            nd_path = self._copy_sde_conn_file(kwargs["network_dataset"])
            nd_layer = self._make_nd_layer(nd_path)
            self.network_dataset = nd_layer.name
            self.network_datasets = [self.network_dataset]
            self.nd_layers = [nd_layer]
        self.nd_describe = arcpy.Describe(self.network_dataset)  # Describe object for the network dataset
        self.nd_workspace = os.path.dirname(os.path.dirname(self.nd_describe.catalogPath))  # gdb containing the nd
        # self.na_filegdb = os.path.join(os.path.dirname(self.nd_workspace), "nainputs.gdb")  # File GDB with naclasses
        self.na_filegdb = os.path.join(kwargs["service_definition_folder"], "nainputs.gdb")
        # Traffic helper service should be set if the network dataset does not support historical traffic
        if not self.nd_describe.supportsHistoricalTrafficData:
            self.logger.debug("Skip updating traffic helper service as the network dataset "
                              "does not support historical traffic.")
            self.sync_na_helper_svc_names.remove("traffic")
        # Initialize derived outputs. Key is helper service name and value is helper service URL.
        self.na_map_services = dict.fromkeys(self.sync_na_helper_svc_names, "")
        self.na_utils_gp_service = {"routingUtilities": ""}
        self.traffic_map_service = {}  # Can be empty if we do not have a dedicated traffic map service.
        self.na_async_gp_services = dict.fromkeys(self.ASYNC_GP_HELPER_SVC_NAMES, "")
        self.na_sync_gp_services = dict.fromkeys(self.SYNC_GP_HELPER_SVC_NAMES, "")

    def _read_config_file(self, config_file):
        """Return the contents of the config file as a dict."""
        if not config_file:
            config_file_name = "publishroutingservices.json"
            if self.dedicated_service:
                config_file_name = "publishroutingservices_dedicated.json"
            config_file = os.path.join(self.cwd, config_file_name)
            if not os.path.exists(config_file):
                config_file = os.path.join(os.path.dirname(self.cwd), config_file_name)
        self.logger.debug("Reading configuration from %s", config_file)
        with open(config_file, "r", encoding="utf-8") as config_fp:
            try:
                config = json.load(config_fp)
            except json.JSONDecodeError:
                msg = "The config file is not a valid json file."
                self.logger.error(msg, extra={
                    "message_ID": 30328,
                })
                raise arcpy.ExecuteError("30328") from None

        # Fail if we get config files from versions earlier than ArcGIS 11.0. Such config files do not support
        # configVersion property
        config_version = int(config.get("configVersion", "0").replace(".", ""))
        if config_version != 10:
            msg = "The version of the config file is not supported."
            self.logger.error(msg, extra={
                "message_ID": 30329,
            })
            raise arcpy.ExecuteError("30329") from None

        # Set the self.dedicated_service based on the dedicatedServicePerSolver property in the config file
        if "dedicatedServicePerSolver" in config:
            self.dedicated_service = config["dedicatedServicePerSolver"]

        # Validate if the config file has the required options
        # TODO: Validate config file may be using jsonschema module (version 3.2.0) that is included with Pro
        # https://pypi.org/project/jsonschema/
        # if not self.dedicated_service:
        #     for parent, child in (("mapServices", "networkAnalysis"),
        #                           ("gpServices", "asyncNetworkAnalysis"),
        #                           ("gpServices", "syncNetworkAnalysis"),
        #                           ("gpServices", "routingUtilities")):
        #         try:
        #             config[parent][child]
        #         except KeyError:
        #             msg = "The config file is not valid as it does not have an option called '%s' within '%s'"
        #             self.logger.error(msg, child, parent, extra={
        #                 "message_ID": 30275,
        #                 "add_argument1": child,
        #                 "add_argument2": parent
        #             })
        #             raise arcpy.ExecuteError("30275") from None
        return config

    def _config_gp_tool_options(self):
        """Return the gp tool options from the version 11.0 config file."""
        def _title(val):
            """Return the title case for the value and handle some special cases."""
            return solver_tool_param_name_special_cases.get(val, val.title())

        # Lookup for solver tool parameter names that do not have strict title case names
        solver_tool_param_name_special_cases = {
            "reorder_stops_to_find_optimal_routes": "Reorder_Stops_to_Find_Optimal_Routes",
            "return_to_start": "Return_to_Start",
            "time_of_day": "Time_of_Day",
            "time_zone_for_time_of_day": "Time_Zone_for_Time_of_Day",
            "time_zone_for_time_windows": "Time_Zone_for_Time_Windows",
            "number_of_facilities_to_find": "Number_of_Facilities_to_Find",
            "time_of_day_usage": "Time_of_Day_Usage",
            "number_of_destinations_to_find": "Number_of_Destinations_to_Find",
            "exclude_sources_from_polygon_generation": "Exclude_Sources_from_Polygon_Generation",
            "polygons_for_multiple_facilities": "Polygons_for_Multiple_Facilities",
            "includeNetworkSourceInfo": "includeNetworkSourceInfo",
        }
        lcase_param_name_tools = ("SolveVehicleRoutingProblem", "EditVehicleRoutingProblem", "SolveLastMileDelivery",
                                  "SnapToRoads")
        config_choice_lists = {}
        config_default_values = {}
        config_const_params = {}
        config_gp_service_limits = defaultdict(dict)  # Limits as returned by GetToolInfo utility tool
        gp_tool_limits = {}  # Value for the service_limits parameter supported by the solver GP tools
        map_service_limits = {}

        if "gpServices" in self.config["routingServices"]:
            for service_name, service_options in self.config["routingServices"]["gpServices"].items():
                if "toolProperties" in service_options:
                    for tool_name, tool_options in service_options["toolProperties"].items():
                        if "choiceLists" in tool_options:
                            for param_name, values in tool_options["choiceLists"].items():
                                if tool_name not in lcase_param_name_tools:
                                    param_name = _title(param_name)
                                config_choice_lists[f"{tool_name}.{param_name}"] = values
                        if "defaultValues" in tool_options:
                            if tool_name in lcase_param_name_tools:
                                config_default_values[tool_name] = tool_options["defaultValues"]
                            else:
                                config_default_values[tool_name] = {_title(k): v
                                                                    for k, v in tool_options["defaultValues"].items()}
                        if "constantParameters" in tool_options:
                            if tool_name in lcase_param_name_tools:
                                config_const_params[tool_name] = tool_options["constantParameters"]
                            else:
                                config_const_params[tool_name] = [_title(val)
                                                                  for val in tool_options["constantParameters"]]
                        if "serviceLimits" in tool_options:
                            config_gp_service_limits[service_name][tool_name] = tool_options["serviceLimits"]
            # Transform limits so that they can be passed as parameter value (of type Value Table)
            if config_gp_service_limits:
                for limits in config_gp_service_limits.values():
                    for tool_name, tool_limits in limits.items():
                        values = [[limit, value] for limit, value in tool_limits.items()]
                        gp_tool_limits[tool_name] = values
            # For AGOL, asyncVRP and asyncFleetRouting point to same service and the prs config does not have
            # entry for asyncFleetRouting which is needed for GetToolInfo to work.
            if "asyncVRP" in config_gp_service_limits and "asyncFleetRouting" not in config_gp_service_limits:
                config_gp_service_limits["asyncFleetRouting"] = config_gp_service_limits["asyncVRP"]

        if "mapServices" in self.config["routingServices"]:
            for service_name, service_options in self.config["routingServices"]["mapServices"].items():
                if "layerProperties" in service_options:
                    for layer_name, layer_options in service_options["layerProperties"].items():
                        if "serviceLimits" in layer_options:
                            map_service_limits[layer_name] = layer_options["serviceLimits"]

        return {
            "choiceLists": config_choice_lists,
            "defaultValues": config_default_values,
            "constantParameters": config_const_params,
            "serviceLimits": config_gp_service_limits,
            "gpToolLimits": gp_tool_limits,
            "mapServiceLimits": map_service_limits,
        }

    def _copy_sde_conn_file(self, nd_path):
        """Copy the connection file for the SDE network dataset and return the new path.

        Args:
            nd_path: Full catalog path to the network dataset.
        Returns:
            The full catalog path to the network dataset that references the new SDE file. If the network dataset is not
            in SDE, return the original catalog path to the network dataset.

        """
        # Copy only .sde file and not a connection string.
        if not nd_path.endswith(".sde"):
            return nd_path
        nd_workspace = os.path.dirname(os.path.dirname(nd_path))
        desc_nd_wks = arcpy.Describe(nd_workspace)
        if desc_nd_wks.workspaceFactoryProgID.lower() != "esridatasourcesgdb.sdeworkspacefactory":
            return nd_path
        nd_name = os.path.basename(nd_path)
        fd_name = os.path.basename(os.path.dirname(nd_path))
        new_sde_conn_file = arcpy.CreateUniqueName(os.path.basename(nd_workspace), self.service_definition_folder)
        new_sde_conn_file = shutil.copy2(nd_workspace, new_sde_conn_file)
        self.logger.debug("Copied SDE connection file %s to %s", nd_workspace, new_sde_conn_file)
        return os.path.join(new_sde_conn_file, fd_name, nd_name)

    def _make_nd_layer(self, nd_path, layer_name=""):
        """Make a network dataset layer from a network dataset catalog path.

        Args:
            nd_path: Catalog path for the network dataset.
            layer_name: Name of the network dataset layer. If a value is not specified, the network dataset layer has
                        the same name as the network dataset.
        Returns:
            A network dataset layer object
        Raises:
            arcpy.ExecuteError in case any network dataset layer cannot be created.

        """
        try:
            if not layer_name:
                layer_name = os.path.basename(nd_path)
                # Handle SDE network datasets passed as CIM connection strings
                if "CIMFeatureDatasetDataConnection" in layer_name:
                    layer_name = arcpy.Describe(nd_path).name
            # Ensure the layer name does not cause analyzer error "The layer name has invalid characters"
            # Ok to not pass the workspace parameter to ValidateTableName since without the workspace, ValidateTableName
            # Validates for a folder as workspace which is fine for our validation needs.
            layer_name = arcpy.ValidateTableName(layer_name)
            self.logger.info("Creating network dataset layer, '%s', from the network dataset catalog path %s",
                             layer_name, nd_path)
            tool_result = arcpy.na.MakeNetworkDatasetLayer(nd_path, layer_name)
            self.logger.debug(arcpy.GetMessages())
            return tool_result.getOutput(0)  # pylint: disable=no-member
        except arcpy.ExecuteError:
            self.logger.debug(arcpy.GetMessages())
            msg = ("Failed to create the network dataset layer. "
                   "If you are using a licensed network dataset, make sure the network dataset license is installed.")
            self.logger.error(msg, extra={
                "message_ID": 30276,
            })
            raise arcpy.ExecuteError("30276") from None

    def _make_nd_layers_from_extents(self):
        """Make network dataset layers from the extents feature class.

        Returns:
            A list of network dataset layers
        Raises:
            arcpy.ExecuteError in case any network dataset layer cannot be created.

        """
        region_name_field = "RegionName"  # Region name field in the extents feature class
        workspace_name_field = "WorkspaceName"  # Workspace name field in the extents feature class
        connection_field = "RemoteConnection"  # Field containing the name of the connection file
        nds = ""  # catalog path to a single network dataset
        nds_layers = []  # list of network dataset layers
        extents_desc = arcpy.Describe(self.nd_extents)
        extents_shape_fld_name = extents_desc.shapeFieldName  # pylint:disable=no-member

        # Get the folder containing the extents layer. Assume the extents feature class is not in a feature dataset
        extents_path = extents_desc.catalogPath  # Describe lacks introspection. pylint:disable=no-member
        nds_folder = os.path.dirname(os.path.dirname(extents_path))

        # Get unique region names and their work space names
        local_extents_layer = os.path.basename(self.nd_extents) + "_LocalNDS"
        arcpy.management.MakeFeatureLayer(self.nd_extents, local_extents_layer)
        extents_stats = os.path.join("in_memory", local_extents_layer + "_stats")
        arcpy.analysis.Statistics(local_extents_layer, extents_stats,
                                  [[f"{extents_shape_fld_name}_Area", "SUM"],
                                   [workspace_name_field, "FIRST"],
                                   [connection_field, "FIRST"]],
                                  region_name_field)
        cursor_fields = (region_name_field,
                         f"FIRST_{workspace_name_field}",
                         f"FIRST_{connection_field}",
                         f"SUM_{extents_shape_fld_name}_Area")
        with arcpy.da.SearchCursor(extents_stats, cursor_fields) as cursor:  # pylint:disable=no-member
            regions = sorted(cursor, reverse=True, key=lambda row: row[-1])

        for region in regions:
            region_name = region[0]
            workspace_name = region[1]
            connection_file_name = region[2]
            if connection_file_name:
                self.logger.info("Skip creating network dataset layer for %s since it is a remote region", region_name)
                continue
            if workspace_name.endswith(".gdb") or workspace_name.endswith(".geodatabase"):
                gdb_path = os.path.join(nds_folder, workspace_name)
            else:
                gdb_path = os.path.join(nds_folder, workspace_name + ".gdb")
            # Get the network dataset inside the GDB
            for workspace, fds, datasets in arcpy.da.Walk(gdb_path,  # pylint:disable=no-member,unused-variable
                                                          datatype="NetworkDataset"):
                if datasets:
                    nds = os.path.join(workspace, datasets[0])
                    break
            # Create a network dataset layer using the region name
            if nds:
                nds_layers.append(self._make_nd_layer(nds, region_name))
        return nds_layers

    def _validate_user(self):
        """Check if the user can publish GP and map services."""
        try:
            admin_info_url = f"{self.ags_admin_dir.root_url}/info"
            admin_info_response = self.ags_admin_dir.make_http_request(admin_info_url)
        except agsadmin.HTTPError as ex:
            if hasattr(ex, "code"):
                # admin info request can fail if the server URL is the web-adaptor url that is not authorized for
                # server admin access.
                if ex.code == 403:
                    self.logger.error("Administrative access is disabled at %s", self.server_url)
                else:
                    self.logger.error("The following HTTP error occurred when trying to fetch %s", admin_info_url)
                    self.logger.error("%s: %s", ex.code, ex.reason)
            raise arcpy.ExecuteError from None
        except Exception:
            # Logging of the exception is already done by make_http_request
            raise arcpy.ExecuteError from None

        user_name = admin_info_response.get("loggedInUser", self.user_name).split("::")[-1]
        user_privilege = admin_info_response.get("loggedInUserPrivilege", "")
        # Fail if the logged in user is not an administrator or a publisher
        if user_privilege not in ("ADMINISTER", "PUBLISH"):
            self.logger.error("User %s does not have privileges to publish services", user_name, extra={
                "message_ID": 30277,
                "add_argument1": user_name,
            })
            raise arcpy.ExecuteError("30277") from None

        # For federated server, the logged in user must be an administrator or a publisher who has
        # "portal:publisher:publishServerGPServices" and "portal:publisher:publishServerServices" privileges
        if self.owning_system_url:
            if user_privilege in ("ADMINISTER", "PUBLISH"):
                portal_user_privileges = []
                req_pub_privileges = set(("portal:publisher:publishServerGPServices",
                                          "portal:publisher:publishServerServices"))
                if "user" in self.portal_self:
                    portal_user_privileges = self.portal_self["user"].get("privileges", [])
                if portal_user_privileges and not req_pub_privileges.issubset(set(portal_user_privileges)):
                    self.logger.error("User %s does not have privilege to publish web tools and server-based layers",
                                      self.user_name, extra={
                                        "message_ID": 30278,
                                        "add_argument1": self.user_name
                                        })
                    self.logger.debug("portal user privileges: %s", json.dumps(portal_user_privileges, indent=2))
                    raise arcpy.ExecuteError("30278") from None
        else:
            # For a stand alone server, the logged in user must be an administrator
            if not user_privilege == "ADMINISTER":
                self.logger.error("User %s does not have administrator privilege", self.user_name, extra={
                    "message_ID": 30279,
                    "add_argument1": self.user_name
                })
                self.ags_admin_dir.log_response()
                raise arcpy.ExecuteError("30279") from None

    def _validate_nd(self):
        """Check if the network dataset has the minimum properties that are required for publishing routing services."""
        try:
            analyze_nds = AnalyzeNetworkDataset(self.nd_describe, self.solver_types)
            analyze_nds.execute()
        except Exception:
            self.logger.exception("Failed to analyze the network dataset.")
            raise arcpy.ExecuteError from None
        # Write any warnings from network dataset analyzer
        if analyze_nds.analyze_succeedeed:
            analyzer_warnings = analyze_nds.analyze_messages["warnings"]
            if analyzer_warnings:
                self.logger.warning("The following warnings were returned when analyzing the input network dataset:",
                                    extra={"message_ID": 30273})
                for msg in analyzer_warnings:
                    self.logger.warning(msg, extra={
                        "message_ID": AnalyzeNetworkDataset.ANALYZER_MESSAGES[msg]
                    })
        else:
            # fail since analyzer returned errors
            self.logger.error("The following errors were returned when analyzing the input network dataset:", extra={
                "message_ID": 30274
            })
            for msg in analyze_nds.analyze_messages["errors"]:
                self.logger.error(msg, extra={
                    "message_ID": AnalyzeNetworkDataset.ANALYZER_MESSAGES[msg]
                })
            raise arcpy.ExecuteError("30274") from None

        # If the network dataset is configured with live traffic from the portal, the portal URL and live traffic URL
        # should match.
        if self.owning_system_url and self.nd_describe.supportsLiveTrafficData:
            ltd = self.nd_describe.liveTrafficData
            if ltd.trafficFeedType == "SERVICE":
                try:
                    traffic_feed_location = json.loads(ltd.trafficFeedLocation)
                except json.decoder.JSONDecodeError:
                    self.logger.debug("Traffic feed location %s cannot be converted into a dict.",
                                      ltd.trafficFeedLocation)
                    traffic_feed_location = {}
                traffic_feed_url = traffic_feed_location.get("url", "https://www.arcgis.com")
                if urlparse(traffic_feed_url).hostname.lower() != urlparse(self.owning_system_url).hostname.lower():
                    self.logger.debug("Traffic Feed URL: %s, Portal URL: %s",
                                      traffic_feed_url, self.owning_system_url)
                    msg = ("The network dataset is configured to retrieve live traffic from a portal other than "
                           "the one to which the service is being published.")
                    self.logger.error(msg, extra={"message_ID": 30284})
                    raise arcpy.ExecuteError("30284") from None
                else:
                    self.nd_is_using_traffic_data_service = True

    def _check_nd_on_server(self):
        """Check if the network dataset is accessible to all the server machines in the ArcGIS Server site."""
        # Check if PublishingTools GP service is running
        pub_tools_service_status = self.ags_admin_dir.service_status("System", "PublishingTools", "GPServer")
        if pub_tools_service_status.get("realTimeState", "STOPPED") == "STOPPED":
            err_msg = "The System/PublishingTools service is in stopped state. Make sure the service is running."
            self.logger.error(err_msg)
            self.ags_admin_dir.log_response()
            raise arcpy.ExecuteError from None

        # Check if the geodatabase containing the network dataset is accessible on all the machines in case
        # of multi-machine sites
        # If the network dataset is in a file gdb, validate if the .gdb folder exists on all the machines
        # If the network dataset is from a mmpk, validate if the .tn folder exists on all the machines
        # If the network dataset is in SDE, validate if the connection file is valid for all the machines
        self.logger.debug("Verifying if the network dataset workspace is valid.")
        nd_workspace_type = arcpy.Describe(self.nd_workspace).workspaceFactoryProgID.lower()
        if nd_workspace_type == "esridatasourcesgdb.filegdbworkspacefactory":
            nd_workspace_type_short_name = "file"
            vds_input_params = {
                "in_dataStore": self.nd_workspace,
                "in_dataStoreType": "FILE_SHARE",
            }
        elif nd_workspace_type == "esridatasourcesgdb.sqliteworkspacefactory":
            nd_workspace_type_short_name = "sqlite"
            vds_input_params = {
                "in_dataStore": os.path.splitext(self.nd_workspace)[0] + ".tn",
                "in_dataStoreType": "FILE_SHARE",
            }
        elif nd_workspace_type == "esridatasourcesgdb.sdeworkspacefactory":
            nd_workspace_type_short_name = "enterprise"
            sde_conn_string_params = {
                "in_inputData": self.ags_admin_dir.upload_item(self.nd_workspace)["item"]["itemID"],
                "in_connDataType": "UPLOADED_CONNECTION_FILE_ID"
            }
            sde_conn_string_response = self.ags_admin_dir.execute_async_gp_service("System", "PublishingTools",
                                                                                   "Get Database Connection String",
                                                                                   sde_conn_string_params)
            vds_input_params = {
                "in_dataStore": sde_conn_string_response["results"]["out_connectionString"]["value"],
                "in_dataStoreType": "CONNECTION_STRING",
            }
        vds_result = self.ags_admin_dir.execute_async_gp_service("System", "PublishingTools",
                                                                 "Validate Server Data Store", vds_input_params)
        if not vds_result["results"]["out_serverCanAccess"]["value"]:
            # Return an error as file gdb is not accessible on all the machines.
            err_msg = ("All machines in your ArcGIS Server site cannot access the %s geodatabase containing "
                       "the network dataset at %s")
            self.logger.error(err_msg, nd_workspace_type_short_name, self.nd_workspace)
            self.logger.debug(json.dumps(vds_result, indent=2))
            raise arcpy.ExecuteError from None

    def _create_service_folder(self):
        """Create the folder on ArcGIS Server site that will contain the routing services.

        If the service folder exists, fail if it has any of the routing services. Otherwise use the existing folder.

        """
        # Check if service folder name exists. If not create it.
        if self.ags_admin_dir.exists(self.service_folder):
            self.logger.debug("Service folder, %s, already exists.", self.service_folder)
            # Fail if any of the services already exist
            service_folder_url = f"{self.ags_admin_dir.root_url}/services/{self.service_folder}"
            service_folder_response = self.ags_admin_dir.make_http_request(service_folder_url)
            existing_services = service_folder_response.get("services", [])
            if existing_services and self.config.get("publishSDs", True):
                self.logger.error("Service folder, %s, is not empty", self.service_folder, extra={
                    "message_ID": 30280,
                    "add_argument1": self.service_folder,
                })
                raise arcpy.ExecuteError("30280") from None
            self.logger.info("Using existing service folder, %s, to publish services", self.service_folder)
        else:
            # Create the service folder
            self.logger.info("Creating service folder, %s", self.service_folder)
            svc_folder_created = self.ags_admin_dir.create_folder(self.service_folder, self.ROUTING_SERVICE_FOLDER_DESC)
            if not svc_folder_created:
                self.logger.error("Failed to create service folder, %s", self.service_folder, extra={
                    "message_ID": 30281,
                    "add_argument1": self.service_folder
                })
                raise arcpy.ExecuteError("30281") from None

    def _update_na_layer_properties(self, na_layer, network_dataset):
        """Modify solver properties for a network analysis layer.

        Args:
            na_layer: A network analysis layer object whose properties are modified.
            network_dataset: The network dataset used to create the network analysis layer.

        Returns:
            The modified layer object.

        Raises:
            No exceptions.

        """
        # Match with defaults used in ArcGIS Online.
        solver_props = arcpy.na.GetSolverProperties(na_layer)
        solver_name = solver_props.solverName
        if solver_name in ("Route Solver", "Closest Facility Solver", "OD Cost Matrix Solver"):
            nd_info = NDSInfo(network_dataset)
            distance_costs = list(nd_info.costs["distanceCosts"].keys())
            solver_props.accumulators = distance_costs
            if solver_name == "OD Cost Matrix Solver":
                solver_props.outputPathShape = "NO_LINES"
            else:
                solver_props.outputPathShape = "TRUE_LINES_WITHOUT_MEASURES"
            if solver_name == "Route Solver":
                solver_props.orderingType = "PRESERVE_BOTH"
        elif solver_name == "Service Area Solver":
            solver_props.splitLinesAtBreaks = "NO_SPLIT"
            solver_props.includeNetworkSourceFields = "NO_LINES_SOURCE_FIELDS"

        return na_layer

    def _update_na_layer_properties_using_cim(self, na_layer, network_dataset, layer_properties):
        """Update the NA Layer properties by modifying its CIM definition.

        Args:
            na_layer: The analysis layer to update
            network_dataset: The network dataset used to create the network analysis layer.
            layer_properties: dict from the config file containing layerProperties defined for a service layer.

        Returns:
           The modified analysis layer

        """
        # mapping between service parameter defaultValues and CIM property names. If a mapping does not exist, assume
        # CIM property name is same as the service parameter name.
        svc_param_to_cim_prop = {
            "returnDirections": "directionsEnabled",
            "travelMode": "appliedTravelModeJSON",
            "startTimeIsUTC": "timeOfDayIsUTC",
            "directionsStyleName": "directionsStyle",
            "timeWindowsAreUTC": "inputDateTimeFieldsAreUTC",
        }
        # mapping between the type returned by solver property of layer CIM def and the layer type defined in the
        # config layerProperties
        solver_to_layer_types = {
            "NARouteSolver": "route",
            "NAClosestFacilitySolver": "closestFacility",
            "NAServiceAreaSolver": "serviceArea",
            "NAODCostMatrixSolver": "odCostMatrix"
        }
        now = -2209132800000  # Special number to denote "now" for startTime or timeOfDay
        layer_cim_def = na_layer.getDefinition("V3")
        solver_cim_def = layer_cim_def.solver

        # Convert service parameter defaultValues to CIM properties
        cim_properties = {}
        layer_type = solver_to_layer_types[solver_cim_def["type"]]
        default_values = layer_properties[layer_type]["defaultValues"]
        for key, val in default_values.items():
            if key in svc_param_to_cim_prop:
                cim_properties[svc_param_to_cim_prop[key]] = val
            else:
                cim_properties[key] = val

        # Handle startTime or timeOfDay.
        # Route layer uses startTime and all other layers use timeOfDay
        if layer_type == "route":
            start_time = default_values.get("startTime", "none")
            if start_time == "none":
                cim_properties["useStartTime"] = False
                cim_properties["dateTimeSynchronizeUsage"] = "esriNADateTimeSynchronizeToNone"
            else:
                cim_properties["useStartTime"] = True
                if start_time == "now":
                    cim_properties["startTime"] = now
                    cim_properties["dateTimeSynchronizeUsage"] = "esriNADateTimeSynchronizeToNow"
                else:
                    cim_properties["dateTimeSynchronizeUsage"] = "esriNADateTimeSynchronizeToCustomDateAndTimeOfDay"
        else:
            time_of_day = default_values.get("timeOfDay", "none")
            if time_of_day == "none":
                cim_properties["timeOfDayUsage"] = "esriNATimeOfDayNotUsed"
                cim_properties["dateTimeSynchronizeUsage"] = "esriNADateTimeSynchronizeToNone"
            else:
                # For Closest Facility layer, honor the timeOfDayUsage specified by the user
                if layer_type in ("serviceArea", "odCostMatrix"):
                    cim_properties["timeOfDayUsage"] = "esriNATimeOfDayUseAsStartTime"
                if time_of_day == "now":
                    cim_properties["timeOfDay"] = now
                    cim_properties["dateTimeSynchronizeUsage"] = "esriNADateTimeSynchronizeToNow"
                else:
                    cim_properties["dateTimeSynchronizeUsage"] = "esriNADateTimeSynchronizeToCustomDateAndTimeOfDay"

        if "locateSettings" in cim_properties:
            locate_settings = cim_properties.pop("locateSettings")
        else:
            locate_settings = {}

        # transform some of the cim property values
        if "appliedTravelModeJSON" in cim_properties:
            travel_mode = cim_properties["appliedTravelModeJSON"]
            if travel_mode and isinstance(travel_mode, dict):
                cim_properties["appliedTravelModeJSON"] = json.dumps(travel_mode)

        # Accumulate all distance based cost attributes is service parameter default values do not define accumulators
        # Accumulating all distance based cost attributes was inherited from AGOL services.
        if "accumulateAttributeNames" not in cim_properties:
            # Do not try to read the network dataset from the na_layer object or the layer CIM definition since for some
            # data formats such as MGDB and SDE, the na_layer.dataSource does not return the full catalog path (or path)
            # to SDE file and instead can return a connection string which might not work within NDSInfo
            nd_info = NDSInfo(network_dataset)
            distance_costs = list(nd_info.costs["distanceCosts"].keys())
            cim_properties["accumulateAttributeNames"] = distance_costs

        solver_cim_def.update(cim_properties)
        layer_cim_def.solver = solver_cim_def

        na_layer.setDefinition(layer_cim_def)

        # Apply default locateSettings
        if locate_settings:
            self.logger.debug("Applying locate settings to the analysis layer")
            ApplyLocateSettings(na_layer, json.dumps(locate_settings))
        return na_layer

    def _modify_sddraft(self, sddraft_file, svc_props, enable_naserver=False):
        """Modify sddraft file.

        Args:
            sddraft_file: The sddraft file to be modified. This file is updated in place.
            svc_props: A dict of properties to update.

        Returns:
            None

        Raises:
            No Exceptions

        """
        doc = DOM.parse(sddraft_file)
        definition_node = doc.getElementsByTagName("Definition")[0]
        # Service properties
        service_props = definition_node.getElementsByTagName("Props")[0].firstChild.childNodes
        service_config_props = definition_node.getElementsByTagName("ConfigurationProperties")[0].firstChild.childNodes
        props_to_check = service_props[:] + service_config_props[:]

        # NAServer Extension properties
        na_server_ext = None
        if enable_naserver:
            for ext in doc.getElementsByTagName("SVCExtension"):
                if ext.getElementsByTagName("TypeName")[0].firstChild.data == "NAServer":
                    na_server_ext = ext
                    break
        if na_server_ext:
            enabled_node = na_server_ext.getElementsByTagName("Enabled")[0].firstChild
            enabled_node.data = "true"
            na_server_props = na_server_ext.getElementsByTagName("Props")[0].firstChild.childNodes
            props_to_check += na_server_props[:]
        for propset in props_to_check:
            key, value = propset.childNodes
            prop_name = key.firstChild.data
            if prop_name in svc_props:
                prop_value = str(svc_props[prop_name])
                if value.firstChild is None:
                    value.appendChild(doc.createTextNode(prop_value))
                else:
                    value.firstChild.data = prop_value
                self.logger.debug("Modifying service property %s to %s", prop_name, value.firstChild.data)

        with open(sddraft_file, "w", encoding="utf-8") as out_fp:
            doc.writexml(out_fp)

    def _create_naserver_sd_file(self, svc_options, layer_types=None):
        """Create service definition file for NAServer based network analysis service contaning the specified layers.

        Args:
            svc_options: A dict obtained from the config file that contains the service options such as
                         serviceProperties and layerProperties.
            layer_types: A list of layer types that should be included in the SD file. If None create all the
                         valid layer types as defined in VALID_NASERVER_LAYER_TYPES.

        Returns:
            The full path to the created SD file.

        """
        svc_props = svc_options["serviceProperties"]
        layer_props = svc_options["layerProperties"]
        if layer_types:
            valid_layers = tuple(set(layer_types).intersection(set(self.VALID_NASERVER_LAYER_TYPES)))
        else:
            valid_layers = self.VALID_NASERVER_LAYER_TYPES
        if not valid_layers:
            self.logger.debug("%s layer types are not valid for creating NAServer based services.", layer_types)
            return ""
        map_svc_name = svc_props["serviceName"]
        sd_file = os.path.join(self.service_definition_folder, f"{map_svc_name}_NAServer.sd")
        self.logger.info("Creating service definition file, %s, for map service with network analysis capability.",
                         os.path.basename(sd_file))
        # Setup a Pro project that will be used to create the SD file.
        aprx_file = os.path.join(self.cwd, "data", "Blank.aprx")
        aprx = arcpy.mp.ArcGISProject(aprx_file)
        current_map = aprx.listMaps("*")[0]
        try:
            map_metadata = current_map.metadata
            map_metadata.title = "Routing Services"
            if not map_metadata.isReadOnly:
                map_metadata.save()
        except Exception:  # pylint:disable=broad-exception-caught
            self.logger.debug("Failed to update the metadata for the current map in %s project file.", aprx_file)

        # Create a file gdb to store sub-classes of network analysis layers.
        if not os.path.exists(self.na_filegdb):
            arcpy.management.CreateFileGDB(os.path.dirname(self.na_filegdb), os.path.basename(self.na_filegdb))
        arcpy.env.workspace = self.na_filegdb  # pylint:disable=assigning-non-slot
        self.logger.debug("Storing sub-classes for network analysis layers in %s", self.na_filegdb)

        # Add the network dataset layer since it is required to visualize traffic
        # Drawing traffic is very slow for small map scales. So we set a map scale beyond which the traffic layer does
        # not draw.
        layer_name_suffix = svc_props.get("analysisLayerNameSuffix", "")
        exclude_nd_layers = svc_props.get("excludeNetworkDatasetLayers", False)
        if not exclude_nd_layers:
            for nd_layer in self.nd_layers:
                nd_layer.minThreshold = svc_props.get("trafficLayerMinScale", 100000)
                # ND layer needs to be created with specific name when publishing remote services that are brokered to
                if layer_name_suffix:
                    nd_layer.name = layer_name_suffix
                current_map.addLayer(nd_layer)

        # Add the network dataset extents layer when multiple network datasets are used. But we don't have a need to
        # draw the extents layer
        if self.nd_extents_layer:
            self.nd_extents_layer.visible = False
            current_map.addLayer(self.nd_extents_layer)
        remote_layers = {}
        if self.nd_extents:
            remote_service_fields = [f"NA{valid_layer}Service"
                                     for valid_layer in valid_layers]
            with arcpy.da.SearchCursor(self.nd_extents,  # False positive. pylint:disable=no-member
                                       ["RegionName"] + remote_service_fields) as cursor:
                for row in cursor:
                    remote_layer_names = dict(zip(remote_service_fields, row[1:]))
                    if row[0] not in remote_layers:
                        remote_layers[row[0]] = remote_layer_names
        # Create and add the network analysis layers. Set their visibility to false as there is no need to visualize
        # them in the map service.
        for na_layer_type in valid_layers:
            if na_layer_type not in self.solver_types:
                continue
            for network_dataset in self.network_datasets:
                # Null value for NA<LayerType>Service field indicates that a remote region does not have the layer
                # for that solver. In such cases We need to create an analysis layer that points to a local network
                # dataset
                if self.nd_extents:
                    if remote_layers[network_dataset][f"NA{na_layer_type}Service"]:
                        continue
                    else:
                        na_layer_name = f"{na_layer_type}_{network_dataset}"
                else:
                    if layer_name_suffix:
                        na_layer_name = f"{na_layer_type}_{layer_name_suffix}"
                    else:
                        na_layer_name = na_layer_type
                self.logger.debug("Creating %s analysis layer", na_layer_name)
                make_nalayer_tool = getattr(arcpy.na,
                                            f"Make{na_layer_type.replace('OriginDestination', 'OD')}AnalysisLayer")
                na_layer = make_nalayer_tool(network_dataset, na_layer_name).getOutput(0)
                self.logger.debug("Modifying analysis layer properties using CIM definition")
                # na_layer = self._update_na_layer_properties(na_layer, network_dataset)
                na_layer = self._update_na_layer_properties_using_cim(na_layer, network_dataset, layer_props)
                na_layer.visible = False
                current_map.addLayer(na_layer)

        # Save the project
        new_aprx_file = os.path.join(self.service_definition_folder, f"{map_svc_name}.aprx")
        self.logger.debug("Saving the project with network analysis layers at %s", new_aprx_file)
        aprx.saveACopy(new_aprx_file)

        # Create a sharing draft from the project
        aprx = arcpy.mp.ArcGISProject(new_aprx_file)
        current_map = aprx.listMaps("*")[0]
        sharing_draft = current_map.getWebLayerSharingDraft("FEDERATED_SERVER", "MAP_IMAGE", map_svc_name)
        sharing_draft.offline = True
        sharing_draft.offlineTarget = "ENTERPRISE_11"
        sharing_draft.summary = svc_props.get("summary", "")
        sharing_draft.tags = svc_props.get("tags", "")
        sharing_draft.description = svc_props.get("description", "")
        sharing_draft.credits = svc_props.get("credits", "")
        sharing_draft.useLimitations = svc_props.get("useLimitations", "")
        sharing_draft.copyDataToServer = False
        sharing_draft.serverFolder = self.service_folder
        map_sddraft_file = os.path.join(self.service_definition_folder, f"{map_svc_name}.sddraft")
        self.logger.debug("Saving sddraft file for map service at %s", map_sddraft_file)
        sharing_draft.exportToSDDraft(map_sddraft_file)
        self._modify_sddraft(map_sddraft_file, svc_props, enable_naserver=True)

        # Create SD file from the sharing draft file
        if os.path.exists(sd_file):
            self.logger.debug("Removing existing map service definition file %s", sd_file)
            os.remove(sd_file)
        self.logger.debug("Saving map service definition file at %s", sd_file)
        sd_result = arcpy.server.StageService(map_sddraft_file, sd_file)
        self.logger.debug("Messages from StageService GP tool")
        self.logger.debug(sd_result.getMessages())
        return sd_file

    def _create_naserver_sd_files(self):
        """Create service definition files for NAServer based network analysis services."""
        if self.dedicated_service:
            map_svcs_props = self.config["routingServices"]["mapServices"]
            for svc_type in self.sync_na_helper_svc_names:
                self.naserver_sd_files[svc_type] = ""
                if svc_type in map_svcs_props:
                    layer_type = self.HELPER_SERVICES_SOLVER_TYPES.get(svc_type, "")
                    if layer_type in self.solver_types:
                        svc_options = map_svcs_props[svc_type]
                        # Add properties that define limits if specified in the config file
                        try:
                            svc_limits = self.map_service_limits[svc_type]
                            svc_options["serviceProperties"].update(svc_limits)
                        except KeyError:
                            self.logger.debug("No limits are defined for %s map service", svc_type)
                        self.naserver_sd_files[svc_type] = self._create_naserver_sd_file(svc_options, [layer_type])
        else:
            svc_options = self.config["routingServices"]["mapServices"]["networkAnalysis"]
            # Add properties that define limits if specified in the config file
            if self.map_service_limits:
                for svc_limits in self.map_service_limits.values():
                    svc_options["serviceProperties"].update(svc_limits)
            else:
                self.logger.debug("No limits are defined for network analysis map service")
            self.naserver_sd_files = dict.fromkeys(self.sync_na_helper_svc_names,
                                                   self._create_naserver_sd_file(svc_options, self.solver_types))

    def _create_gp_sd(self, sd_file_name, sd_draft_options, svc_props):
        """Create SD draft and a SD file for a GP service from a list of tool results.

        Args:
            sd_file_name: The name of the SD file without the .sd file extension.
            sd_draft_options: A dict of arguments to be used when creating the SD draft for the GP service. These are
                              arguments supported by arcpy.CreateGPSDDraft function.
            svc_props: A dict of service properties to update in the sddraft file.

        Returns:
            Full path of the created SD file.

        Raises:
            No Exceptions.

        """
        # Create SDDraft file from tool results
        sd_draft = os.path.join(self.service_definition_folder, f"{sd_file_name}.sddraft")
        sd_draft_options["out_sddraft"] = sd_draft
        if os.path.exists(sd_draft):
            self.logger.debug("Removing existing sddraft %s", sd_draft)
            os.remove(sd_draft)
        self.logger.debug("Creating sddraft file %s", sd_draft)

        sddraft_msgs = arcpy.CreateGPSDDraft(**sd_draft_options)
        self.logger.debug("GP service analyzer messages")
        self.logger.debug(pprint.pformat(sddraft_msgs, indent=2))
        self._modify_sddraft(sd_draft, svc_props)

        # Create SD file from sddraft file
        sd_file = os.path.join(self.service_definition_folder, f"{sd_file_name}.sd")
        if os.path.exists(sd_file):
            self.logger.debug("Removing existing sd file %s", sd_file)
            os.remove(sd_file)
        self.logger.debug("Creating sd file %s", sd_file)
        sd_result = arcpy.server.StageService(sd_draft, sd_file)
        self.logger.debug("Messages from StageService GP tool")
        self.logger.debug(sd_result.getMessages())
        return sd_file

    def _log_error_message_from_gp_tool(self):
        """Log error messages from GP tool execution."""
        try:
            # Add any ID messages from the tool execution as error message
            id_messages = {msg[1]: msg[2] for msg in arcpy.gp.GetAllMessages() if msg[1] > 0}
            for msg_id, msg_text in id_messages.items():
                msg_text = msg_text.split(f"{msg_id}: ")[-1]
                system_id_msg = arcpy.GetIDMessage(msg_id)
                msg_args = {}
                if "%" in system_id_msg:
                    # Replace %s, %1, or %2 with a regex that can extract the message arguments.
                    msg_regex = re.sub(r"%\w?", "(\\\\w+\\\\s*\\\\w+)", system_id_msg)
                    for index, msg_arg in enumerate(re.search(msg_regex, msg_text).groups()):
                        msg_args[f"add_argument{index + 1}"] = msg_arg
                err_msg = {"message_ID": msg_id}
                err_msg.update(msg_args)
                self.logger.error(msg_text, extra=err_msg)
        except Exception:  # pylint:disable=broad-exception-caught
            self.logger.debug("Error occured when logging id messages from running gp tool.", exc_info=True)

    def _run_gp_tool(self, tool_name, tool_params):
        """Run a GP tool using the provided parameters and return the result object.

        Args:
            tool_name: Name of the tool to run.
            tool_params: A dict of parameters to run the tool.

        Returns:
            A GP result object obtained after running the tool.

        Raises:
            No exceptions. If the tool fails, the tool failure exception is bubbled through the stack.

        """
        self.logger.info("Running %s tool", tool_name)
        # self.logger.debug("Parameters used to run tool: %s", json.dumps(tool_params, indent=2))
        tool = getattr(self.gp_svc_tbx, tool_name)
        try:
            result = tool(**tool_params)
        except Exception:
            self._log_error_message_from_gp_tool()
            self.logger.error("Failed to run %s tool", tool_name, extra={
                "message_ID": 30282,
                "add_argument1": tool_name
            })
            # self.logger.debug("DEBUG:::", exc_info=True)
            # self.logger.debug(arcpy.GetMessages())
            raise arcpy.ExecuteError("30282") from None
        self.logger.debug(result.getMessages())
        return result

    def _vrp_input_feature_set(self, input_type="Orders"):
        """Return an empty feature set or record for a vrp input type.
        Args:
            input_type: One of "Orders", "Depots" or "Routes"

        """
        # UNUSED
        # param_index = {
        #     "Orders": 0,
        #     "Depots": 1,
        #     "Routes": 2
        # }
        # input_fs = arcpy.GetParameterValue(f"SolveVehicleRoutingProblem_{self.gp_svc_tbx_alias}",
        #                                    param_index[input_type])
        # # We might end up with a corrupt feature set in certain cases
        # try:
        #     arcpy.management.DeleteRows(input_fs)
        #     return input_fs
        # except arcpy.ExecuteError:
        #     # DeleteRows can fail when the PRS tool is first run with only VRP as solver type and the PRS tool is
        #     # run again as part of the same process.
        #     self.logger.debug("Failed to delete input vrp %s feature set", input_type)
        # Get the feature set schema from the schema.gdb
        schema_fc = os.path.join(self.cwd, "data", "schema.gdb", f"VRP{input_type}")
        self.logger.debug("Getting the schema for input %s from feature class %s", input_type, schema_fc)
        if input_type == "Routes":
            input_fs = arcpy.RecordSet()
        else:
            input_fs = arcpy.FeatureSet()
        input_fs.load(schema_fc)
        return input_fs

    def _create_tool_inputs(self):
        """Create inputs used to run the solver geoprocessing tools and set them as self.input_points attribute."""
        self.logger.debug("Preparing inputs to run solver geoprocessing tools")
        self.logger.debug("Finding stops to use as tool inputs")
        # Use the first system junction as the input for gp services
        # For tools that require two points in one input class such as FindRoutes, repeat the same point twice.
        # For tools that need two input classes with one point in each class, use the same point in both input classes.
        # We are not using first two system junctions as there is no gurantee that a route will be found between first
        # two system junctions.
        system_junctions_feature_class = os.path.join(os.path.dirname(self.nd_describe.catalogPath),
                                                      self.nd_describe.systemJunctionSource.name)
        # Some network datasets may not have any system junctions
        sys_juncs_count = int(arcpy.management.GetCount(system_junctions_feature_class).getOutput(0))
        if sys_juncs_count:
            with arcpy.da.SearchCursor(system_junctions_feature_class,  # false positive. pylint:disable=no-member
                                       "SHAPE@") as cursor:
                first_point = cursor.next()[0]
                street_points = [first_point, first_point]
        else:
            # If we have zero system junctions, use the end point for the first edge from the first edge source
            edge_feature_class = os.path.join(os.path.dirname(self.nd_describe.catalogPath),
                                              self.nd_describe.edgeSources[0].name)
            point_sr = self.nd_describe.spatialReference
            with arcpy.da.SearchCursor(edge_feature_class, "SHAPE@") as cursor:  # pylint:disable=no-member
                first_edge = cursor.next()[0]
                first_point = arcpy.PointGeometry(first_edge.firstPoint, point_sr)
            street_points = [first_point, first_point]

        self.logger.debug("Creating stops to use when running geoprocessing tools")
        self.input_points = arcpy.CreateUniqueName("InputStops", "in_memory")
        arcpy.management.CopyFeatures(street_points, self.input_points)
        # Locate the points on the network in case the network dataset is licensed for only a sub-region.
        # For example, SMP dataset when licensed just for the state of California, still includes system junctions for
        # all of North America. The first system junction is in Hawaii most of the times. So we need to locate the first
        # system junction on the nearest street in California.
        # We also need to make sure we locate only on edge sources and not on junction sources as junction sources
        # such as the system junctions in a licensed datasets are not export protected. So if they are included in the
        # search criteria, the network location will still be based in Hawaii. The edge sources like streets are export
        # protected. So when locating on them, Network Analyst will only locate on the streets in the licesned
        # SMP region.
        search_criteria = self._get_network_search_criteria()
        self.logger.debug("Calculating locations on the network")
        arcpy.na.CalculateLocations(self.input_points, self.network_dataset, "25000 Miles", search_criteria)
        # Update the stop geometry based on location snapped on the network
        self.logger.debug("Updating stop geometries to snap on the network")
        with arcpy.da.UpdateCursor(self.input_points,  # False positive. pylint:disable=no-member
                                   ("SnapX", "SnapY", "SHAPE@")) as cursor:
            for row in cursor:
                row[-1] = arcpy.PointGeometry(arcpy.Point(row[0], row[1]), self.nd_describe.spatialReference)
                cursor.updateRow(row)

        # Prepare inputs used for VRP family tools
        with arcpy.da.SearchCursor(self.input_points, "SHAPE@") as input_points_cursor:  # pylint:disable=no-member
            first_point = input_points_cursor.next()[0]
        # Do not call VRP family tools with record set and feature sets as inputs since the published service will
        # include the input record set and feature sets used while publishing. Passing feature classes and tables as
        # inputs does not include them in the published services.
        if "VehicleRoutingProblem" in self.solver_types:
            vrp_orders_fc = arcpy.CreateUniqueName("VRPInputOrders", "in_memory")
            vrp_depots_fc = arcpy.CreateUniqueName("VRPInputDepots", "in_memory")
            vrp_routes_fc = arcpy.CreateUniqueName("VRPInputRoutes", "in_memory")
            # VRP Routes
            vrp_routes = arcpy.GetParameterValue(f"SolveVehicleRoutingProblem_{self.gp_svc_tbx_alias}", 2)
            arcpy.management.DeleteRows(vrp_routes)  # Can have rows if tool has already been run once.
            arcpy.management.CopyRows(vrp_routes, vrp_routes_fc)
            with arcpy.da.InsertCursor(vrp_routes_fc,  # False positive. pylint:disable=no-member
                                    ("Name", "StartDepotName", "EndDepotName", "MaxOrderCount",
                                        "CostPerUnitTime", "AssignmentRule")) as cursor:
                cursor.insertRow(("r", "d", "d", 30, 1, 1))
            # VRP Depots
            vrp_depots = arcpy.GetParameterValue(f"SolveVehicleRoutingProblem_{self.gp_svc_tbx_alias}", 1)
            arcpy.management.DeleteRows(vrp_depots)
            arcpy.management.CopyFeatures(vrp_depots, vrp_depots_fc)
            with arcpy.da.InsertCursor(vrp_depots_fc, ("SHAPE@", "Name")) as cursor:  # pylint:disable=no-member
                cursor.insertRow((first_point, "d"))
            # VRP Orders
            vrp_orders = arcpy.GetParameterValue(f"SolveVehicleRoutingProblem_{self.gp_svc_tbx_alias}", 0)
            arcpy.management.DeleteRows(vrp_orders)
            arcpy.management.CopyFeatures(vrp_orders, vrp_orders_fc)
            with arcpy.da.InsertCursor(vrp_orders_fc, ("SHAPE@",  # False positive. pylint:disable=no-member
                                                    "Name", "AssignmentRule")) as cursor:
                cursor.insertRow((first_point, "o", 3))
            self.vrp_inputs = {
                "orders": vrp_orders_fc,
                "depots": vrp_depots_fc,
                "routes": vrp_routes_fc
            }
        if "LastMileDelivery" in self.solver_types:
            lmd_orders_fc = arcpy.CreateUniqueName("LMDInputOrders", "in_memory")
            lmd_depots_fc = arcpy.CreateUniqueName("LMDInputDepots", "in_memory")
            lmd_routes_fc = arcpy.CreateUniqueName("LMDInputRoutes", "in_memory")
            # LMD Routes
            lmd_routes = arcpy.GetParameterValue(f"SolveLastMileDelivery_{self.gp_svc_tbx_alias}", 2)
            arcpy.management.DeleteRows(lmd_routes)  # Can have rows if tool has already been run once.
            arcpy.management.CopyRows(lmd_routes, lmd_routes_fc)
            with arcpy.da.InsertCursor(lmd_routes_fc,  # False positive. pylint:disable=no-member
                                    ("Name", "StartDepotName", "EndDepotName", "MaxTotalTime",
                                        "EarliestStartDate", "EarliestStartTime")) as cursor:
                cursor.insertRow(("r", "d", "d", 480, datetime.datetime.now().date(), "08:00:00"))
            # LMD Depots
            lmd_depots = arcpy.GetParameterValue(f"SolveLastMileDelivery_{self.gp_svc_tbx_alias}", 1)
            arcpy.management.DeleteRows(lmd_depots)
            arcpy.management.CopyFeatures(lmd_depots, lmd_depots_fc)
            with arcpy.da.InsertCursor(lmd_depots_fc, ("SHAPE@", "Name")) as cursor:  # pylint:disable=no-member
                cursor.insertRow((first_point, "d"))
            # LMD Orders
            lmd_orders = arcpy.GetParameterValue(f"SolveLastMileDelivery_{self.gp_svc_tbx_alias}", 0)
            arcpy.management.DeleteRows(lmd_orders)
            arcpy.management.CopyFeatures(lmd_orders, lmd_orders_fc)
            with arcpy.da.InsertCursor(lmd_orders_fc, ("SHAPE@",  # False positive. pylint:disable=no-member
                                                    "Name")) as cursor:
                cursor.insertRow((first_point, "o"))
            self.lmd_inputs = {
                "orders": lmd_orders_fc,
                "depots": lmd_depots_fc,
                "routes": lmd_routes_fc
            }

    def _run_solver_gp_tools(self, exclude_tools=None):
        """Run solver GP tools and return a list of tool results.

        Args:
            exclude_tools: A list of solver tool names that should not be run. If None, run all tools.

        Returns:
            A list of result objects for the tools that were run.

        """
        if not exclude_tools:
            exclude_tools = []
        # Create input points if they do not exist.
        if not self.input_points:
            self._create_tool_inputs()

        # Prepare the parameters required to run the tools
        solver_tools = {  # tool name and their parameters
            "FindRoutes": {
                "Stops": self.input_points,
                "Network_Datasets": self.network_datasets,
                "Network_Dataset_Extents": self.nd_extents_layer_name,
                "Output_Names": [
                    ["OUTPUT_ROUTES", "ROutputRoutes"],
                    ["OUTPUT_ROUTE_EDGES", "ROutputRouteEdges"],
                    ["OUTPUT_DIRECTIONS", "ROutputDirections"],
                    ["OUTPUT_STOPS", "ROutputStops"],
                    ["OUTPUT_DIRECTION_POINTS", "ROutputDirectionPoints"],
                    ["OUTPUT_DIRECTION_LINES", "ROutputDirectionLines"],
                ],
                "Analysis_Limits": self.solver_tools_limits_param.get("FindRoutes", None)
            },
            "FindClosestFacilities": {
                "Facilities": self.input_points,
                "Incidents": self.input_points,
                "Network_Datasets": self.network_datasets,
                "Network_Dataset_Extents": self.nd_extents_layer_name,
                "Output_Names": [
                    ["OUTPUT_ROUTES", "CFOutputRoutes"],
                    ["OUTPUT_DIRECTIONS", "CFOutputDirections"],
                    ["OUTPUT_CLOSEST_FACILITIES", "CFOutputClosestFacilities"],
                    ["OUTPUT_FACILITIES", "CFOutputFacilities"],
                    ["OUTPUT_INCIDENTS", "CFOutputIncidents"],
                    ["OUTPUT_DIRECTION_POINTS", "CFOutputDirectionPoints"],
                    ["OUTPUT_DIRECTION_LINES", "CFOutputDirectionLines"],
                ],
                "Analysis_Limits": self.solver_tools_limits_param.get("FindClosestFacilities", None)
            },
            "GenerateServiceAreas": {
                "Facilities": self.input_points,
                "Network_Datasets": self.network_datasets,
                "Network_Dataset_Extents": self.nd_extents_layer_name,
                "Output_Names": [
                    ["OUTPUT_SERVICE_AREAS", "SAOutputServiceAreas"],
                    ["OUTPUT_SERVICE_AREA_LINES", "SAOutputServiceAreaLines"],
                    ["OUTPUT_FACILITIES", "SAOutputServiceAreaFacilities"]
                ],
                "Analysis_Limits": self.solver_tools_limits_param.get("GenerateServiceAreas", None)
            },
            "SolveLocationAllocation": {
                "Facilities": self.input_points,
                "Demand_Points": self.input_points,
                "Network_Datasets": self.network_datasets,
                "Network_Dataset_Extents": self.nd_extents_layer_name,
                "Output_Names": [
                    ["OUTPUT_ALLOCATION_LINES", "LAOutputAllocationLines"],
                    ["OUTPUT_FACILITIES", "LAOutputFacilities"],
                    ["OUTPUT_DEMAND_POINTS", "LAOutputDemandPoints"]
                ],
                "Analysis_Limits": self.solver_tools_limits_param.get("SolveLocationAllocation", None)
            },
            "GenerateOriginDestinationCostMatrix": {
                "Origins": self.input_points,
                "Destinations": self.input_points,
                "Network_Datasets": self.network_datasets,
                "Network_Dataset_Extents": self.nd_extents_layer_name,
                "Output_Names": [
                    ["OUTPUT_ORIGIN_DESTINATION_LINES", "ODCMOutputODLines"],
                    ["OUTPUT_ORIGINS", "ODCMOutputOrigins"],
                    ["OUTPUT_DESTINATIONS", "ODCMOutputDestinations"]
                ],
                "Analysis_Limits": self.solver_tools_limits_param.get("GenerateOriginDestinationCostMatrix", None)
            },
            "SolveVehicleRoutingProblem": {
                "orders": self.vrp_inputs.get("orders", ""),
                "depots": self.vrp_inputs.get("depots", ""),
                "routes": self.vrp_inputs.get("routes", ""),
                "Network_Datasets": self.network_datasets,
                "Network_Dataset_Extents": self.nd_extents_layer_name,
                "output_names": [
                    ["OUTPUT_ROUTES", "VRPOutputRoutes"],
                    ["OUTPUT_DIRECTIONS", "VRPOutputDirections"],
                    ["OUTPUT_Stops", "VRPOutputStops"],
                    ["OUTPUT_UNASSIGNED_STOPS", "VRPOutputUnassignedStops"]
                ],
                "analysis_limits": self.solver_tools_limits_param.get("SolveVehicleRoutingProblem", None)
            },
            "EditVehicleRoutingProblem": {
                "orders": self.vrp_inputs.get("orders", ""),
                "depots": self.vrp_inputs.get("depots", ""),
                "routes": self.vrp_inputs.get("routes", ""),
                "Network_Datasets": self.network_datasets,
                "Network_Dataset_Extents": self.nd_extents_layer_name,
                "output_names": [
                    ["OUTPUT_ROUTES", "VRPOutputRoutes"],
                    ["OUTPUT_DIRECTIONS", "VRPOutputDirections"],
                    ["OUTPUT_Stops", "VRPOutputStops"],
                    ["OUTPUT_UNASSIGNED_STOPS", "VRPOutputUnassignedStops"]
                ],
                "analysis_limits": self.solver_tools_limits_param.get("EditVehicleRoutingProblem", None)
            },
            "SolveLastMileDelivery": {
                "orders": self.lmd_inputs.get("orders", ""),
                "depots": self.lmd_inputs.get("depots", ""),
                "routes": self.lmd_inputs.get("routes", ""),
                "network_datasets": self.network_datasets,
                "network_dataset_extents": self.nd_extents_layer_name,
                "output_names": [
                    ["OUTPUT_ORDERS", "LMDOutputOrders"],
                    ["OUTPUT_ROUTES", "LMDOutputRoutes"],
                    ["OUTPUT_DEPOTS", "LMDOutputDepots"],
                    ["OUTPUT_DEPOT_VISITS", "LMDOutputDepotVisits"],
                    ["OUTPUT_DIRECTION_POINTS", "LMDOutputDirectionPoints"],
                    ["OUTPUT_DIRECTION_LINES", "LMDOutputDirectionLines"],
                ],
                "analysis_limits": self.solver_tools_limits_param.get("SolveLastMileDelivery", None)
            },
            "SnapToRoads": {
                "points": self.input_points,
                "network_datasets": self.network_datasets,
                "network_dataset_extents": self.nd_extents_layer_name,
                "output_names": [
                    ["OUTPUT_SNAPPED_POINTS", "STOROutputSnappedPoints"],
                    ["OUTPUT_Lines", "STOROutputLines"]
                ],
                "analysis_limits": self.solver_tools_limits_param.get("SnapToRoads", None)
            }
        }

        # Update the default values from the config file
        for tool_name, default_values in self.config_gp_tool_options["defaultValues"].items():
            if tool_name in solver_tools and tool_name not in exclude_tools:
                solver_tools[tool_name].update(self._transform_solver_tool_default_values(tool_name, default_values))
        # Run geoprocessing tools that should be included in the GP service.
        return [self._run_gp_tool(solver_tool, tool_params)
                for solver_tool, tool_params in solver_tools.items()
                if solver_tool not in exclude_tools]

    def _transform_solver_tool_default_values(self, tool_name, default_values):
        """Convert default values for solver tools from JSON to tool parameter value.

        Args:
            tool_name: Name of the solver tool.
            default_values: A dict containing the default values for the solver tool defined in the config file and
                            processed using self._config_gp_tool_options()

        Returns:
            Default values dict that can be used to execute the solver tool.

        """
        # Locate Settings
        locate_settings_prop_name = ""
        if "locate_settings" in default_values:
            locate_settings_prop_name = "locate_settings"
        elif "Locate_Settings" in default_values:
            locate_settings_prop_name = "Locate_Settings"
        if locate_settings_prop_name:
            locate_settings = default_values[locate_settings_prop_name]
            default_locate_settings = locate_settings.get("default", {})
            if default_locate_settings and "sources" not in default_locate_settings:
                route_so = arcpy.nax.Route(self.network_dataset)
                default_locate_settings["sources"] = json.loads(route_so._locateSettingsJson)["default"]["sources"]
                del route_so
            default_values[locate_settings_prop_name] = json.dumps(locate_settings)

        # Travel mode
        travel_mode_prop_name = ""
        if "travel_mode" in default_values:
            travel_mode_prop_name = "travel_mode"
        elif "Travel_Mode" in default_values:
            travel_mode_prop_name = "Travel_Mode"
        if travel_mode_prop_name:
            travel_mode = default_values[travel_mode_prop_name]
            if travel_mode and isinstance(travel_mode, dict):
                default_values[travel_mode_prop_name] = json.dumps(travel_mode)

        # Polygon Trim Distance
        polygon_trim_distance = default_values.get("Polygon_Trim_Distance", {})
        if polygon_trim_distance:
            # need to conver values to be like "100 Meters"
            default_values["Polygon_Trim_Distance"] = (f"{polygon_trim_distance['distance']} "
                                                       f"{polygon_trim_distance['units'].replace('esri', '')}")

        # Time_of_Day or default_date
        date_time_prop_name = ""
        if "Time_of_Day" in default_values:
            date_time_prop_name = "Time_of_Day"
        elif "default_date" in default_values:
            date_time_prop_name = "default_date"
        if date_time_prop_name:
            milliseconds = default_values[date_time_prop_name]
            if milliseconds:
                default_values[date_time_prop_name] = datetime.datetime.fromtimestamp(int(milliseconds) / 1000,
                                                                                      datetime.timezone.utc)
        # road_properties on snap_to_roads
        if tool_name == "SnapToRoads":
            road_properties = default_values.get("road_properties", "")
            if isinstance(road_properties, dict):
                default_values["road_properties"] = json.dumps(road_properties)

        # For SolveLocationAllocation tool to succeed, the count of features in input Facilities must be greater or
        # equal to Number_of_Facilities_to_Find
        if tool_name == "SolveLocationAllocation":
            num_facilities_to_find = default_values.get("Number_of_Facilities_to_Find", 1)
            facility_count = int(arcpy.management.GetCount(self.input_points).getOutput(0))
            if num_facilities_to_find > facility_count:
                input_la_facilities = arcpy.CreateUniqueName("InputLocationAllocationFacilities", "in_memory")
                arcpy.management.CopyFeatures(self.input_points, input_la_facilities)
                arcpy.management.Append([self.input_points for i in range(num_facilities_to_find // facility_count)],
                                        input_la_facilities)
                default_values["Facilities"] = input_la_facilities

        return default_values

    def _get_constant_params(self):
        """Return a list of parameter names from solver tools whose input mode is set as constants in the GP service."""
        common_constant_params = ["Network_Datasets", "Network_Dataset_Extents", "Output_Geodatabase", "Output_Names",
                                  "Analysis_Limits"]
        common_vrp_const_params = ["Network_Datasets", "Network_Dataset_Extents", "output_geodatabase",
                                   "output_names", "analysis_limits"]
        common_lmd_const_params = ["network_datasets", "network_dataset_extents", "output_geodatabase",
                                   "output_names", "analysis_limits"]
        config_const_params = self.config_gp_tool_options["constantParameters"]

        # For readability. pylint:disable=line-too-long
        constant_params = {
            "GenerateServiceAreas": common_constant_params + config_const_params.get("GenerateServiceAreas", []),
            "FindRoutes": common_constant_params + config_const_params.get("FindRoutes", []),
            "FindClosestFacilities": common_constant_params + config_const_params.get("FindClosestFacilities", []),
            "GenerateOriginDestinationCostMatrix": common_constant_params + config_const_params.get("GenerateOriginDestinationCostMatrix", []),  # noqa
            "SolveLocationAllocation": common_constant_params + config_const_params.get("SolveLocationAllocation", []),
            "SolveVehicleRoutingProblem": common_vrp_const_params + config_const_params.get("SolveVehicleRoutingProblem", []),  # noqa
            "EditVehicleRoutingProblem": common_vrp_const_params + config_const_params.get("EditVehicleRoutingProblem", []),  # noqa
            "SolveLastMileDelivery": common_lmd_const_params + config_const_params.get("SolveLastMileDelivery", []),  # noqa
            "SnapToRoads": common_lmd_const_params + config_const_params.get("SnapToRoads", [])
        }
        # pylint:enable=line-too-long
        constant_values = []
        for tool, params in constant_params.items():
            for param_name in params:
                constant_values.append(f"{tool}.{param_name}")
        return constant_values

    def _get_choice_lists(self):
        """Return the choiceLists parameter supported by arcpy.CreateGPSDDraft."""
        choice_lists = self.config_gp_tool_options["choiceLists"]
        if not choice_lists:
            return None
        return choice_lists

    def _get_network_search_criteria(self):
        """Return the search criteria for a network dataset that can be used with Calculate Locations GP tool."""
        # Determine if a network source defines subtypes. The search criteria needs to be specified for each subtype
        # using the following pattern ["SourceName : subtype description", "SHAPE"]

        tmp_search_criteria = []
        search_criteria = []
        nds_fds_path = os.path.dirname(self.nd_describe.catalogPath)
        nds_info = NDSInfo(self.network_dataset)
        non_locatable_sources = nds_info.non_locatable_sources
        for src in self.nd_describe.sources:
            src_element_type = src.elementType
            if src_element_type not in ("Edge", "Junction"):
                continue
            src_name = src.name
            if src_name in non_locatable_sources:
                continue
            src_path = os.path.join(nds_fds_path, src_name)
            src_desc = arcpy.Describe(src_path)
            if src_desc.subTypeFieldName:
                # Get the description of subtype codes
                src_sub_types = arcpy.da.ListSubtypes(src_path)  # False positive. pylint:disable=no-member
                for code in src_sub_types:
                    sub_type_description = src_sub_types[code]["Name"]
                    tmp_search_criteria.append([f"{src_name} : {sub_type_description}", src_element_type])
            else:
                tmp_search_criteria.append([src_name, src_element_type])
        # Set shape type for all edge sources to be SHAPE and NONE for all junction sources
        for criteria in tmp_search_criteria:
            shape_type = "SHAPE" if criteria[-1] == "Edge" else "NONE"
            search_criteria.append([criteria[0], shape_type])
        return search_criteria

    def _create_nautils_gp_sd_file(self):
        """Create service defintion file for network analysis utilities geoprocessing service."""
        # Do not create the SD file if properties cannot be read from the config file.
        try:
            svc_props = self.config["routingServices"]["gpServices"]["routingUtilities"]["serviceProperties"]
        except KeyError:
            return
        # Create supporting files required by GetToolInfo and GetTravelMode tools.
        self.logger.debug("Creating supporting files used by network analysis utility tools.")
        try:
            # Check if we have a folder containing localized travel modes. Assume this folder to be in the same folder
            # as the template network dataset.
            ltm_folder = os.path.join(os.path.dirname(self.nd_workspace), "Travel_Modes_Localization")
            ltm_folder = ltm_folder if os.path.exists(ltm_folder) else None
            self.logger.debug("Localized travel modes folder: %s", ltm_folder)
            csf_tool = ndsf.CreateSupportingFiles(network_datasets=self.network_dataset,
                                                  supporting_files_folder=self.service_definition_folder,
                                                  localized_travel_modes_folder=ltm_folder)
            csf_tool.execute()
        except Exception:
            self.logger.error("Failed to create supporting files required by the network analysis utility "
                              "geoprocessing service.", extra={
                                  "message_ID": 30283
                              })
            self.logger.debug("Error details:", exc_info=True)
            raise arcpy.ExecuteError from None
        self.logger.debug("Tool info file: %s", csf_tool.toolInfoFile)
        self.logger.debug("Travel modes file: %s", csf_tool.travelModesFile)
        if ltm_folder:
            self.logger.debug("Localized travel modes file: %s", csf_tool.localizedTravelModesFile)

        # Update tool limits in the tool info file
        if self.gp_service_limits:
            self.logger.debug("Updating tool info file with limits from the config file.")
            with open(csf_tool.toolInfoFile, "r", encoding="utf-8") as tool_info_fp:
                tool_info_json = json.load(tool_info_fp)
            tool_info_limits = tool_info_json["serviceLimits"]
            tool_info_limits.update(self.gp_service_limits)
            with open(csf_tool.toolInfoFile, "w", encoding="utf-8") as tool_info_fp:
                json.dump(tool_info_json, tool_info_fp, sort_keys=True, indent=2, ensure_ascii=False)

        # Run the GP tools
        self.logger.info("Running tools to be included in the network analysis utility geoprocessing service.")
        supporting_files_param = [["defaultTravelModes", csf_tool.travelModesFile]]
        if os.path.exists(csf_tool.localizedTravelModesFile):
            supporting_files_param.append(["localizedTravelModes", csf_tool.localizedTravelModesFile])
        utility_tools = {
            "GetToolInfo": {
                "toolInfoFile": csf_tool.toolInfoFile,
            },
            "GetTravelModes": {
                "supportingFiles": supporting_files_param,
            }
        }
        tool_results = [self._run_gp_tool(tool, tool_params) for tool, tool_params in utility_tools.items()]

        # Create SDDraft file from tool results and then create the sd file from sddraft
        sd_file_name = f"{svc_props['serviceName']}_GPServer"
        self.logger.info("Creating service definition file, %s.sd, for network analysis utility geoprocessing service",
                         sd_file_name)
        config_const_params = []
        for tool_name in ("GetToolInfo", "GetTravelModes"):
            for param_name in self.config_gp_tool_options["constantParameters"].get(tool_name, []):
                config_const_params.append(f"{tool_name}.{param_name}")

        sd_draft_options = {
            "result": tool_results,
            "out_sddraft": sd_file_name,
            "service_name": svc_props['serviceName'],
            "server_type": "ARCGIS_SERVER",
            "copy_data_to_server": True,
            "folder_name": self.service_folder,
            "showMessages": "Warning",
            "executionType": "Synchronous",
            "maximumRecords": svc_props.get("maximumRecords", 1000),
            "summary": svc_props.get("summary", ""),
            "tags": svc_props.get("tags", ""),
            "constantValues": [
                "GetToolInfo.toolInfoFile",
                "GetTravelModes.supportingFiles"
            ] + config_const_params
        }
        self.nau_gp_sd_file = {
            "routingUtilities": self._create_gp_sd(sd_file_name, sd_draft_options, svc_props)
        }

    def _create_async_gp_sd_files(self):
        """Create SD file for the network analysis asynchronous geoprocessing service."""
        if self.dedicated_service:
            gp_svcs_props = self.config["routingServices"]["gpServices"]
            for svc_type in self.ASYNC_GP_HELPER_SVC_NAMES:
                self.na_async_gp_sd_files[svc_type] = ""
                if svc_type not in gp_svcs_props:
                    continue
                svc_props = gp_svcs_props[svc_type]["serviceProperties"]
                solver_type = self.HELPER_SERVICES_SOLVER_TYPES[svc_type]
                if solver_type in self.solver_types:
                    sd_file_name = f"{svc_props['serviceName']}_GPServer"
                    exclude_tools = list(self.SYNC_SOLVER_TOOLS.values()) + list(self.ASYNC_SOLVER_TOOLS.values())
                    # Some dedicated service such as asyncVRP in AGOL prs config file can have more than one tool
                    # in the service.
                    for solver_tool in gp_svcs_props[svc_type]["toolProperties"].keys():
                        exclude_tools.remove(solver_tool)
                    self.logger.info("Running tools to be included in the %s async geoprocessing service.",
                                     svc_props["serviceName"])
                    sd_draft_options = {
                        "result": self._run_solver_gp_tools(exclude_tools=exclude_tools),
                        "out_sddraft": sd_file_name,
                        "service_name": svc_props["serviceName"],
                        "server_type": "ARCGIS_SERVER",
                        "copy_data_to_server": False,
                        "folder_name": self.service_folder,
                        "showMessages": "Warning",
                        "executionType": "Asynchronous",
                        "maximumRecords": svc_props.get("maximumRecords", 1000),
                        "summary": svc_props.get("summary", ""),
                        "tags": svc_props.get("tags", ""),
                        "constantValues": self._get_constant_params(),
                        "choiceLists": self._get_choice_lists(),
                    }
                    self.logger.info("Creating service definition file, %s.sd, for async %s "
                                     "geoprocessing service", sd_file_name, solver_type)
                    self.na_async_gp_sd_files[svc_type] = self._create_gp_sd(sd_file_name, sd_draft_options, svc_props)
        else:
            try:
                svc_props = self.config["routingServices"]["gpServices"]["asyncNetworkAnalysis"]["serviceProperties"]
            except KeyError:
                return
            sd_file_name = f"{svc_props['serviceName']}_GPServer"
            exclude_tools = [tool_name for solver_type, tool_name in self.ASYNC_SOLVER_TOOLS.items()
                             if solver_type not in self.solver_types]
            exclude_tools += self.SYNC_SOLVER_TOOLS.values()
            self.logger.info("Running tools to be included in the %s async geoprocessing service.",
                             svc_props["serviceName"])
            sd_draft_options = {
                "result": self._run_solver_gp_tools(exclude_tools=exclude_tools),
                "out_sddraft": sd_file_name,
                "service_name": svc_props["serviceName"],
                "server_type": "ARCGIS_SERVER",
                "copy_data_to_server": False,
                "folder_name": self.service_folder,
                "showMessages": "Warning",
                "executionType": "Asynchronous",
                "maximumRecords": svc_props.get("maximumRecords", 1000),
                "summary": svc_props.get("summary", ""),
                "tags": svc_props.get("tags", ""),
                "constantValues": self._get_constant_params(),
                "choiceLists": self._get_choice_lists(),
            }
            self.logger.info("Creating service definition file, %s.sd, for async network analysis "
                             "geoprocessing service", sd_file_name)
            self.na_async_gp_sd_files = dict.fromkeys(self.ASYNC_GP_HELPER_SVC_NAMES,
                                                      self._create_gp_sd(sd_file_name, sd_draft_options, svc_props))

    def _create_sync_gp_sd_files(self):
        """Create SD file for the network analysis synchronous geoprocessing service."""
        # Create SDDraft file from tool results and then create the sd file from sddraft
        if self.dedicated_service:
            gp_svcs_props = self.config["routingServices"]["gpServices"]
            for svc_type in self.SYNC_GP_HELPER_SVC_NAMES:
                self.na_sync_gp_sd_files[svc_type] = ""
                if svc_type not in gp_svcs_props:
                    continue
                svc_props = gp_svcs_props[svc_type]["serviceProperties"]
                solver_type = self.HELPER_SERVICES_SOLVER_TYPES[svc_type]
                if solver_type in self.solver_types:
                    sd_file_name = f"{svc_props['serviceName']}_GPServer"
                    exclude_tools = list(self.ASYNC_SOLVER_TOOLS.values()) + \
                                    [v for k,v in self.SYNC_SOLVER_TOOLS.items() if k != solver_type]

                    self.logger.info("Running tools to be included in the %s synchronous geoprocessing service.",
                                     svc_props["serviceName"])
                    sd_draft_options = {
                        "result": self._run_solver_gp_tools(exclude_tools=exclude_tools),
                        "out_sddraft": sd_file_name,
                        "service_name": svc_props["serviceName"],
                        "server_type": "ARCGIS_SERVER",
                        "copy_data_to_server": False,
                        "folder_name": self.service_folder,
                        "showMessages": "Warning",
                        "executionType": "Synchronous",
                        "maximumRecords": svc_props.get("maximumRecords", 1000),
                        "summary": svc_props.get("summary", ""),
                        "tags": svc_props.get("tags", ""),
                        "constantValues": self._get_constant_params(),
                        "choiceLists": self._get_choice_lists(),
                    }
                    self.logger.info("Creating service definition file, %s.sd, for sync %s "
                                     "geoprocessing service", sd_file_name, solver_type)
                    self.na_sync_gp_sd_files[svc_type] = self._create_gp_sd(sd_file_name, sd_draft_options, svc_props)
        else:
            # Do not create sync service if poperties cannot be read from the config file
            try:
                svc_props = self.config["routingServices"]["gpServices"]["syncNetworkAnalysis"]["serviceProperties"]
            except KeyError:
                return
            # Do not create sync service if VRP or SnapToRoads solver type is not requested
            if set(self.SYNC_SOLVER_TOOLS.keys()).isdisjoint(set(self.solver_types)):
                return
            sd_file_name = f"{svc_props['serviceName']}_GPServer"
            exclude_tools = list(self.ASYNC_SOLVER_TOOLS.values()) + [v for k,v in self.SYNC_SOLVER_TOOLS.items()
                                                                      if k not in self.solver_types]
            self.logger.info("Running tools to be included in the network analysis sync geoprocessing service.")
            sd_draft_options = {
                "result": self._run_solver_gp_tools(exclude_tools=exclude_tools),
                "out_sddraft": sd_file_name,
                "service_name": svc_props["serviceName"],
                "server_type": "ARCGIS_SERVER",
                "copy_data_to_server": False,
                "folder_name": self.service_folder,
                "showMessages": "Warning",
                "executionType": "Synchronous",
                "maximumRecords": svc_props.get("maximumRecords", 1000),
                "summary": svc_props.get("summary", ""),
                "tags": svc_props.get("tags", ""),
                "constantValues": self._get_constant_params(),
                "choiceLists": self._get_choice_lists(),
            }
            self.logger.info("Creating service definition file, %s.sd, for sync network analysis geoprocessing service",
                            sd_file_name)
            self.na_sync_gp_sd_files = dict.fromkeys(self.SYNC_GP_HELPER_SVC_NAMES,
                                                    self._create_gp_sd(sd_file_name, sd_draft_options, svc_props))

    def _create_traffic_map_sd_file(self):
        """Create SD file for the traffic map service."""
        # Do not create the SD file if properties cannot be read from the config file.
        try:
            svc_props = self.config["routingServices"]["mapServices"]["traffic"]["serviceProperties"]
        except KeyError:
            return
        map_svc_name = svc_props["serviceName"]
        sd_file = os.path.join(self.service_definition_folder, f"{map_svc_name}_MapServer.sd")
        self.logger.info("Creating service definition file, %s, for traffic map service.", os.path.basename(sd_file))

        # Get the Pro project containing all the traffic layers
        aprx_file = svc_props.get("aprxPath", "")
        if not os.path.exists(aprx_file):
            self.logger.warning("Cannot create traffic map service since the traffic project %s does not exist.",
                                aprx_file)
            return
        # Create a sharing draft from the project and set service properties
        aprx = arcpy.mp.ArcGISProject(aprx_file)
        current_map = aprx.listMaps("*")[0]
        sharing_draft = arcpy.sharing.CreateSharingDraft("STANDALONE_SERVER", "MAP_SERVICE", map_svc_name, current_map)
        sharing_draft.offline = True
        sharing_draft.offlineTarget = "ENTERPRISE_11"
        sharing_draft.summary = svc_props.get("summary", "")
        sharing_draft.tags = svc_props.get("tags", "")
        sharing_draft.description = svc_props.get("description", "")
        sharing_draft.credits = svc_props.get("credits", "")
        sharing_draft.useLimitations = svc_props.get("useLimitations", "")
        sharing_draft.copyDataToServer = False
        sharing_draft.serverFolder = self.service_folder
        map_sddraft_file = os.path.join(self.service_definition_folder, f"{map_svc_name}.sddraft")
        self.logger.debug("Saving sddraft file for map service at %s", map_sddraft_file)
        sharing_draft.exportToSDDraft(map_sddraft_file)
        self._modify_sddraft(map_sddraft_file, svc_props)
        # Create SD file from the sharing draft file
        if os.path.exists(sd_file):
            self.logger.debug("Removing existing map service definition file %s", sd_file)
            os.remove(sd_file)
        self.logger.debug("Saving map service definition file at %s", sd_file)
        sd_result = arcpy.server.StageService(map_sddraft_file, sd_file)
        self.logger.debug("Messages from StageService GP tool")
        self.logger.debug(sd_result.getMessages())
        self.traffic_map_sd_file = {
            "traffic": sd_file
        }

    def _publish_sd(self):
        """Publish services from SD files."""
        def _publish(sd_file, svc_props=None):
            """Publish the sd_file and return the url of the published service."""
            self.logger.info("Publishing %s as a service", os.path.basename(sd_file))
            # Adding it before successful publishing since we do want to repeat publishing a failed SD.
            published_sd_files.append(sd_file)
            svc_url = ""
            try:
                svc_info = self.ags_admin_dir.publish_service_definition(sd_file, svc_props)
                svc_url = svc_info["svcUrls"]["RESTUrl"]
            except agsadmin.HTTPError as ex:
                self.logger.warning("The following error occurred when trying to publish %s: %s",
                                    os.path.basename(sd_file), ex.reason)
                self.logger.debug("Error details: ", exc_info=True)
            except arcpy.ExecuteError:
                # ags_admindir.publish_service_definition already writes a logger.error message before raising
                # arcpy.ExecuteError. Handling this exception so that we can continue publishing other services.
                pass
            return svc_url

        self.logger.info("Publishing services from service definition files.")
        published_sd_files = []
        svc_url = ""
        # NA Map Services
        for helper_svc_name, sd_file in self.naserver_sd_files.items():
            if not sd_file:
                continue
            # Need to account for traffic helper service.
            solver_type = self.HELPER_SERVICES_SOLVER_TYPES.get(helper_svc_name, "traffic")
            if sd_file in published_sd_files:
                if solver_type in self.solver_types or solver_type == "traffic":
                    self.na_map_services[helper_svc_name] = svc_url
            else:
                if self.dedicated_service:
                    # we do not have traffic service in dedicated mode as only AGOL can publish the correct traffic
                    # service
                    if helper_svc_name == "traffic":
                        self.logger.debug("No traffic service in dedicated mode.")
                        continue
                    svc_props = self.config["routingServices"]["mapServices"][helper_svc_name]["serviceProperties"]
                else:
                    svc_props = self.config["routingServices"]["mapServices"]["networkAnalysis"]["serviceProperties"]
                svc_url = _publish(sd_file, svc_props)
                if solver_type in self.solver_types or solver_type == "traffic":
                    self.na_map_services[helper_svc_name] = svc_url

        # NA Utilities GP service. Always a single SD file irrespective of tenancy
        if "routingUtilities" in self.nau_gp_sd_file:
            self.na_utils_gp_service["routingUtilities"] = _publish(self.nau_gp_sd_file["routingUtilities"],
                                                                    self.config["routingServices"]["gpServices"]["routingUtilities"]["serviceProperties"])  # noqa pylint:disable=line-too-long

        # Traffic map service
        if "traffic" in self.traffic_map_sd_file:
            self.traffic_map_service["traffic"] = _publish(self.traffic_map_sd_file["traffic"],
                                                           self.config["routingServices"]["mapServices"]["traffic"]["serviceProperties"])  # noqa pylint:disable=line-too-long

        # NA async GP service
        for helper_svc_name, sd_file in self.na_async_gp_sd_files.items():
            if not sd_file:
                continue
            solver_type = self.HELPER_SERVICES_SOLVER_TYPES[helper_svc_name]
            if sd_file in published_sd_files:
                if solver_type in self.solver_types:
                    self.na_async_gp_services[helper_svc_name] = svc_url
            else:
                if self.dedicated_service:
                    svc_props = self.config["routingServices"]["gpServices"][helper_svc_name]["serviceProperties"]
                else:
                    svc_props = self.config["routingServices"]["gpServices"]["asyncNetworkAnalysis"]["serviceProperties"]  # noqa pylint:disable=line-too-long
                svc_url = _publish(sd_file, svc_props)
                if solver_type in self.solver_types:
                    self.na_async_gp_services[helper_svc_name] = svc_url

        # NA sync GP service
        for helper_svc_name, sd_file in self.na_sync_gp_sd_files.items():
            if not sd_file:
                continue
            solver_type = self.HELPER_SERVICES_SOLVER_TYPES[helper_svc_name]
            if sd_file in published_sd_files:
                if solver_type in self.solver_types:
                    self.na_sync_gp_services[helper_svc_name] = svc_url
            else:
                if self.dedicated_service:
                    svc_props = self.config["routingServices"]["gpServices"][helper_svc_name]["serviceProperties"]
                else:
                    svc_props = self.config["routingServices"]["gpServices"]["syncNetworkAnalysis"]["serviceProperties"]
                svc_url = _publish(sd_file, svc_props)
                if solver_type in self.solver_types:
                    self.na_sync_gp_services[helper_svc_name] = svc_url

    def _check_owning_system_url(self):
        """Check if the owning system URL can be used to make sharing API calls.

        The caller should catch any exceptions when calling this method and treat them as terminating.

        """
        # Check if the sharing API calls can be made using owning system URL. This will not work with owning system url
        # has web tier authentication. In such cases, try to use the private portal URL and quit if even that fails.
        sharing_root_url = f"{self.owning_system_url}/sharing/rest"
        try:
            self.ags_admin_dir.make_http_request(sharing_root_url)
        except arcpy.ExecuteError:
            raise
        except Exception:  # Same handler applicable for all exceptions. pylint:disable=broad-except
            # Portal might be using web tier authentication. Try using private portal url
            self.logger.debug("Determining the private portal url")
            server_security_config = self.ags_admin_dir.make_http_request(f"{self.server_url}/admin/security/config")
            self.owning_system_url = server_security_config["portalProperties"]["privatePortalUrl"]
            sharing_root_url = f"{self.owning_system_url}/sharing/rest"
            self.logger.debug("Checking if the sharing API can be accessed using the private portal URL, %s",
                              sharing_root_url)
            # If this fails, the caller needs to quit.
            self.ags_admin_dir.make_http_request(sharing_root_url)

    def _share_services(self):
        """Share services with everyone in the organization."""
        self.logger.debug("Sharing services with everyone in the organization.")
        self.logger.debug("Making sharing API calls using %s", self.owning_system_url)
        # Get a list of service URLs from the service folder on the ArcGIS Server site
        service_folder_url = f"{self.ags_admin_dir.root_url}/services/{self.service_folder}"
        service_folder_response = self.ags_admin_dir.make_http_request(service_folder_url)
        for service in service_folder_response.get("services", []):
            # Construct the URL to get service properties
            portal_service_name = service["serviceName"]
            service_properties_url = f"{service_folder_url}/{portal_service_name}.{service['type']}"
            service_properties = self.ags_admin_dir.make_http_request(service_properties_url)
            for item in service_properties["portalProperties"]["portalItems"]:
                self.service_item_ids[f"{portal_service_name}.{item['type']}"] = item["itemID"]

        # share the items
        share_items_url = f"{self.owning_system_url}/sharing/rest/content/users/{self.user_name}/shareItems"
        share_items_query_params = {
            "everyone": False,
            "account": True,
            "items": ",".join(self.service_item_ids.values())
        }
        share_items_response = self.ags_admin_dir.make_http_request(share_items_url, share_items_query_params)
        self.logger.debug(json.dumps(share_items_response, ensure_ascii=False, indent=2))

        # Update the REST URLs for the routing services to be the ones accessible from the portal
        user_items_url = f"{self.owning_system_url}/sharing/rest/content/users/{self.user_name}/items"
        updated_services = []
        updated_service_url = ""
        for helper_services in (self.na_async_gp_services, self.na_sync_gp_services, self.na_utils_gp_service,
                                self.na_map_services):
            for helper_svc_name, svc_url in helper_services.items():
                if svc_url:
                    svc_name = ".".join(svc_url.split("/")[-2:])
                    if svc_name in updated_services:
                        helper_services[helper_svc_name] = updated_service_url
                    else:
                        service_item_property_url = f"{user_items_url}/{self.service_item_ids[svc_name]}"
                        service_item_property_response = self.ags_admin_dir.make_http_request(service_item_property_url)
                        updated_service_url = service_item_property_response["item"]["url"]
                        helper_services[helper_svc_name] = updated_service_url
                        updated_services.append(svc_name)

    def _register_utility_services(self):
        """Register routing services as utility services in the enterprise portal."""
        self.logger.info("Configuring routing services as utility services")
        err_msgs = {
            "CONFIG_UTIL_SVCS_MSG": ("Please follow the instructions from %s to configure the routing services as "
                                     "utility services in your portal using the portal website.")
        }
        try:
            self._check_owning_system_url()
        except arcpy.ExecuteError:
            raise
        except Exception:  # Need to quit for any exception. pylint:disable=broad-except
            # Exit and inform that the routing services need to be to manually configured as utility services
            msg = "The tool cannot configure the routing services as utility services in your portal."
            self.logger.warning(msg)
            self.logger.warning(err_msgs["CONFIG_UTIL_SVCS_MSG"], self.HELP_LINKS["http://esriurl.com/crusffs"])
            self.logger.debug("Failed to make sharing API calls with private portal URL.", exc_info=True)
            return

        # Share services with everyone in the organization
        self._share_services()

        # Update portals/self
        portals_self_update_url = f"{self.owning_system_url}/sharing/rest/portals/self/update"
        portals_self_update_query_params = {}
        url_additions = {
            "asyncClosestFacility": "FindClosestFacilities",
            "asyncServiceArea": "GenerateServiceAreas",
            "asyncVRP": "SolveVehicleRoutingProblem",
            "syncVRP": "EditVehicleRoutingProblem",
            "route": "Route_World" if self.nd_extents else "Route",
            "closestFacility": "ClosestFacility_World" if self.nd_extents else "ClosestFacility",
            "serviceArea": "ServiceArea_World" if self.nd_extents else "ServiceArea",
            "odCostMatrix": "OriginDestinationCostMatrix_World" if self.nd_extents else "OriginDestinationCostMatrix",
        }
        # Change /MapServer to /NAServer for naserver based services
        for helper_svc_name, svc_url in self.na_map_services.items():
            if helper_svc_name == "traffic":
                # Set the first map_service url as the traffic helper service
                for svc_url in self.na_map_services.values():
                    if svc_url:
                        self.na_map_services["traffic"] = os.path.dirname(svc_url) + "/MapServer"
                        break
            else:
                if svc_url:
                    self.na_map_services[helper_svc_name] = os.path.dirname(svc_url) + "/NAServer"

        for helper_service in (self.na_async_gp_services, self.na_sync_gp_services, self.na_utils_gp_service,
                               self.na_map_services, self.traffic_map_service):
            for helper_svc_name, svc_url in helper_service.items():
                if svc_url:
                    mod_svc_url = url_additions.get(helper_svc_name, "")
                    mod_svc_url = f"{svc_url}/{mod_svc_url}" if mod_svc_url else svc_url
                    mod_svc_name = "ServiceLayer" if helper_svc_name == "route" else "Service"
                    portals_self_update_query_params[helper_svc_name + mod_svc_name] = {
                        "url": mod_svc_url,
                        "itemId": self.service_item_ids.get(".".join(svc_url.split("/")[-2:]), "")
                    }

        # Update routingServicesSource
        routing_services_source = {
            "sourceName": "ArcGISEnterprise",
            "serverUrl": portals_self_update_query_params["routingUtilitiesService"]["url"].split("/rest/")[0],
            "serverVersion": self.ags_admin_dir.server_version,
        }
        if self.nd_datastore:
            routing_services_source["networkDataset"] = self.nd_datastore
        if self.nd_is_using_traffic_data_service:
            # trafficDataServiceItemId as part of routingServicesSource.
            traffic_data_svc_item_id = ""
            try:
                traffic_data_url = self.portal_self["helperServices"]["trafficData"]["url"]
                if traffic_data_url:
                    traffic_data_svc_item_id = os.path.basename(traffic_data_url.split("/rest/")[0])
            except KeyError:
                traffic_data_svc_item_id = ""
            if traffic_data_svc_item_id:
                routing_services_source["trafficDataServiceItemId"] = traffic_data_svc_item_id

        portals_self_update_query_params["routingServicesSource"] = routing_services_source

        self.logger.debug("Updating helper service urls")
        self.logger.debug(json.dumps(portals_self_update_query_params, ensure_ascii=False, indent=2))
        portals_self_update_response = self.ags_admin_dir.make_http_request(portals_self_update_url,
                                                                            portals_self_update_query_params)
        self.logger.debug(json.dumps(portals_self_update_response, ensure_ascii=False, indent=2))

    def _import_toolbox(self):
        """Import a geoprocessing toolbox."""
        tbx_file = os.path.join(self.cwd, "NetworkAnalysisServiceTools.tbx")
        self.logger.debug("Importing toolbox, %s, as a module called %s", tbx_file, self.gp_svc_tbx_alias)
        # self.gp_svc_tbx = arcpy.ImportToolbox(tbx_file, self.gp_svc_tbx_alias)
        arcpy.ImportToolbox(tbx_file)
        self.gp_svc_tbx = getattr(arcpy, self.gp_svc_tbx_alias)

    def _init_ags_admin(self):
        """Initialize the ArcGIs Server admin directory used to manage the ArcGIS Server site."""
        agsadmin.AdminDirectory.logger = self.logger
        self.server_url = agsadmin.AdminDirectory.construct_url(self.server_name)
        self.logger.debug("Server URL: %s", self.server_url)
        if self.portal_name:
            self.owning_system_url = agsadmin.AdminDirectory.construct_url(self.portal_name, "PORTAL")
        self.logger.info("Getting a token to manage ArcGIS Server site")
        self.ags_admin_dir = agsadmin.AdminDirectory(self.server_url, self.user_name, self.password,
                                                     self.owning_system_url)
        # Portal url can be updated when AdminDirectory generates a portal token if the portal url has redirects.
        self.owning_system_url = self.ags_admin_dir.portal_url
        if self.owning_system_url:
            if self.ags_admin_dir.portal_self:
                self.portal_self = self.ags_admin_dir.portal_self
            else:
                portal_self_url = f"{self.owning_system_url}/sharing/rest/portals/self"
                self.portal_self = self.ags_admin_dir.make_http_request(portal_self_url)

    def execute(self):
        """Program execution logic."""
        arcpy.CheckOutExtension("network")

        # Get a site admin token
        self._init_ags_admin()

        # Check prerequisites for publishin services
        self.logger.info("Checking if the user has the privileges to publish map and GP services.")
        self._validate_user()
        self.logger.info("Analyzing network dataset")
        self._validate_nd()
        # The web tool validation that is run before we reach here already checks for existence of the network dataset
        if not self.is_web_tool:
            self.logger.info("Checking if the network dataset is accessible on all the machines in the "
                             "ArcGIS Server site")
            self._check_nd_on_server()
        self._create_service_folder()

        # Create service defintion files
        self._import_toolbox()
        self._create_nautils_gp_sd_file()
        self._create_async_gp_sd_files()
        self._create_sync_gp_sd_files()
        self._create_naserver_sd_files()
        self._create_traffic_map_sd_file()

        if not self.config.get("publishSDs", True):
            self.logger.info("Successfully created the service definitions.")
            return

        # Publish services from service defintion files
        self._publish_sd()

        # Configure services as directions and routing utility services
        if self.owning_system_url and self.config.get("registerUtilityServices", True):
            self._register_utility_services()

        # Print the REST endpoints for the published services.
        self.logger.info("The following routing services have been successfully published to your ArcGIS server site.")
        unique_svc_urls = []
        for svc_urls in (self.na_map_services, self.na_utils_gp_service, self.na_async_gp_services,
                         self.na_sync_gp_services, self.traffic_map_service):
            for svc_url in svc_urls.values():
                if svc_url and svc_url not in unique_svc_urls:
                    unique_svc_urls.append(svc_url)
                    self.logger.info(svc_url)
        if not unique_svc_urls:
            # TODO Add an ID message message in ArcGIS 11.0
            self.logger.error("None of the routing services have been published.")
            raise arcpy.ExecuteError from None
        published_services = []
        for svc_url in unique_svc_urls:
            svc_type = os.path.basename(svc_url)
            svc_name = os.path.basename(os.path.dirname(svc_url))
            svc_item_id = self.service_item_ids.get(f"{svc_name}.{svc_type}", "")
            published_services.append({
                "serviceItemId": svc_item_id,
                "type": svc_type,
                "serviceUrl": svc_url
            })
        self.published_services = {
            "services": published_services
        }

    def cleanup(self):
        """Delete intermediate files and folders."""
        # Delete the intermediate files
        for pattern in ("*.json", "*.sddraft", "*.aprx", "*.sde"):
            for file_path in glob.iglob(os.path.join(self.service_definition_folder, pattern)):
                try:
                    self.logger.debug("Deleting intermediate file %s", file_path)
                    os.remove(file_path)
                except Exception:  # Need to skip any failures. pylint:disable=broad-except
                    self.logger.debug("Failed to delete.", exc_info=True)
        # # Delete any file gdbs
        # if os.path.exists(self.na_filegdb):
        #     try:
        #         self.logger.debug("Deleting intermediate filegdb %s", self.na_filegdb)
        #         shutil.rmtree(self.na_filegdb)
        #     except Exception:  # Need to skip any failures. pylint:disable=broad-except
        #         self.logger.debug("Failed to delete.", exc_info=True)
        #         try:
        #             arcpy.management.Delete(self.na_filegdb)
        #         except Exception:  # Need to skip any failures. pylint:disable=broad-except
        #             self.logger.debug("Failed to delete using Delete GP tool.", exc_info=True)
