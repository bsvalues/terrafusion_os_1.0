"""Publish routing services based on a network dataset to an ArcGIS Server site."""

# Do not use f strings in this module as they will cause a Syntax Error when run using python 2 and we want to provide
# a specific error message if run with Python 2. So use str.format()

import os
import sys
import argparse
import logging
import time

try:
    import arcpy
except ImportError as ex:
    sys.stdout.write("Failed to import the arcpy site package.")
    sys.stdout.write(str(ex))
    sys.exit(1)

# Module level variables
logger = logging.getLogger(__name__)  # pylint: disable=invalid-name
SOLVER_TYPES = ["Route", "ClosestFacility", "ServiceArea", "OriginDestinationCostMatrix", "Location-Allocation",
                "VehicleRoutingProblem", "LastMileDelivery", "SnapToRoads"]


class ToolExit(SystemExit):
    """Raised to indicate termination of the script."""

    def __init__(self, msg=""):
        """Set up names required by the exception class.

        Args:
            msg: A string that is returned as part of the code attribute for the exception instances. When a
            file handler is registered with the module logger, the code attribute also writes this message to the log
            file.

        """
        # Call the base class constructor
        super(ToolExit, self).__init__()
        self._log_file = None
        if logger.handlers:
            first_handler = logger.handlers[0]
            if hasattr(first_handler, "baseFilename"):
                self._log_file = first_handler.baseFilename
        if self._log_file:
            self.code = u"{} Details have been logged to {}".format(msg, self._log_file)
            logger.debug(self.code)
        else:
            self.code = msg


class DatasetAction(argparse.Action):
    """Validate if the argument value passed from the command line points to an existing dataset.

    Use to validate if -n and -o point to existing and valid datasets.

    """

    def __call__(self, parser, namespace, values, option_string=None):
        """Overidden method defining the action for the argument."""
        if not values:
            setattr(namespace, self.dest, values)
            return
        if not arcpy.Exists(values):
            msg = 'Invalid value for option {}. Dataset, "{}", does not exist.\nHelp:\n{}'
            raise ValueError(msg.format(option_string, values, self.help))
        setattr(namespace, self.dest, os.path.abspath(values))


class SolverTypeAction(argparse.Action):
    """Validate if the solver types passed from the command line are valid."""

    def __call__(self, parser, namespace, values, option_string=None):
        """Overidden method defining the action for the argument."""
        input_values = set(values.replace(" ", "").split(","))
        if not input_values.issubset(set(SOLVER_TYPES)):
            raise ValueError("Invalid value '{}' for option {}.\nHelp:\n{}".format(values, option_string, self.help))
        setattr(namespace, self.dest, list(input_values))


def _setup_logger(log_folder):
    """Set up the module logger to log the console and to a log file.

    The function modifies the module level logger referenced by name 'logger'.

    Args:
        log_folder: The folder where the log file will be written.
    Returns:
        The full path to the log file.
    Raises:
        No exceptions are raised.

    """
    log_date_fmt = "%Y-%m-%d %H:%M:%S"
    log_file_name = os.path.splitext(os.path.basename(__file__))[0] + ".log"
    log_file = os.path.join(log_folder, log_file_name)
    logger.setLevel(logging.DEBUG)
    # create file handler which logs even debug messages
    file_handler = logging.FileHandler(log_file, "w", "utf-8")
    file_handler.setLevel(logging.DEBUG)
    # create formatter and add it to the file handlers
    formatter = logging.Formatter("%(levelname)s | %(asctime)s | %(module)s | "
                                  "%(funcName)s | %(lineno)d | %(message)s",
                                  log_date_fmt)
    file_handler.setFormatter(formatter)

    # create console handler with a higher log level
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter("%(asctime)s | %(message)s", log_date_fmt))

    # add the handlers to the logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return log_file


def _check_python_version():
    """Fail the overall execution if called using Python 2."""
    major_ver = sys.version_info.major
    if major_ver == 2:
        py3_exe = "python3"
        if "WINEPREFIX" not in os.environ:
            py3_exe = os.path.join(os.environ.get("AGSSERVER", "C:\\Program Files\\ArcGIS\\Server"),
                                   "framework", "runtime", "ArcGIS", "bin", "Python", "envs", "arcgispro-py3",
                                   "python.exe")
        msg = "Incorrect Python executable used for running the script. Try running with {}".format(py3_exe)
        raise SystemExit(msg)


def publish_routing_services(args):
    """Prepare the inputs and call the main execution to publish routing services.

    Args:
        args: A dictionary of arguments passed from the command line.

    """
    # Get the current working directory
    cwd = os.path.dirname(os.path.abspath(__file__))

    # Set up the logger to write to console and to a log file
    log_file = _setup_logger(args["service_definition_folder"])
    logger.debug("Command line arguments")
    for arg in args:
        if arg == "password":
            logger.debug("%s: ****", arg)
        else:
            logger.debug("%s: %s", arg, args[arg])

    # Not required in Pro server
    # VALIDATION CHECK: Fail if the service definition folder is inside the folder containing the network dataset
    # nd_folder = os.path.dirname(os.path.dirname(os.path.dirname(nds)))
    # if os.path.normcase(nd_folder) in os.path.normcase(args["service_definition_folder"]):
    #     raise ToolExit("The output folder, {},  cannot be in the same folder as your "
    #                    "network dataset, {}.".format(args["service_definition_folder"], nd_folder))

    # VALIDATION CHECK: Fail if the service definition folder is inside the current working directory since on windows
    # this would mean writing to C:\Program Files\ArcGIS\Server\tools\PublishRoutingServices which can require elevated
    # privileges to write content.
    if os.path.normcase(cwd) in os.path.normcase(args["service_definition_folder"]):
        raise ToolExit("The output folder cannot be within {}".format(cwd))

    # Importing here and not at the top so that we can provide a better error message when run using python 2.
    import prs
    prs.LOGGER = logger

    # Call core execution logic
    try:
        prs = prs.PublishRoutingServices(**args)
        prs.execute()
        prs.cleanup()
    except arcpy.ExecuteError:
        logger.error("A geoprocessing error occurred. Details have been logged to %s", log_file)
        logger.debug("Exception details", exc_info=True)
        sys.exit(1)
    except Exception:  # pylint: disable=broad-except
        logger.error("A python error occurred. Details have been logged to %s", log_file)
        logger.debug("Exception details", exc_info=True)
        sys.exit(2)


def _cli():
    """Command line interface for the utility."""
    _check_python_version()

    # Initialize the time to keep track of the total execution time
    start_time = time.time()

    # Set up the parser
    # On linux, the wrapper script does not have any extensions
    prog = os.path.splitext(os.path.basename(__file__))[0]
    params_file_path = "/data/tool-params.txt"
    help_platform = "linux"
    if "WINEPREFIX" not in os.environ:
        prog += ".bat"
        params_file_path = "C:\\data\\tool-params.txt"
        help_platform = "windows"
    arc_version = ".".join(arcpy.GetInstallInfo()["Version"].split(".")[:2])
    help_url = ("https://enterprise.arcgis.com/en/server/{}/administer/{}/"
                "publishing-routing-services.htm").format(arc_version, help_platform)
    tool_help = """
    Publish routing services based on a network dataset to an ArcGIS Server site.

    You can call the utility by passing all the options on the command line
    or define all the options in a parameter file and then pass the path to
    the parameter file with @ symbol. For example,

    {prog} @{params_file_path}

    For detailed help refer to {help_url}

    """.format(help_url=help_url, prog=prog, params_file_path=params_file_path)
    parser = argparse.ArgumentParser(prog, description=tool_help, fromfile_prefix_chars="@",
                                     formatter_class=argparse.RawDescriptionHelpFormatter)

    # Define Arguments supported by the command line utility
    # --username
    help_string = ("User name for a user with publisher or administrative privileges in the ArcGIS Server site. "
                   "If the site is federated with a portal, the user must be a portal user and can have administrative "
                   "privilege or a publisher privilege that allows publishing web tools and publishing server-based "
                   "layers. If the site is not federated, the user must have administrative privileges. If your site "
                   "is configured with web-tier authentication, specify a built-in user, such as the primary site "
                   "administrator account or the initial administrator account in your portal.")
    parser.add_argument("-u", "--username", action="store", dest="user_name", help=help_string, required=True)

    # --password
    help_string = "The password of the user who was specified with the -u parameter."
    parser.add_argument("-p", "--password", action="store", dest="password", help=help_string, required=True)

    # --server-name
    help_string = ("The fully qualified domain name of the machine running ArcGIS Server, such as "
                   "gisserver.domain.com, or the local URL to your ArcGIS Server site in the format "
                   "https://gisserver.domain.com:6443/arcgis.")
    parser.add_argument("-s", "--server-name", action="store", dest="server_name", help=help_string, required=True)

    # --portal-name
    help_string = ("The fully qualified domain name of the machine, such as gisportal.domain.com, where Portal to "
                   "which your ArcGIS Server site federates with, is installed. The value can also be a local URL to "
                   "the portal in the format https://gisportal.domain.com:7443/arcgis A value for this option is "
                   "required only if the ArcGIS Server that will host the routing services is federated with the "
                   "portal.")
    parser.add_argument("-P", "--portal-name", action="store", dest="portal_name", help=help_string)

    # --network-dataset or --extents
    group = parser.add_mutually_exclusive_group(required=True)

    help_string = ("The full path to the network dataset. Along with the path to the file geodatabase, the path should "
                   "also include the name of the network dataset and the name of the feature dataset containing the "
                   "network dataset. For example, a value for this option can be "
                   r"'c:\data\Streets.gdb\Routing\Routing_ND on Windows and '/data/Streets.gdb/Routing/Routing_ND' on "
                   "Linux where 'Streets.gdb' is the file geodatabase that has a network dataset named 'Routing_ND' in "
                   "a feature dataset named 'Routing'.")
    group.add_argument("-n", "--network-dataset", action=DatasetAction, dest="network_dataset", help=help_string)

    help_string = "The full path to the feature class containing the extents for multiple network datasets."
    group.add_argument("-e", "--extents", action=DatasetAction, dest="nd_extents", help=help_string)

    help_string = ("Path to an existing folder where the utility will create the service definition files for the "
                   "services and a log file named 'publishroutingservices.log' that includes the details about the "
                   "execution as well as any errors that might be encountered.")
    parser.add_argument("-o", "--output-folder", action=DatasetAction, dest="service_definition_folder",
                        help=help_string, required=True)

    # --folder-name
    default_service_folder = "Routing"
    help_string = ("Folder name used to create all the routing services on the ArcGIS Server site. "
                   "The default value is {}".format(default_service_folder))
    parser.add_argument("-f", "--folder-name", action="store", dest="service_folder", help=help_string,
                        default=default_service_folder)

    # --solver-types
    default_solver_types = [val for val in SOLVER_TYPES if val != "SnapToRoads"]
    help_string = ("The list of solvers to be included in the services. The valid choices are "
                   f"{', '.join(SOLVER_TYPES)}. The value for this option is specified as a comma separated list of "
                   "valid choices. The choice values are case sensitive. The default value is  "
                   f"'{', '.join(default_solver_types)}'")
    parser.add_argument("-S", "--solver-types", action=SolverTypeAction, dest="solver_types", help=help_string,
                        default=default_solver_types)

    # --config-file
    # Look for the config file in the parent directory of the current working directory
    default_config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                       "publishroutingservices.json")
    default_dedicated_config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                 "publishroutingservices_dedicated.json")
    help_string = ("Full path including the name of the file containing additional configuration for the services. "
                   "The default value is {}. ".format(default_config_file))
    help_string += "If --dedicated option is specified, the default value is {}".format(default_dedicated_config_file)
    parser.add_argument("-c", "--config-file", action=DatasetAction, dest="config_file", help=help_string)

    # --dedicated
    help_string = ("Specifying this option creates a dedicated service for every solver. This is an advanced option."
                   "When this option is specified, your ArcGIS Server site will use a lot more compute and memory "
                   "resources. This option is recommended only for specialized ArcGIS Server sites.")
    parser.add_argument("-d", "--dedicated", action="store_true", dest="dedicated_service", help=help_string)

    # Get arguments as dictionary. Fail if there are any errors while parsing
    try:
        args = vars(parser.parse_args())
        # Set the default for config_file
        if not args["config_file"]:
            if args["dedicated_service"]:
                args["config_file"] = default_dedicated_config_file
            else:
                args["config_file"] = default_config_file

    except ValueError as ex:
        # These messages will only be in the console and not in the log file as the log file is created later on.
        logger.error("%s", ex)
        # In case we need additional details change this to logger.error since the default log level is warning.
        # logger.debug("Error details:", exc_info=True)
        sys.exit(1)
    publish_routing_services(args)
    end_time = time.time()
    logger.info("Completed in %.2f minutes", (end_time - start_time) / 60.0)


if __name__ == "__main__":
    _cli()
