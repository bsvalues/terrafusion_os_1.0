"""Module of PATool."""
# noqa: D205, D400
# noqa. Use mixin structure. pylint: disable=no-member
# pylint: disable=logging-fstring-interpolation
import json
from abc import ABC, abstractmethod
from enum import Enum
from typing import Optional, List, Union, Dict
import logging
from urllib.parse import urlparse

import arcpy

from .padatastructures import ImmutableDict
from .pautils import AnalysisUtils
from .aolutils import AOLUtils
from .paremoteutils import PortalUtils
from .pacommon import PAOutputName, PAContext, PAEnvironment
from .palog import LogUtils, LogExecutionTime, PAErrorProcessor, GPMessageHandler, DTGPMessageHandler, ToolExit
from .paglobals import COST_KEY


LOGGER = LogUtils.setup_logger(__name__)

__all__ = ["PAExecutor", "PAPrivileges", "PATool", "RefundErrorProcessor", "CostMixin", "NoCostMixin",
           "DTPATool", "PrivilegeCheckMixin", "ModelBuilderMixin"]


class ProgressLogMixin:
    """Mixin class to enable setup progress status"""
    MIN_STEP = 0
    MAX_STEP = 100
    PROG_TYPE = "step"

    @classmethod
    def log_progress(cls, step: int, message: str = ""):
        """Log the current progress of the task.

        Args:
            message (str): message of the status.
            step (int): the step of the progress.
        """
        if step < cls.MIN_STEP or step > cls.MAX_STEP:
            LOGGER.debug(f"Unable to log the progress of {step}.")
            return
        arcpy.SetProgressor(cls.PROG_TYPE, message, min_range=cls.MIN_STEP,
                            max_range=cls.MAX_STEP, step_value=step)
        arcpy.SetProgressorPosition(step)


class PAExecutor(ProgressLogMixin, ABC):
    """Abstract class with interface defined for each portal analysis tool's core logic. Separate the tool core
    logic (PAExecutor) from data I/O, publish, cost check/log logic (PATool) on purpose.

    Methods
    -------
        execute()
            Execute the core logic.
        validate_parameters()
            Return True if all the input parameters are valid and False otherwise.

    """

    @abstractmethod
    def execute(self):
        """Execute the core logic of the tool."""
        raise NotImplementedError

    @abstractmethod
    def validate_parameters(self) -> bool:
        """Validate the parameters of the executor. This function will be called by the validate_parameters of the
        tool.
        """
        raise NotImplementedError


class PAPrivileges(Enum):
    """An Enum class module as a lookup for the frequently used privilege str."""

    PUBLISH_FEATURES = "portal:publisher:publishFeatures"
    UPDATE_ITEMS = "portal:admin:updateItems"
    CREATE_ITEM = "portal:user:createItem"
    DELETE_GROUPS = "portal:admin:deleteGroups"
    DELETE_ITEMS = "portal:admin:deleteItems"
    CREATE_ADVANCED_NOTEBOOKS = "premium:publisher:createAdvancedNotebooks"
    CREATE_NOTEBOOKS = "premium:publisher:createNotebooks"
    GEO_ANALYTICS = "premium:publisher:geoanalytics"
    RASTER_ANALYSIS = "premium:publisher:rasteranalysis"
    DEMOGRAPHICS = "premium:user:demographics"
    ELEVATION = "premium:user:elevation"
    GEOCODE = "premium:user:geocode"
    GEOENRICHMENT = "premium:user:geoenrichment"
    NETWORK_ANALYSIS = "premium:user:networkanalysis"
    SPATIAL_ANALYSIS = "premium:user:spatialanalysis"


class CostMixin:
    """Mixin-class with cost related functionalities.

    Methods
    -------
        estimate_cost()
            Calculate the cost based on user's inputs.
        log_cost()
            Log the cost.

    """

    def estimate_cost(self) -> float:
        """ Get cost based on tool's input parameters.

        Returns:
            A float represents the estimated cost.
        Raises:
            ToolExit if cost_parameters property is empty.

        """
        from cost import CostHandler  # noqa. pylint: disable=import-error

        cost_handler = CostHandler(self.task_name, self.cost_parameters)  # type: ignore
        cost_json = cost_handler.handle()
        LOGGER.debug(f"Reported cost: {cost_json}")
        cost = json.loads(cost_json)
        return float(cost.get("cost", cost.get("maximumCost", 0)))

    def log_cost(self):
        """Log the cost."""
        from cost import CostHandler  # noqa. pylint: disable=import-error

        try:
            report_cost = True if self.output_name.environment == PAEnvironment.ONLINE else False  # type: ignore
            CostHandler(self.task_name, self.cost_parameters, log_cost=True,  # type: ignore
                        report_cost=report_cost).handle()
        except Exception as err:  # noqa. pylint: disable=bare-except
            LOGGER.error("Failed to log the cost.")
            raise ToolExit from err


class NoCostMixin:
    """Mixin-class with cost handle functions for public free tools (i.e., CreateViewSheds,
    CreateWaterSheds, and TraceDownstream.

    Methods
    -------
        estimate_cost() : `float`
            Return the cost based on user's inputs.
        log_cost()
            Log the cost for the tool.

    """
    def estimate_cost(self) -> float:
        """Cost for the public free tools should always be free."""
        return 0.0

    def log_cost(self):
        """Log the cost which should always be 0.0 but the execution_count should be 1."""
        if self.output_name.environment == PAEnvironment.ONLINE:  # type: ignore
            LOGGER.warning(json.dumps({COST_KEY: 0}))
        arcpy.gp._arc_object.LogUsageMetering(5555, self.task_name, 1, 0.0)  # type: ignore


class PrivilegeCheckMixin:
    """Class with privilege check related functionalities.

    Methods
    -------
        check_publishing_privilege()
            True if related publishing privileges check passed and False otherwise.
        check_privileges(privileges : List[Union[PAPrivileges, str]])
            True if the endpoint has the specified privileges and False otherwise.

    """
    def check_publishing_privilege(self) -> bool:
        """Check if the user has the appropriate publishing privilege. User needs to have the privileges of publishing
        features, update items, and create items if need to publish the outputs as a feature service. Otherwise, users
        need to have the privileges of update and create items.
        """
        if self.output_name.create_service:  # type: ignore
            if not self.check_privileges([PAPrivileges.PUBLISH_FEATURES]):
                LOGGER.error(100112, extra={"message_ID": 100112})
                return False
            if not self.check_privileges([PAPrivileges.CREATE_ITEM]):
                LOGGER.error(100118, extra={"message_ID": 100118})
                return False
        else:
            if not self.check_privileges([PAPrivileges.CREATE_ITEM]):
                LOGGER.error(100118, extra={"message_ID": 100118})
                return False
        return True

    def check_privileges(self, privileges: List[Union[PAPrivileges, str]]) -> bool:
        """Check privileges on running the tool.

        Args:
            A list of strings or PAPrivileges with each item as a privilege to check.
        Returns:
            A boolean where true represents the user/app has all the privileges and false otherwise.

        """
        # Unpack the privilege's value if it is PAPrivilege enum instance.
        privileges = [priv.value if isinstance(priv, PAPrivileges) else priv for priv in privileges]

        for privilege in privileges:
            if "user" in self.portal_description:  # type: ignore
                if "privileges" in self.portal_description["user"]:  # type: ignore
                    # LOGGER.debug("User privileges: {}".format(self.portal_description["user"]["privileges"]))
                    if privilege in self.portal_description["user"]["privileges"]:  # type: ignore
                        continue

            if "appInfo" in self.portal_description:  # type: ignore
                if "privileges" in self.portal_description["appInfo"]:  # type: ignore
                    if privilege not in self.portal_description["appInfo"]["privileges"]:  # type: ignore
                        return False
                    else:
                        continue
            else:
                return False

        return True

    @classmethod
    def check_agol_privilge(cls, privilege: str, token: str, referer: str) -> bool:
        """Check whether the arcgis online user has given privilege.

        Args:
            privilege (Union[PAPrivileges, str]): privilege to check.
            token (Optional[str]): token used to access the agol account.
            referer (Optional[str]): referer used to access the agol account.

        Returns:
            bool: True if the arcgis online account has given privilege and False
            otherwise.
        """
        agol_self_url = r"https://www.arcgis.com/sharing/rest/portals/self"
        params = {"f": "json", "token": token}
        try:
            headers = {"referer": referer} if referer else {}
            response = AOLUtils.mk_get_request(agol_self_url, params=params,
                                               headers=headers)
            privilege_arr = response["user"]["privileges"]
            return privilege in privilege_arr
        except (ValueError, KeyError, ToolExit):
            LOGGER.debug(f"Unable to determine {privilege} privilege for ArcGIS Online user account.")

        return False

    def get_remote_server_version(self, remote_service: str) -> Optional[float]:
        """Get the current version of the server running behind remote service.

        Args:
            remote_service (str): name of the remote service. Currently only support
            route, elevation, and hydrology.

        Returns:
            Optional[float]: the current version of the remote server. Return None
            if unable to get the remote server version.
        """
        if remote_service not in ["route", "elevation", "hydrology", "asyncRoute"]:
            LOGGER.debug("Currently only support route, elevation, hydrology, and asyncRoute remote service.")
            return None
        elif (
            self.portal_description  # type: ignore
            and remote_service in self.portal_description.get("helperServices", {})  # type: ignore
        ):  
            try:
                service_url = self.portal_description["helperServices"][remote_service]["url"]  # type: ignore
                if service_url:
                    url_comp = urlparse(service_url)
                    idx = url_comp.path.index("services/")
                    rest_info_url = f"https://{url_comp.netloc}{url_comp.path[0:idx]}info"
                    resp = AOLUtils.mk_get_request(rest_info_url, params={"f": "json"}, verify=False)
                    curr_vers = resp.get("currentVersion")
                    LOGGER.debug(f"{remote_service} remote server version is: {curr_vers}")
                    return curr_vers
            except Exception as err:
                LOGGER.debug(f"Unable to get the remote {remote_service} server version due to {str(err)}.")

        return None


class RESTTool(ABC):
    """Abstract class represents tool exposed through REST"""

    def __init__(
        self,
        task_name: str,
        output_name_index: int,
        context_index: Optional[int],
        version: float=1.0
    ):
        self.task_name = task_name
        LOGGER.debug(f"task_name: {task_name}")
        self.executor: Optional[PAExecutor] = None
        if isinstance(context_index, int):
            self.context = PAContext(context_index)
        self.version = version
        LOGGER.debug(f"version of the tool: {self.version}")
        environment = PAEnvironment.MODELBUILDER if self.version == 1.1 else None
        self.output_name = PAOutputName(output_name_index, environment)

    @abstractmethod
    def get_parameters(self):
        pass

    @abstractmethod
    def run(self):
        pass


class ModelBuilderMixin:

    def run(self):
        if self.output_name and self.output_name.environment == PAEnvironment.MODELBUILDER:
            LOGGER.debug("Excute ModelBuilder environment.")
            with LogExecutionTime("executor.execute()"):
                self.executor.execute()  # type: ignore

            with LogExecutionTime("set_visualization()"):
                self.set_visualization()  # type: ignore

            with LogExecutionTime("publish_outputs()"):
                self.publish_outputs()  # type: ignore
        else:
            super().run()  # type: ignore


class OutputCheckMixin:
    """Check if the output is valid"""
    PORTAL_NOT_SUPPORTED_CHARS = [" ", "!", "-"]

    def check_output(self) -> bool:
        if self.output_name.create_service:  # type: ignore
            if self.portal_description and self.output_name.environment == PAEnvironment.ENTERPRISE:  # type: ignore
                LOGGER.debug("Running in portal environment.")
                if self.output_name.service_name:  # type: ignore
                    for char in self.PORTAL_NOT_SUPPORTED_CHARS:
                        if char in self.output_name.service_name:  # type: ignore
                            LOGGER.error(100375, extra={"message_ID": 100375})
                            return False
        return True

    def check_overwrite_sr(self, out_sr: arcpy.SpatialReference):
        """Check if the spatial reference match between the feature service to
        overwrite and the output.

        Args:
            out_sr (arcpy.SpatialReference): the expected spatial reference of
            the output.
        """
        item_info = self.output_name.overwrite_item_info  # type: ignore
        if item_info:
            wkid = item_info.get("spatialReference", "null")
            if wkid.lower() in ["null", "none"]:
                fs_sr = arcpy.SpatialReference()
            else:
                try:
                    wkid = int(wkid)
                    fs_sr = arcpy.SpatialReference(wkid)
                # the wkid can be either a wkid or wkt string
                except ValueError:
                    # if it is not wkid, then it can only be wkt
                    fs_sr = arcpy.SpatialReference()
                    fs_sr.loadFromString(wkid)

            if arcpy.env.outputCoordinateSystem:  # type: ignore
                if not AnalysisUtils.is_srs_equal(fs_sr, arcpy.env.outputCoordinateSystem):  # type: ignore
                    LOGGER.error(100321, extra={"message_ID": 100321})
                    raise ToolExit
            else:
                if not AnalysisUtils.is_srs_equal(fs_sr, out_sr):
                    LOGGER.error(100321, extra={"message_ID": 100321})
                    raise ToolExit


class PATool(ProgressLogMixin, OutputCheckMixin, PrivilegeCheckMixin, CostMixin,
             RESTTool, ABC):
    """Abstract class (interface) defining all the portal analysis (PA) tools implementation.

    Attributes
    ----------
        task_name : `str`
            Name of the tool.
        executor : `PAExecutor`
            An instance of PAExecutor. It will execute the core logic of the tool.
        cost_parameters : `Optional[Dict]``
            A json with cost related parameters. Will be used for cost estimation and log.
        output_name : `PAOutputName`
            Information on saving the output to.
        context : `Optional[PAContext]`
            Context of the tool.
        portal_description : `ImmutableDict`
            Description on the portal that the tool is running upon.
        version : `float`
            Version of the current tool. This flag can be used in future extension
            of downstream behavior customization.

    Methods
    -------
        get_parameters()
            An abstract method to get all the parameters and initialize the proper attributes.
        check_credits()
            True if the user/app has enough credits to execute the desired task anf False otherwise.
        validate_parameters()
            Implicitly call check_credits(), validate_tool_parameters(), and executor.validate_parameters in order.
        validate_tool_parameters()
            True if the tool specific paramters are valid and False otherwise.
        run()
            Trigger the following calls in order: executor.execute(), set_visualization(), publish_outputs(),
            log_usage_metering(), and log_cost().
        set_visualization()
            An abstract method to set renderer to the output.
        publish_outputs()
            An abstract method to publish the tool outputs as a feature service or file output.
        log_usage_metering()
            An abstract method to log the usage metering of the tool.

    """

    def __init__(
        self,
        task_name: str,
        output_name_index: int,
        context_index: Optional[int],
        version: float = 1.0
    ):
        """Perform the following operations in order: 1) initialize properties; 2) check publishing privileges,
        3) validate the extent; 4) call get_parameters to initialize all parameters; and 5) call validate_parameters
        to validate parameters of the tool.

        Args:
            task_name: tool name.
            output_name_index: position of the output_name in the REST API.
            context_index: position of the context parameter in the REST API.
        Returns:
            No return value.
        Raises:
            AO_100112 if check_publishing_privilege fails.

        """
        self.log_progress(0, "Start executing...")
        self.cleanup_funcs = [self.delete_published_item]
        with LogExecutionTime("tool initialization and privilege check", self.cleanup_funcs):
            RESTTool.__init__(self, task_name, output_name_index, context_index, version)
            self.__portal_description: Optional[ImmutableDict] = None

            if self.version != 1.1 and not self.check_publishing_privilege():
                LOGGER.error(100112, extra={"message_ID": 100112})
                raise ToolExit
            LOGGER.debug("publishing_privilege check ok.")

            if not self.check_output():
                raise ToolExit
            LOGGER.debug("output properties check ok.")

            LOGGER.debug(f"tool run environment: {self.output_name.environment}")

        with LogExecutionTime("get_parameters()", self.cleanup_funcs):
            self.get_parameters()
            self.log_progress(10, "Read inputs complete.")

        with LogExecutionTime("check_credits()", self.cleanup_funcs):
            if not self.check_credits():
                LOGGER.error(100242, extra={"message_ID": 100242})
                raise ToolExit
            self.log_progress(15, "Check credits.")

        with LogExecutionTime("validate_parameters()", self.cleanup_funcs):
            self.validate_parameters()
            self.log_progress(20, "Validate inputs complete.")

    @property
    def portal_description(self) -> ImmutableDict:
        """Getter of the portal_description property.

        Returns:
            An immutable json with the output of arcpy.GetPortalDescription().
        Raises:
            No exceptions.

        """
        if not self.__portal_description:
            try:
                self.__portal_description = ImmutableDict(arcpy.GetPortalDescription())
                # reset the output_name environment to ENTERPRISE if isPortal is True
                if (
                    "isPortal" in self.__portal_description
                    and self.__portal_description["isPortal"]
                    and self.output_name
                    and self.output_name.environment == PAEnvironment.ONLINE
                ):
                    self.output_name.environment = PAEnvironment.ENTERPRISE
            except:  # noqa. pylint: disable=bare-except
                LOGGER.error(100289, extra={"message_ID": 100289})
                raise RuntimeError
        return self.__portal_description  # type: ignore

    def check_credits(self) -> bool:
        """Check if the user has enough credits for the desired task.

        Returns:
            True if the user has enough credits to complete the analysis and False otherwise.

        """
        if self.output_name and self.output_name.environment == PAEnvironment.MODELBUILDER:
            LOGGER.debug("No need to check credits as tool runs in model builder environment.")
            return True
        subscription_info = self.portal_description.get("subscriptionInfo")  # type: ignore
        if subscription_info:
            org_state = subscription_info.get('state')
            # Credit checks failed if account status is suspended
            if org_state.lower() == 'suspended':
                return False

        credit_assignment = self.portal_description.get("creditAssignments", "disabled")  # type: ignore
        # If credit assignment not enabled, don't check anything
        if credit_assignment.lower() == "disabled":
            return True

        # Check if the user has enough credits if credit assignment enabled
        user = self.portal_description.get("user")  # type: ignore
        if not user:
            return False
        else:
            assigned_credits = user.get("assignedCredits", 0)
            available_credits = user.get("availableCredits", 0)
            LOGGER.debug("User's assigned credits: {}, and available credits: {}".format(assigned_credits,
                                                                                         available_credits))
            # if assignedCredits is -1, it means that the user has no limitation on credits usage.
            if assigned_credits == -1:
                return True
            elif available_credits < 0:
                return False
            else:
                try:
                    cost = self.estimate_cost()
                    LOGGER.debug("cost for the task is: {}".format(cost))
                except:  # noqa. pylint: disable=bare-except
                    LOGGER.debug("Failed to get cost of the desired task.")
                    # If it is actually some parameter setting issue, it will fail afterwards.
                    return True
                # Check if the assigned credits is larger than the cost.
                return available_credits >= cost

    def validate_parameters(self):
        """Validate parameters of the tool. This function is implicitly calling the executor's validate_parameters
        function and self's validate_tool_parameters function.

        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            ToolExit will be raised if validate_parameters failed.

        """
        if not self.validate_tool_parameters():
            LOGGER.debug("tool contains invalid parameters.")
            raise ToolExit
        LOGGER.debug("Tool parameter validation complete.")

        if self.executor and not self.executor.validate_parameters():
            LOGGER.debug("executor contains invalid parameters.")
            raise ToolExit
        LOGGER.debug("Executor parameter validation complete.")

    def validate_tool_parameters(self) -> bool:
        """Validate function to check the parameters of the tool. This function will be called implicitly within
        validate_parameters. If specific logic need to be added for a certain tool, this function can be overwritten.
        """
        return self.executor is not None

    def delete_published_item(self):
        """Delete the item that has been published."""
        if (
            hasattr(self, "output_name")
            and self.output_name.created_item_id
            and self.output_name.item_created_by_server
        ):
            PortalUtils.delete_portal_item(self.output_name.created_item_id, {"permanentDelete": True})
            LOGGER.debug(f"Delete {self.output_name.created_item_id} successfully.")
        elif (
            hasattr(self, "output_name")
            and self.output_name.created_item_id
        ):
            LOGGER.debug(f"Output item {self.output_name.created_item_id} created by client app. No need to delete")
        elif hasattr(self, "output_name"):
            LOGGER.debug("Output item has not been created yet. No need to delete")

    def run(self):
        """Run the tool with defined functions in order."""
        with LogExecutionTime("executor.execute()", self.cleanup_funcs):
            if self.executor:
                self.executor.execute()
            else:
                LOGGER.debug("executor of the tool is None.")
                raise ToolExit
            self.log_progress(80, "Core logic complete.")

        with LogExecutionTime("set_visualization()", self.cleanup_funcs):
            self.set_visualization()
            self.log_progress(85, "Set visualization complete.")

        with LogExecutionTime("publish_outputs()", self.cleanup_funcs):
            with arcpy.EnvManager(qualifiedFieldNames=False):
                self.publish_outputs()
            self.log_progress(95, "Outputs publish complete.")

        with LogExecutionTime("log_usage_metering()", self.cleanup_funcs):
            self.log_usage_metering()

        with LogExecutionTime("log_cost()", self.cleanup_funcs):
            self.log_cost()
            self.log_progress(100, "Tool execution complete")

    @abstractmethod
    def set_visualization(self):
        """To set the visualization/renderer information of the result. Popup of the layer can also be set in this
        function if needed.

        Args:
            No arguments.
        Returns:
            No returns. Drawing and/or popup are added to the PAOutputLayer.
        Raises:
            No exception.

        """
        raise NotImplementedError

    @abstractmethod
    def publish_outputs(self):
        """To publish the outputs.

        Args:
            No arguments.
        Returns:
            No returns.
        Raises:
            Error will be raised if failed to publish the outputs.

        """
        raise NotImplementedError

    @abstractmethod
    def log_usage_metering(self):
        """Log the metering of usage."""
        raise NotImplementedError

    def is_running_in(self, environment: Union[PAEnvironment, int]) -> bool:
        if self.output_name:
            if isinstance(environment, int):
                return self.output_name.environment.value == environment
            else:
                return self.output_name.environment == environment
        else:
            LOGGER.debug("Unable to check the environment as output_name has not been initialized.")
            return False


class RefundErrorProcessor(PAErrorProcessor):
    """PATool error processor with refund capability."""

    def __init__(self, task_name: str, error_codes: list, error: Exception,
                 special_error_handlers: Optional[Dict] = None,
                 tool: Optional[PATool] = None):
        """Initialize attributes."""
        super(RefundErrorProcessor, self).__init__(task_name, error_codes, error, special_error_handlers)
        self.tool = tool

    def log_refund(self, task_name: str, refund_param: Dict):
        """Log the refund information."""

        from cost import CostHandler, CostMetadata  # noqa. pylint: disable=import-error

        na_tools = ["choosebestfacilities", "findnearest", "planroutes", "connectoriginstodestinations"]
        remote_job_id = refund_param.get("remoteJobID", "")
        if COST_KEY in refund_param:
            # placeholder pending on the design of the remote logistics service
            output_feat_count = -1
            cost = refund_param[COST_KEY]
        elif task_name.lower() in na_tools and "outFeatureCount" in refund_param:  # type: ignore
            multiplier = CostMetadata().get_multiplier(task_name, True)  # type: ignore
            output_feat_count = refund_param.get("outFeatureCount", 0)
            cost = output_feat_count * multiplier
        else:
            cost_handler = CostHandler(task_name, refund_param)  # type: ignore
            cost_json = cost_handler.handle()
            LOGGER.debug("Refunded cost: {}".format(cost_json))
            cost_info = json.loads(cost_json)
            cost = float(cost_info.get("cost", cost_info.get("maximumCost", 0)))
            output_feat_count = cost_info.get("totalRecords", 0)
        LOGGER.debug(f"{task_name} failed after successfully calling remote service. Refund {cost:.4f} credits.")  # type: ignore
        msg = f"REFUND:{task_name};RemoteJobID:{remote_job_id}"  # type: ignore
        arcpy.gp._arc_object.LogUsageMetering(6666, msg, output_feat_count, cost)

    def process_gp_error(self):
        """Log the refund information if the tool has refund_parameter set."""
        if self.tool:
            if hasattr(self.tool, "refund_parameter"):
                refund_param = getattr(self.tool, "refund_parameter")
                self.log_refund(self.tool.task_name, refund_param)
        super().process_gp_error()


class DTPATool(ABC):
    """Abstract class defining interface of desktop portal analysis tools."""

    def __init__(self, tool_name: str):
        """Initialize the properties and call the internal functions to read
        and validate parameters.

        Args:
            tool_name (str): name of the analysis tool.
        """
        # Set the level of all loggers to WARNING and above and also replace
        # the GPMessageHandler with DTGPMessageHandler.
        loggers = [logging.getLogger(name) for name in logging.root.manager.loggerDict]
        for logger in loggers:
            if logger.name.startswith("PA."):
                logger.setLevel(logging.WARNING)
            for i, handler in enumerate(logger.handlers):
                if isinstance(handler, GPMessageHandler):
                    logger.handlers[i] = DTGPMessageHandler()

        self.tool_name = tool_name
        self.executor = None  # Optional[PAExecutor]
        self.get_parameters()
        self.validate_parameters()

    @abstractmethod
    def get_parameters(self):
        """Get all parameters of the tool."""
        raise NotImplementedError

    def validate_tool_parameters(self) -> bool:
        """Validate function to check the parameters of the tool. This function will be called implicitly within
        validate_parameters. If specific logic need to be added for a certain tool, this function can be overwritten.
        """
        return self.executor is not None

    def validate_parameters(self):
        """Check if all the parameters are valid."""
        if not self.validate_tool_parameters():
            LOGGER.error("tool contains invalid parameters.")
            raise ToolExit

        if self.executor and not self.executor.validate_parameters():
            LOGGER.error("executor contains invalid parameters.")
            raise RuntimeError

    @abstractmethod
    def run(self):
        """Execute the core logic of the tool."""
        raise NotImplementedError
