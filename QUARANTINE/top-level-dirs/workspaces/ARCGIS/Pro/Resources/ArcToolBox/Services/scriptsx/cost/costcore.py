"""Module to perform the core logic of cost estimation."""
# no-qa. pylint: disable=logging-format-interpolation
import os
import json
from typing import Union, Optional

from common import LogUtils, ImmutableDict, COST_KEY  # noqa. pylint: disable=import-error
from .costhandler import (Parameter, DefaultHandler, EDHandler, SNHandler,  # no-qa. pylint: disable=import-error
                          FNHandler, CDTAHandler, COTDHandler, PRHandler,
                          CBFHandler, GTHandler, APHandler, SWHandler,
                          ELHandler, TaskCostHandler, CTAHandler,
                          NoCostHandler)

__all__ = ["CostMetadata", "CostHandler"]

LOGGER = LogUtils.setup_logger(__name__)
BASESTRING = (str, bytes)


class CostMetadata:
    """Load the toolCostMetadata and expose it as readonly json"""

    CONFIG_FILE_NAME = 'toolCostMetadata.json'

    def __init__(self):
        """Initialize the path of the tool cost metadata file.

        Args:
            No arguments.
        Returns:
            No returns.
        Raises:
            Exception if no metadata file is found.

        """
        self.configuration_file = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                               self.CONFIG_FILE_NAME)

        if not os.path.exists(self.configuration_file):
            LOGGER.error('Unable to find the configuration_file at {}.'.format(self.configuration_file))
            raise Exception

        self.__config = None

    @property
    def metadata(self) -> ImmutableDict:
        """Get metadata of all tools."""
        if not self.__config:
            with open(self.configuration_file) as json_data:
                self.__config = json.load(json_data)
            self.__config = ImmutableDict(self.__config)
        return self.__config  # type: ignore

    def get_tool_metadata(self, tool_name: str) -> Optional[ImmutableDict]:
        """Get the configuration specific to a certain tool.

        Args:
            tool_name: a string represents the name of the standard analysis tool.
        Returns:
            A json with the parameters associate info of the desired tool.

        """
        tools = self.metadata.get('tools')
        if tools:
            for tool in tools:
                if tool['name'] == tool_name:
                    return tool

        return None

    def get_base_multiplier(self) -> float:
        """Get the default multiplier (it will multiply all the calculated credits)."""
        try:
            return float(self.metadata.get('multiplier'))  # type: ignore
        except ValueError as err:
            LOGGER.error('Invalid multiplier value of {}'.format(self.metadata.get("multiplier")))
            raise IOError from err
    
    def get_multiplier(self, tool_name: str, use_namultiplier: bool) -> float:
        """Get the multiplier of a certain task.

        Args:
            tool_name: name of the tool.
            use_namultiplier: the namultiplier is returned if use_namultiplier is
            true and multiplier is returned if use_namultiplier is false.
        Returns:
            Either namultiplier or multiplier.

        """
        tools = self.metadata.get("tools", [])
        for tool in tools:
            if tool["name"].lower() == tool_name.lower():
                if use_namultiplier and "info" in tool:
                    return tool["info"].get("namultiplier", 0)
                else:
                    return tool.get("multiplier", 0)
        LOGGER.debug(f"Can't find the multiplier for tool: {tool_name}.")
        return 0


class CostHandler:
    """Class module to handle cost (either estimate or log). The class will delegate task to the appropriate
    handler based on the task name."""

    TASK_COST_HANDLERS = ImmutableDict({"default": DefaultHandler,
                                        "extractdata": EDHandler,
                                        "createdrivetimeareas": CDTAHandler,
                                        "summarizenearby": SNHandler,
                                        "findnearest": FNHandler,
                                        "planroutes": PRHandler,
                                        "connectoriginstodestinations": COTDHandler,
                                        "choosebestfacilities": CBFHandler,
                                        "aggregatepoints": APHandler,
                                        "summarizewithin": SWHandler,
                                        "generatetessellations": GTHandler,
                                        "enrichlayer": ELHandler,
                                        "createthresholdareas": CTAHandler,
                                        "free": NoCostHandler})

    def __init__(self, task_name: str, task_params: Union[str, dict],
                 log_cost: bool = False,
                 report_cost: bool = False,
                 estimate_rus_charge: bool = False):
        """Read in and validate user inputs based on tool metadata

        Args:
            task_name: name of a task.
            task_params: parameters to perform a certain task. For credit prediction REST, task_params
            is a string with all the parameters concatenated. But for credit check and log in backend
            as well as credit log, the task_params is constructed at tool level and pass in as a dictionary.
            log_cost: True if the purpose is to log the cost and False if it is to estimate the cost.
            report_cost: True if the handler needs to report the cost and False otherwise.
            estimate_rus_charge: True to estimate only the remote utility service charge and False otherwise.
        Returns:
            No return.
        Raises:
            TypeError if task_name is not string.
            AO_900008 if no tool specific metadata is found from the configuration file.
            AO_100245 if failed to create an instance of CostHandler based on the input.

        """
        self.task_name = task_name
        self.log_cost = log_cost
        configuration = CostMetadata()
        # config_dict is a json with all the configurations of the tool get from toolCostmetadata.json.
        self.config_dict = configuration.get_tool_metadata(task_name)
        self.base_multiplier = configuration.get_base_multiplier()
        if self.config_dict is None:
            LOGGER.error(900008, extra={"message_ID": 900008, 'ToolName': task_name})
            raise Exception
        self.exact_cost = None

        # The following processing is to process the input_param_str if it is in json format.
        if isinstance(task_params, dict):
            params_dict = task_params
            if COST_KEY in task_params:
                self.exact_cost = task_params.pop(COST_KEY)
        elif isinstance(task_params, BASESTRING):
            try:
                params_dict = json.loads(task_params)
            except ValueError:  # JSONDecodeError inherits from ValueError
                try:
                    # If the task_params is a formated json, needs to remove the format.
                    task_params = task_params.replace('"{', '{').replace('}"', '}')
                    task_params = task_params.replace('\r\n', '').replace('\\n', '').replace('\\"', '"')
                    params_dict = json.loads(task_params)
                except ValueError:
                    LOGGER.error(100245, extra={"message_ID": 100245, "paramName": task_params})
                    raise TypeError
        else:
            LOGGER.error("Invalid type of parameters for estimation.")
            raise TypeError

        # Change all the key to lower case
        self.task_params = {k.lower(): v for k, v in params_dict.items()}
        self.report_cost = report_cost
        self.estimate_rus_charge = estimate_rus_charge

    def create(self) -> TaskCostHandler:
        """Create an instance of TaskCostHandler."""
        cost_handler = self.TASK_COST_HANDLERS[self.config_dict["function"]](self.task_name,  # type: ignore
                                                                             self.base_multiplier,
                                                                             self.log_cost,
                                                                             self.report_cost,
                                                                             self.estimate_rus_charge)
        cost_handler.exact_cost = self.exact_cost

        # Create properties for reporter based on the configuration.
        for key, value in self.config_dict.items():  # type: ignore
            if key == 'multiplier':
                cost_handler.__setattr__(key, float(self.config_dict[key]))  # type: ignore
            elif key == 'function':
                pass
            elif key == 'parameters':
                cost_handler.__setattr__(key, [] + self.get_parameters(value))
            # For info and description etc.
            else:
                cost_handler.__setattr__(key, value)

        return cost_handler

    def get_parameters(self, param_def_list: list) -> list:
        """Create a list of parameters from the user's input.

        Args:
            param_def_list: a list with the parameters definition.
        Returns:
            A list of instances of _Parameter.
        Raises:
            IOError if both name and type are None.

        """
        parameters = []
        # Go through the parameter defition list. Any parameters that are not on the list will not be parsed.
        for param in param_def_list:
            param_name = param.get('name', None)
            param_type = param.get('type', None)
            optional = param.get('optional', False)
            multi_val = param.get('multivalue', False)

            # Check the parameter (name and type can not be None)
            if param_name is None or param_type is None:
                LOGGER.error('Invalid parameter info. Check the metadata file!')
                raise IOError

            if self.task_params.get(param_name.lower()):
                param_item = Parameter(param_name, param_type, self.task_params[param_name.lower()],
                                       optional=optional, multiple_values=multi_val)
            else:
                param_item = None

            if param_item:
                parameters.append(param_item)
            elif not optional:
                LOGGER.error('002', extra={"message_ID": '002', 'add_argument1': param_name})

        return parameters

    def handle(self):
        """Handle the request (i.e., estimation or log) regarding cost."""
        try:
            cost_handler = self.create()
            return cost_handler.handle()
        except Exception as err:  # noqa. pylint: disable=bare-except
            LOGGER.error("cost processing failed.")
            raise Exception from err
