import indoorsprotocol.positions_pb2 as pb

HI_DIST = 5.
LO_DIST = 10.

ACCURACY_LEVEL_INVALID = 0
ACCURACY_LEVEL_LOW = 1
ACCURACY_LEVEL_MEDIUM = 2
ACCURACY_LEVEL_HIGH = 3

LEGACY_POSITIONTYPE2POSITION_SOURCE = {
    pb.UNKNOWN: 0,  # Unknown
    pb.RADIO_BLE: 1,  # Bluetooth
    pb.RADIO_WIFI: 2,  # WiFi
    pb.GPS: 3,  # GNSS
    pb.APPLE: 4,  # Apple IPS

}
