'''
------------------------------------------------------------------------------
Movement.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.7, Python 3.7
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2020-09-14 - jjones - original writeup
* 2020-12-03 - jjones - reorganized into intel Subfolders, fixed relative imports
* 2021-02-01 - jjones - organized enumerations based on tool
* 2021-02-09 - mfunk - added Points To Track Segments field names enumeration
------------------------------------------------------------------------------
'''

from enum import Enum

class Movement(Enum):
    # General Movement Enumerations
    PREV_X = 'prior_POINT_X'
    PREV_Y = 'prior_POINT_Y'
    PREV_TIME = 'prior_Time'
    FWD_TIME = 'next_Time'
    PX = 'POINT_X'
    PY = 'POINT_Y'
    SHAPE = 'geometry'
    SHAPE_JOIN = 'join_geometry'
    TIME_START = 'start_time'
    TIME_END = 'end_time'
    DATE_START = 'start_date'
    DATE_END = 'end_date'
    DATE = 'date'
    TIME_ALT = '$time'
    PREV_GEO = "prev_geometry"
    NEXT_GEO = "next_geometry"
    TRUE = 'true'
    OVERLAPS = "OVERLAPS"
    INTERSECTS = "INTERSECTS"
    CREATE_SUMMARY_TABLE = 'CREATE_SUMMARY_TABLE'
    NO_SUMMARY_TABLE = 'NO_SUMMARY_TABLE'
    
    # Find Cotravelers
    ONE_FC = 'ONE_FEATURECLASS'
    TWO_FC = 'TWO_FEATURECLASSES'
    X_TRAV = 'X'
    Y_TRAV = 'Y'
    X_COTR = 'X_cotraveler'
    Y_COTR = 'Y_cotraveler'
    DD = 'distance_diff'
    TD = 'time_diff'
    UI = 'unique_pair_id'
    COTR_TIME = 'cotraveler_time'
    TRAV_TIME = 'traveler_time'
    TRAV_ID = 'traveler_id'
    COTR_ID = 'cotraveler_id'
    TD_MAX = 'time_diff_max'
    TD_MIN = 'time_diff_min'
    TD_MEAN = 'time_diff_mean'
    TD_STD = 'time_diff_std'
    DD_MAX = 'distance_diff_max'
    DD_MIN = 'distance_diff_min'
    DD_MEAN = 'distance_diff_mean'
    DD_STD = 'distance_diff_std'
    UI_CNT = 'unique_pair_id_count'

    # Classify Movement Events
    BE = "acc_event"
    TE = "turn_event"
    MPH = "speed_mph"
    KMPH = "speed_kph"
    LEAD_X = 'lead_X'
    LEAD_Y = 'lead_Y'
    TRACK_ID = 'track_id'
    TIME = 'time'
    ROID = 'roi_id'
    ROI_NAME = 'Region Of Interest ID'
    TIME_CONV = 'time_converted'
    FB = "from_bearing"
    TB = "to_bearing"
    RIGHT_TURN = "Right Turn"
    RIGHT_UTURN = "Right U-Turn"
    LEFT_TURN = "Left Turn"
    LEFT_UTURN = "Left U-Turn"
    TRAV = "Traveling"
    STOP = "Stopped"
    SBE = "Start of deceleration event"
    EBE = "End of deceleration event"
    BRAKE = "Decelerating"
    SAE = "Start of acceleration event"
    EAE = "End of acceleration event"
    ACCEL = "Accelerating"
    SPEED = "speed"
    TURN_EVENTS = "ONLY_TURN_EVENTS"
    ALL_FEATURES = "ALL_FEATURES"
    TURN_ID = "INCLUDE_TURN_IDS"
    NO_TURN_ID = "NO_TURN_IDS"
    MIDPOINT = "TURN_MIDPOINT"
    TEID = "turn_event_id"
    SRC_OID = "source_OID"

    # Compare Areas
    AREA_ID = "Area_ID"
    PT_ID = "Track_ID"


class PointsToTrackSegmentsFieldNames(Enum):
    """PointsToTrackSegmentsFieldNames Field names for P2TS tool

    Field names used in output features for P2TS tool.

    :param Enum: Output field names enumeration
    :type Enum: enumeration
    """

    # Optional point and track
    GROUP_ID = "group_id"

    # Point only
    SEQUENCE = "sequence"
    DATE = "date"
    DATE_STR = "date_str"
    ORIG_OID = "oid_orig"

    # Track only
    DATE_START = "d_start"
    DATE_START_STR = "d_start_s"
    DATE_END = "d_end"
    DATE_END_STR = "d_end_s"
    DISTANCE = "distance_m"
    DELTA_SECONDS = "dt_sec"
    DELTA_MINUTES = "dt_min"
    START_OID = "oid_start"
    END_OID = "oid_end"

    # Optional track
    SPEED_MPS = "speed_mps"
    SPEED_MPH = "speed_mph"
    SPEED_KPH = "speed_kph"
    SPEED_KNOTS = "speed_knt"


class MovementTracks(Enum):
    NONE = 'NONE'
    BEFORE = 'BEFORE'
    AFTER = 'AFTER'
    BEFORE_AFTER = 'BEFORE_AFTER'


class CompareAreasEnum(Enum):
    # Compare Areas
    AREA_ID = "Area_ID"
    PT_ID = "Track_ID"
    CONTAINS = "Contains"
    NEAR = "NEAR"
    NEAR_BEFORE = "NEAR_BEFORE"
    NEAR_AFTER = "NEAR_AFTER"
    TIME_STATS = "TIME_STATISTICS"
    NO_TIME_STATS = "NO_TIME_STATISTICS"
    LOCATION_ONLY = "LOCATION_ONLY"
    LOCATION_TIME = "LOCATION_TIME"
    COUNT = "count"
    DURATION = "duration"
    TIME_ENTER = "enter_time"
    TIME_EXIT = "exit_time"
    TRUE = 'true'


class FindMeetingLocationsEnum(Enum):
    # Find Meeting Locations
    TM = 'total_meetings'
    TM_ALIAS = 'Total Meetings'
    TUID = 'total_unique_ids'
    TUID_ALIAS = 'Total Unique IDs'
    MN_MD = 'mean_meeting_duration'
    MN_MD_ALIAS = 'Mean Meeting Duration (seconds)'
    MIN_MD = 'min_meeting_duration'
    MIN_MD_ALIAS = 'Minimum Meeting Duration (seconds)'
    MAX_MD = 'max_meeting_duration'
    MAX_MD_ALIAS = 'Max Meeting Duration (seconds)'
    FSD = 'min_meeting_start'
    FSD_ALIAS = 'First Meeting Start Date'
    LSD = 'max_meeting_end'
    LSD_ALIAS = 'Last Meeting Start Date'
    P1 = 'participant_1'
    P1_ALIAS = 'Participant 1'
    P2 = 'participant_2'
    P2_ALIAS = 'Participant 2'
    MS = 'meeting_start'
    MS_ALIAS = 'Meeting Start'
    ME = 'meeting_end'
    ME_ALIAS = 'Meeting End'
    MD = 'meeting_duration'
    MD_ALIAS = 'Meeting Duration (seconds)'
    MID = 'meeting_id'
    MID_ALIAS = 'Meeting Identifier'
    MAID = 'meeting_area_id'
    MAID_ALIAS = 'Meeting Area Identifier'

class FindFrequentedLocationsEnum(Enum):
    NORM = "NORMALIZED"
    REAL = "REAL"
    DD = "DWELL_DURATION"
    START = "location_start"
    END = "location_end"
    MON = "Mon"
    TUE = "Tue"
    WED = "Wed"
    THU = "Thu"
    FRI = "Fri"
    SAT = "Sat"
    SUN = "Sun"
    MON_OUT = "monday"
    TUE_OUT = "tuesday"
    WED_OUT = "wednesday"
    THU_OUT = "thursday"
    FRI_OUT = "friday"
    SAT_OUT = "saturday"
    SUN_OUT = "sunday"
    DDMAX = 'duration_max'
    DDMIN = 'duration_min'
    DDMEAN = 'duration_mean'
    DDSTD = 'duration_std'
    STARTMAX = 'start_hour_max'
    STARTMIN = 'start_hour_min'
    STARTMEAN = 'start_hour_mean'
    STARTSTD = 'start_hour_std'
    ENDMAX = 'end_hour_max'
    ENDMIN = 'end_hour_min'
    ENDMEAN = 'end_hour_mean'
    ENDSTD = 'end_hour_std'
    HOUR_START = "start_hour"
    HOUR_END = "end_hour"
    TD = "total_dwells"
    TRACK_ID = "track_id"
    AREA_ID = "area_id"
    START_TIME = "START_TIME"
    END_TIME = "END_TIME"
    TT = "total_time"