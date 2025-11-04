import arcpy
import functools

from intel.utilities.Utilities import create_temp_table_name, \
                                      create_scratch_geodatabase, \
                                      create_temp_workspace, \
                                      selectUTMZone, \
                                      get_application, \
                                      order_oid_list, \
                                      get_platform, \
                                      get_active_map_spatial_reference, \
                                      validate_geometry, \
                                      generateCenteredWorldAzimuthalEquidistant, \
                                      getLicenseLevel, \
                                      SR_GCS_WGS_1984, \
                                      SR_WEB_MERCATOR, \
                                      SR_W_AZ_ED

from intel.utilities.Validation import validate_input_coordinate, validate_input_geometry, validate_time_enablement
from intel.utilities.Diagnostics import Diagnostic, DEBUG, DIAGNOSTIC_PATH
from intel.utilities.Logger import Logger
from intel.utilities.CaptureStdIO import Capturing

from intel.utilities.ErrorHandlers import general_error_handler, \
                                          general_error_logger, \
                                          error_handler

from intel.utilities.ParameterValidation import ParameterValidation

from intel.utilities.LocaleValidate import LocaleValidate

class MsgType:
    """
    Message Type handling class

    Informative: informational messages
    Warning: Unexpected event, does not stop process
    Error: Unexpected event, process stops

    """
    INF = "INFORMATIVE"
    WRN = "WARNING"
    ERR = "ERROR"
