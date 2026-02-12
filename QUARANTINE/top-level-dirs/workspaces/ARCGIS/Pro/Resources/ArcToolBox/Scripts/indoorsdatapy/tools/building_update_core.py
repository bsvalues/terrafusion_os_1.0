import logging

from indoorsdatapy.common.const.network_type import WLAN

logger = logging.getLogger(__name__)


def get_updated_building(building_pb, radio_map_pb, replace=True):
    """
    Porting of radio map pb to buildng pb
    :param building_pb: indoorsprotocol.buildings_pb2
        initialized pb to be updated
    :param radio_map_pb: indoorsprotocol.SlamMap_pb2
        initialized pb to be used as update
    :param replace: bool
       true- overwrite building_pb

    :return:  indoorsprotocol.buildings_pb2
    updated buildng pb object
    """

    if replace:
        logger.info('Cleaning building pb')
        del building_pb.networks[:]
        del building_pb.fingerprint_points[:]
        del building_pb.fingerprints[:]

    logger.info(
        'Updating transmitters. Count < %s >' % len(radio_map_pb.transmitters))
    for tid, transmitter in enumerate(radio_map_pb.transmitters, 1):
        network = building_pb.networks.add()
        network.id = tid
        network.bssid = transmitter.bssid if transmitter.type == WLAN else 0
        network.channel = 0
        network.name = transmitter.ssid
        network.type = transmitter.type

    eid = 0
    floor_mapping = dict([(v.level, v.id)
                          for v in building_pb.floors
                          ])
    logger.info(
        'Updating locations and estimates. Locations count < %s >' % len(
            radio_map_pb.locations))
    for lid, location in enumerate(radio_map_pb.locations, 1):
        point = building_pb.fingerprint_points.add()
        point.id = lid
        point.x = int(location.position.x * 1e3)
        point.y = int(location.position.y * 1e3)
        point.floor_id = floor_mapping[location.position.floor]

        for estimate in location.estimates:
            eid += 1
            fingerprint = building_pb.fingerprints.add()
            fingerprint.id = eid
            fingerprint.network_id = estimate.transmitter + 1
            fingerprint.point_id = lid

            fingerprint.statistic.id = eid
            fingerprint.statistic.amount = min(1, int(estimate.weight))
            fingerprint.statistic.mean = estimate.mean
            fingerprint.statistic.variance = estimate.var

    return building_pb
