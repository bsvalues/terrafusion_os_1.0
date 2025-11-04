from indoorsdatapy.tools.validation.base_validator import Validator, Selector
from indoorsdatapy.tools.validation.checks import (RECORDING_SET_SELECTIONS,
                                                   RECORDING_CHECKS,
                                                   RECORDING_CHECKS_PB)

SLAM_COMMON = [
    'duration_from_10s', 'more_than_20_radios', 'more_than_4_transmitters',
    'more_than_10_steps'
]
SLAM_RECORDING_INITIAL_CHECKS = [
    'consecutive_ground_truths_per_floor', 'speed_limit_3ms'
]

SLAM_QUALITY = [
    'more_than_30_signal_per_10sec', 'more_than_3_unique_tx_per_3sec',
    'sensor_outage_checker'
]

SLAM_RECORDING_UPDATE_CHECKS = \
    SLAM_COMMON  # + ['more_than_10_kalman_positions']

SLAM_RECORDING_SET_INITIAL_CHECKS = \
    [  # 'device_match',
        'recordings_happened_within_1_months',
        'same_radio_type',
        'transmitter_overlap',
        'building_id_match']

SLAM_RECORDING_BUILDING_INITIAL_CHECKS = \
    ['GT_bounding_box',
     'GT_not_dead_zone',
     'consecutive_GT_not_intersect_dead_zone',
     'consecutive_GT_not_intersect_wall']

SLAM_RECORDING_BUILDING_UPDATE_CHECKS = \
    ['radio_type_match']

SLAM_COMMONCheckerPB = \
    lambda access, bail: Validator(
        access=access,
        checks=add_checks(SLAM_COMMON, RECORDING_CHECKS_PB),
        bail=bail)

SLAM_RECORDING_INITIAL_CHECKSCheckerPB = \
    lambda access, bail: Validator(
        access=access,
        checks=add_checks(SLAM_RECORDING_INITIAL_CHECKS),
        bail=bail)

SLAMInitialRecordingChecker = \
    lambda access, bail: Validator(
        access=access,
        checks=add_checks(SLAM_RECORDING_INITIAL_CHECKS + SLAM_COMMON),
        bail=bail)

SLAMUpdateRecordingChecker = \
    lambda access, bail: Validator(
        access=access,
        checks=add_checks(SLAM_RECORDING_UPDATE_CHECKS),
        bail=bail)

REPLAYERRecordingChecker = \
    lambda access, bail: Validator(
        access=access,
        checks=add_checks(['having_radios']),
        bail=bail)


def add_checks(list_checks, dict_checks=None):
    """
    Help function for get the dict of checks accordingly to list of the keys
    Parameters
    ----------
    list_checks list contains of string accordingly to available check bellow
    dict_checks dict of checs {check: lambda x}

    Returns
    -------
    dict of lambda checks
    """

    dict_checks = dict_checks or RECORDING_CHECKS
    for check in list_checks:
        if check not in dict_checks:
            raise Exception('Check: < %s > is not available ' % check)
    return dict([(check, fnc)
                 for check, fnc in dict_checks.items()
                 if check in list_checks])
SLAMInitialRecordingsSetSelector = \
    lambda recording_accesses: Selector(
        accesses=recording_accesses,
        checks=add_checks(SLAM_RECORDING_SET_INITIAL_CHECKS,
                          RECORDING_SET_SELECTIONS))

REPLAYERBuildingChecker = \
    lambda access, bail: Validator(
        access=access,
        checks=add_checks(['having_fingerprints']),
        bail=bail)

try:
    from indoorsdatapy.tools.validation.building_checks import (
        RECORDING_BUILDING_CHECKER, BUILDING_CHECKER)
except ImportError:
    BUILDINGGeometryChecker = None
    SLAMInitialRecordingBuildingChecker = None
    SLAMUpdateRecordingBuildingChecker = None
else:
    BUILDINGGeometryChecker = \
        lambda access, bail: Validator(
            access=access,
            checks=add_checks(BUILDING_CHECKER.keys(),
                              BUILDING_CHECKER),
            bail=bail)


    SLAMInitialRecordingBuildingChecker = \
        lambda recording_access, building_access, bail: Validator(
            access=recording_access,
            access_other=building_access,
            checks=add_checks(SLAM_RECORDING_BUILDING_INITIAL_CHECKS,
                              RECORDING_BUILDING_CHECKER),
            bail=bail)

    SLAMUpdateRecordingBuildingChecker = \
        lambda recording_access, building_access, bail: Validator(
            access=recording_access,
            access_other=building_access,
            checks=add_checks(SLAM_RECORDING_BUILDING_UPDATE_CHECKS,
                              RECORDING_BUILDING_CHECKER),
            bail=bail)
