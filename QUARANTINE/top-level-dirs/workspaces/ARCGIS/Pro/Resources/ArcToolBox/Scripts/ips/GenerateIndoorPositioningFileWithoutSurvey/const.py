import numpy as np

IPS_POSITIONING_PARAM = 'Target IPS Positioning Table'
BEACONS_PARAM = 'Beacon Features'
IPS_AREAS_PARAM = 'IPS Area Features'
WALLS_PARAM = 'Wall Features'
FACILITIES_PARAM = 'Facility Features'
LEVELS_PARAM = 'Level Features'
TRANSITIONS_PARAM = 'IPS Transition Features'

DEFAULT_STD_RSSI = 5.
BASIC_FINGERPRINT_DF_COLUMNS = [
    'point_id', 'x', 'y', 'ssid', 'transmitter_id', 'transmitter_type',
    'transmitter_occ', 'bssid', 'mean_rssi', 'std_rssi'
]
BASIC_FINGERPRINT_DF_DTYPES = [
    np.int64, np.float64, np.float64, np.str_, np.str_, np.int_, np.int_,
    np.int_, np.float64, np.float64
]
RADIO_SIGNAL_MAX_RANGE = 30.
