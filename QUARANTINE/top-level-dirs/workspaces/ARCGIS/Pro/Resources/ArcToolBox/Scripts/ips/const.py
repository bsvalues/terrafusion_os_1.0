import os
from enum import Enum

import arcpy

SCRIPT_DIR = os.path.join(os.path.dirname(__file__), os.pardir)
IPS_RESOURCES_DIR = os.path.join(
    SCRIPT_DIR, os.pardir, os.pardir, 'IndoorPositioning')

INDOORS_RESOURCES_DIR = os.path.join(
    SCRIPT_DIR, os.pardir, os.pardir, 'Indoors', 'Schema')

# Indoors Network Feature Classes
NETWORK_NAME = 'NETWORK'
PATHWAYS_NAME = 'Pathways'
TRANSITIONS_NAME = 'Transitions'

# Indoors Core Feature Classes
INDOORS_NAME = 'INDOORS'
DETAILS_NAME = 'Details'
SITES_NAME = 'Sites'
FACILITIES_NAME = 'Facilities'
LEVELS_NAME = 'Levels'
UNITS_NAME = 'Units'

# Indoor Positioning Extra Feature Classes (Survey-less)
IPS_AREA_NAME = 'IPS_Area'
WALLS_NAME = 'Walls'

# Domain names created
DOM_IPS_RECORDING_TYPE = "DOM_IPS_RECORDING_TYPE"
DOM_BOOLEAN = "DOM_BOOLEAN"
# Domain names created in New Model
DOM_IPS_BOOL = "DOM_IPS_BOOL"
DOM_RADIO_TYPE = "DOM_RADIO_TYPE"
DOM_SIGNAL_TYPE = "DOM_SIGNAL_TYPE"
# Quality Assessment Domain names created
DOM_IPS_QA_ACCURACY_LEVEL = 'DOM_IPS_QA_ACCURACY_LEVEL'
DOM_IPS_LOCATION_SOURCE = 'DOM_IPS_LOCATION_SOURCE'

INDOORS_MODEL_XML_SCHEMA_PATH = os.path.abspath(
    os.path.join(INDOORS_RESOURCES_DIR, f'{INDOORS_NAME}.xml'))
# TODO: we should rename this to NETWORK_XML_SCHEMA_PATH
TRANSITIONS_XML_SCHEMA_PATH = os.path.abspath(
    os.path.join(INDOORS_RESOURCES_DIR, f'{NETWORK_NAME}.xml'))
IPS_AREA_XML_SCHEMA_PATH = os.path.abspath(
    os.path.join(IPS_RESOURCES_DIR, f'{IPS_AREA_NAME}.xml'))
WALLS_XML_SCHEMA_PATH = os.path.abspath(
    os.path.join(IPS_RESOURCES_DIR, f'{WALLS_NAME}.xml'))

# DOM_IPS_RECORDING_TYPE values
QUALITY_REC_NAME = 'Quality'
SURVEY_REC_NAME = 'Survey'

# field names in IPS_Positioning
DATE_CREATED_FIELD_NAME = 'DATE_CREATED'

# field names in IPS_Recordings
PLANNING_DATE_FIELD_NAME = 'PLANNING_DATE'  # never used
FACILITY_ID_FIELD_NAME = 'FACILITY_ID'
LEVEL_ID_FIELD_NAME = 'LEVEL_ID'
SURVEY_DATE_FIELD_NAME = 'SURVEY_DATE'
SURVEYOR_FIELD_NAME = 'SURVEYOR'  # never used
DEVICE_FIELD_NAME = 'DEVICE'
APP_VERSION_FIELD_NAME = 'APP_VERSION'  # never used
RECORDING_TYPE_FIELD_NAME = 'RECORDING_TYPE'

# field names in Beacons
VENDOR_FIELD_NAME = 'VENDOR'  # never used
BEACON_ID_FIELD_NAME = 'BEACON_ID'  # never
UUID_FIELD_NAME = 'UUID'
MAJOR_FIELD_NAME = 'MAJOR'
MINOR_FIELD_NAME = 'MINOR'
PROTOCOL_FIELD_NAME = 'PROTOCOL'  # never used
RSSI_1M_FIELD_NAME = 'RSSI_1M'
ADVERTISING_INTERVAL_MS_FIELD_NAME = 'ADVERTISING_INTERVAL_MS'  # never used
BATTERY_LEVEL_FIELD_NAME = 'BATTERY_LEVEL'  # never used
LAST_SEEN_FIELD_NAME = 'LAST_SEEN'  # never used
PLACEMENT_DATE_FIELD_NAME = 'PLACEMENT_DATE'  # never used

# TODO: rename this to VERTICAL_ORDER_FIELD_NAME for consistency or ... remove "FIELD_NAME' everywhere else!
# field names in Levels
VERTICAL_ORDER = 'VERTICAL_ORDER'
Z_VALUE = 'Z_VALUE'

# field names in Units
UNIT_ID_FIELD_NAME = 'UNIT_ID'
USE_TYPE_FIELD_NAME = 'USE_TYPE'

# field names in Details
DETAIL_ID_FIELD_NAME = 'DETAIL_ID'

# field names available in multiple tables/fcs
OBJECT_ID_FIELD_NAME = 'OBJECTID'
SHAPE_FIELD_NAME = 'SHAPE'  # DO NOT CHANGE THE VALUE OF THE SHAPE FIELD NAME:
# spatial dataframes must have the shape column all caps otherwise
# some functionalities do not work
SHAPE_LENGTH_FIELD_NAME = 'SHAPE_LENGTH'  # never used
SITE_ID_FIELD_NAME = 'SITE_ID'
COMMENT_FIELD_NAME = 'COMMENT'
BLE_FIELD_NAME = 'BLUETOOTH'
WIFI_FIELD_NAME = 'WIFI'
GLOBAL_ID_FIELD_NAME = 'GLOBALID'

# field names in Quality Assessment Feature Dataset/Classes

# Computed Positions FC
# ------------------------
# OBJECTID_FIELD_NAME: we use arcpy to get the actual value
# SHAPE_FIELD_NAME : we use arcpy to get the actual value
RECORDING_GUID_FIELD_NAME = 'RECORDING_GUID'
IPS_TIME_FIELD_NAME = 'IPS_TIME'

# Reference Positions FC
# ----------------------
# SHAPE_FIELD_NAME : we use arcpy to get the actual value
# LEVEL_ID_FIELD_NAME: generic
# RECORDING_GUID_FIELD_NAME: same as COMPUTED POSITIONS
# IPS_TIME_FIELD_NAME: SAME AS COMPUTED POSITIONS
POSITIONING_GUID_FIELD_NAME = 'POSITIONING_GUID'
BLUETOOTH_POSITIONING_FIELD_NAME = 'BLUETOOTH_POSITIONING'
WIFI_POSITIONING_FIELD_NAME = 'WIFI_POSITIONING'
# WIFI_FIELD_NAME: same as generic (see above)
DISTANCE_TO_COMPUTED_FIELD_NAME = 'DISTANCE_TO_COMPUTED'
ACCURACY_LEVEL_FIELD_NAME = 'ACCURACY_LEVEL'
LOS_TO_COMPUTED_FIELD_NAME = 'LOS_TO_COMPUTED'
LEVEL_MATCH_FIELD_NAME = 'LEVEL_MATCH'
LOCATION_SOURCE_FIELD_NAME = 'LOCATION_SOURCE'

EMPTY_LEGACY_DB = os.path.join(IPS_RESOURCES_DIR, 'legacy.db')

# CPQ Parameter Names (displayNames)
DISPLAY_NAME_CPQ_DETAILS = 'Sight Blocking Details Features'
DISPLAY_NAME_CPQ_RECORDINGS = 'IPS Recordings Features'

# Attachment Dataframe Column names
DF_FILE_PATH_COLUMN = 'file_path'
DF_REC_OID_COLUMN = 'record_oid'  # never used
DF_ATT_OID_COLUMN = 'attachment_oid'

# other DataFrame column names
DF_RECORDING_ACCESS_COLUMN = 'recording_access'
SDF_VERTEX_ARRAY_COLUMN = 'vertex_array'

# geometric constants
LEFT = CCW = 1  # LEFT TURN / Counter Clock Wise
RIGHT = CW = -1  # RIGHT TURN  / Clock Wise

# WGS84 arcpy spatial reference
WGS84_SR = arcpy.SpatialReference(4326)

# Transition fields defined in AIIM
VERTICAL_ORDER_FROM_FIELD_NAME = 'VERTICAL_ORDER_FROM'
VERTICAL_ORDER_TO_FIELD_NAME = 'VERTICAL_ORDER_TO'
TRANSITION_TYPE_FIELD_NAME = 'TRANSITION_TYPE'

# Indoor Positioning Data Service
IPDS_METADATA_XML_TAG = "IndoorPositioningGUID"

# Indoor Positioning Data Service Thumbnail
IPDS_THUMBNAIL = os.path.abspath(os.path.join(IPS_RESOURCES_DIR, "indoor-positioning-data-service-600.png"))


# -----------------------------------------
# Pro 3.0 Schema
# -----------------------------------------
class MODEL_30:
    """Constants representing the IPS data model 3.0 as defined in the XML schema"""
    XML_PATH = os.path.abspath(os.path.join(IPS_RESOURCES_DIR, 'IPS_Model_30.xml'))

    class IPS_POSITIONING:
        NAME = 'IPS_Positioning'

        class FIELDS(Enum):
            # OBJECTID
            # GlobalID
            SITE_ID = 'Site ID'
            DATE_CREATED = 'Date Created'
            COMMENT = 'Comment'
            BLUETOOTH = 'Bluetooth'
            WIFI = 'WiFi'

    class IPS_RECORDINGS:
        NAME = 'IPS_Recordings'

        class FIELDS(Enum):
            # OBJECTID
            # GlobalID
            # Shape
            # Shape_Length
            SITE_ID = 'Site ID'
            FACILITY_ID = 'Facility ID'
            LEVEL_ID = 'Level ID'
            SURVEY_CREATED = 'Survey Date'
            COMMENT = 'Comment'
            SURVEYOR = 'Surveyor'
            DEVICE = 'Device'
            APP_VERSION = 'App Version'
            RECORDING_TYPE = 'Recording Type'
            BLUETOOTH = 'Bluetooth'
            WIFI = 'WiFi'
            PLANNING_DATE = 'Planning Date'

    class BEACONS:
        NAME = 'Beacons'

        class FIELDS(Enum):
            # OBJECTID
            # GlobalID
            # Shape
            VENDOR = 'Vendor'
            BEACON_ID = 'Beacon ID'
            UUID = 'UUID'
            MAJOR = 'Major'
            MINOR = 'Minor'
            PROTOCOL = 'Protocol'
            RSSI_1M = 'RSSI 1m'
            ADVERTISING_INTERVAL_MS = 'Advertising Interval ms'
            LEVEL_ID = 'Level ID'
            BATTERY_LEVEL = 'Battery Level'
            LAST_SEEN = 'Last Seen'
            PLACEMENT_DATE = 'Placement Date'


# -----------------------------------------
# Pro 3.3 Schema
# -----------------------------------------
class MODEL_33:
    """Constants representing the IPS data model 3.3 as defined in the XML schema"""
    XML_PATH = os.path.abspath(os.path.join(IPS_RESOURCES_DIR, 'IPS_Model_33.xml'))

    class DOM_IPS_GENERATION_METHOD:
        NAME = 'DOM_IPS_GENERATION_METHOD'

        class VALUES(Enum):
            SURVEY_BASED = 0
            SURVEY_LESS = 1
            MIXED = 2

    class IPS_POSITIONING_DATASETS:
        NAME = 'IPS_Positioning_Datasets'

        class FIELDS(Enum):
            # OBJECTID
            # GlobalID
            # Shape
            # Shape_Length
            # Shape_Area
            DATASET_NAME = 'Dataset Name'
            DATE_CREATED = 'Date Created'
            BLUETOOTH = 'Bluetooth'
            WIFI = 'WiFi'
            NOTES = 'Notes'
            GENERATION_METHOD = 'Generation Method'

    class IPS_POSITIONING_POINTS:
        NAME = 'IPS_Positioning_Points'

        class FIELDS(Enum):
            DATASET_GUID = 'Dataset GUID'
            DATASET_NAME = 'Dataset Name'
            LEVEL_ID = 'Level ID'
            VERTICAL_ORDER = 'Vertical Order'

    # IPS Positioning Points Fields
    class IPS_POSITIONING_SIGNALS:
        NAME = 'IPS_Positioning_Signals'

        class FIELDS(Enum):
            POINT_GUID = 'Point GUID'
            DATASET_NAME = 'Dataset Name'
            TRANSMITTER_ID = 'Transmitter ID'
            TRANSMITTER_TYPE = 'Transmitter Type'
            RSSI_MEAN = 'RSSI Mean'
            RSSI_COUNT = 'RSSI Count'
            RSSI_STD = 'RSSI STD'
            GENERATION_METHOD = 'Generation Method'

    class IPS_RECORDINGS(MODEL_30.IPS_RECORDINGS):
        pass

    class IPS_BEACONS(MODEL_30.BEACONS):
        NAME = 'IPS_Beacons'

        class FIELDS(Enum):
            # OBJECTID
            # GlobalID
            # Shape
            VENDOR = 'Vendor'
            BEACON_ID = 'Beacon ID'
            UUID = 'UUID'
            MAJOR = 'Major'
            MINOR = 'Minor'
            PROTOCOL = 'Protocol'
            RSSI_1M = 'RSSI 1m'
            ADVERTISING_INTERVAL_MS = 'Advertising Interval ms'
            LEVEL_ID = 'Level ID'
            BATTERY_LEVEL = 'Battery Level'
            LAST_SEEN = 'Last Seen'
            PLACEMENT_DATE = 'Placement Date'
            TRANSMITTER_ID = 'Transmitter ID'  # NEW FIELD IN MODEL 3.3


class MODEL_34(MODEL_33):
    """Constants representing the IPS data model 3.3 as defined in the XML schema"""
    XML_PATH = os.path.abspath(os.path.join(IPS_RESOURCES_DIR, 'IPS_Model_34.xml'))

    class IPS_BEACONS(MODEL_33.IPS_BEACONS):
        class FIELDS(Enum):
            # OBJECTID
            # GlobalID
            # Shape
            VENDOR = 'Vendor'
            BEACON_ID = 'Beacon ID'
            UUID = 'UUID'
            MAJOR = 'Major'
            MINOR = 'Minor'
            PROTOCOL = 'Protocol'
            RSSI_1M = 'RSSI 1m'
            ADVERTISING_INTERVAL_MS = 'Advertising Interval ms'
            LEVEL_ID = 'Level ID'
            BATTERY_LEVEL = 'Battery Level'
            LAST_SEEN = 'Last Seen'
            PLACEMENT_DATE = 'Placement Date'
            TRANSMITTER_ID = 'Transmitter ID'
            MAC_ADDRESS = 'MAC Address'  # NEW FIELD IN MODEL 3.4


# This alias refers to the latest IPS model definition.
# We switch this with each Pro release
# if we need to access a specific version of the model we will use the corresponding constant class
MODEL_LATEST = MODEL_34


class MODEL_QUALITY_31:
    """Constants representing the IPS Quality data model 3.1 as defined in the XML schema"""
    NAME = 'IPS_Quality'
    XML_PATH = os.path.abspath(os.path.join(IPS_RESOURCES_DIR, 'IPS_Quality_Model_31.xml'))

    class REFERENCE_POSITIONS:
        NAME = 'Reference_Positions'

    class COMPUTED_POSITIONS:
        NAME = 'Computed_Positions'


class MODEL_FLIP_MAP_33:
    """IPS Positioning Data Service (Flip Map Dataset) XML Schema

    The schema defined in the xml includes:
        - IPS_Fingerprint_Points: Point Feature Class
        - Transmitter_Point_Weight: Table
        - Radio_Transmitter_Model_Trilinear: Table
        - 1:M Relationship IPS_Fingperprint_Points_Transmitter_Point_Weight
        - 1:M Relationship Radio_Transmitter_Model_Trilinear_Transmitter_Point_Weight

    """
    NAME = "IPS_Positioning_Data_Service"
    XML_PATH = os.path.abspath(os.path.join(IPS_RESOURCES_DIR, 'IPS_Positioning_Data_Service_33.xml'))

    class IPS_FINGERPRINT_POINTS:
        NAME = "IPS_Fingerprint_Points"

        class FIELDS(Enum):
            POINT_GUID = "Point GUID"
            LEVEL_ID = "Level ID"
            VERTICAL_ORDER = "Vertical Order"

    class TRANSMITTER_POINT_WEIGHT:
        NAME = "Transmitter_Point_Weight"

        class FIELDS(Enum):
            POINT_GUID = "Point GUID"
            TRANSMITTER_ID = "Transmitter ID"
            WEIGHT = "Weight"

    class RADIO_TRANSMITTER_MODEL:
        NAME = "Radio_Transmitter_Model_Trilinear"

        class FIELDS(Enum):
            TRANSMITTER_ID = "Transmitter ID"
            TRANSMITTER_TYPE = "Transmitter Type"
            X_MIN = "X Min"
            SLOPE_1 = "Slope 1"
            INTERCEPT_1 = "Intercept 1"
            X_2 = "X 2"
            SLOPE_2 = "SLOPE 2"
            INTERCEPT_2 = "Intercept 2"
            X_3 = "X 3"
            SLOPE_3 = "SLOPE 3"
            INTERCEPT_3 = "Intercept 3"
            X_MAX = "X Max"


class MODEL_FLIP_MAP_34(MODEL_FLIP_MAP_33):
    """IPS Positioning Data Service (Flip Map Dataset) XML Schema

    The schema defined in the xml includes:
        - IPS_Fingerprint_Points: Point Feature Class
        - Radio_Transmitter_Model_Trilinear: Table
        - M:N Attributed Relationship Transmitter_Point_Weight

    Notes:
        - The Relationship is M:N, Simple with Both Ways notification.
        - It seems that the notification is not preserved when sharing online.

    """
    XML_PATH = os.path.abspath(os.path.join(IPS_RESOURCES_DIR, 'IPS_Positioning_Data_Service_34.xml'))
