#!/usr/bin/env python
# -*- coding: utf-8 -*-
import re
from logging import getLogger


# Setup the logger
logger = getLogger(__name__)

WLAN = 0
GSM = 1
UKW = 2
BLUETOOTH = 3
BLUETOOTH_LE = 4
IBEACON = 5

__id_pattern = re.compile("([0-5]{1})_(.*)")


def is_bluetooth(type):
    return type in (
        BLUETOOTH,
        BLUETOOTH_LE,
        IBEACON)

def is_wifi(type):
    return type in (WLAN,)

def get_unique_id_by_tuple(bssid, ssid, txtype):
    txtype = int(txtype)
    nw_id = None
    if is_bluetooth(txtype):
        nw_id = ssid
    elif is_wifi(txtype):
        nw_id = bssid

    if nw_id is not None:
        return "{}_{}".format(txtype, nw_id)
    else:
        raise ValueError("Transmitter {} of unsupported type".format(txtype))


def get_identification(unique_id):
    """
    Returns a tuple containing (bssid, ssid, network_type) based on a virtual ID
    :param unique_id: virtual ID calculated with get_unique_id
    :return: tuple (bssid, ssid, network_type). If type is wifi, ssid will not be set. If type is bluetooth, ssid will not be set.
    Note: ssid must be string
    """
    matcher = __id_pattern.match(unique_id)
    txtype = int(matcher.group(1))
    nw_id = matcher.group(2)
    if is_bluetooth(txtype):
        return 0, nw_id, txtype
    elif is_wifi(txtype):
        return nw_id, '', txtype
    else:
        raise ValueError("Transmitter {} of unsupported class".format(txtype))


def get_network_name(network_type):
    try:
        return {WLAN: "WLAN", GSM: "GSM", UKW: "UKW", BLUETOOTH: "BLUETOOTH",
                BLUETOOTH_LE: "BLUETOOTH_LE", IBEACON: "IBEACON"}[network_type]
    except:
        raise ValueError("Unsupported type {}".format(network_type))
