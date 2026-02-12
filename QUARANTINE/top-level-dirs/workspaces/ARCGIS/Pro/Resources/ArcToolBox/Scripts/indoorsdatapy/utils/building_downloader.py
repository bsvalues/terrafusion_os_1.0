#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script for downloading building IDM file from indoo.rs api
usage: building_downloader.py [-h] -b BUILDING_ID -a API_KEY [-s SERVER_URL]
                              [-r RETRIES] [-i RETRY_INTERVAL] -o OUTPUT_FILE

Download building IDM from server

optional arguments:
  -h, --help            show this help message and exit
  -b BUILDING_ID, --building_id BUILDING_ID
                        identifier (unique, first, original one) of the
                        building to fetch
  -a API_KEY, --api_key API_KEY
                        api key to fetch building
  -s SERVER_URL, --server_url SERVER_URL
                        Building server url
  -r RETRIES, --retries RETRIES
                        Number of retries
  -i RETRY_INTERVAL, --retry_interval RETRY_INTERVAL
                        Retry interval
  -o OUTPUT_FILE, --output OUTPUT_FILE
                        Name of output file

"""
import sys
from argparse import ArgumentParser
from logging import basicConfig, getLogger, DEBUG

from indoorsdatapy.server_utils.download_building import downloadBuilding

logger = getLogger(__name__)


def main():
    parser = ArgumentParser(description="Download building IDM from server")
    parser.add_argument("-b", "--building_id", metavar="BUILDING_ID", required=True,
                        help="identifier (unique, first, original one) of the building to fetch")

    parser.add_argument("-a", "--api_key", metavar="API_KEY", required=True,
                        help="api key to fetch building")

    parser.add_argument("-s", "--server_url", metavar="SERVER_URL",
                        required=False, default="https://api.indoo.rs",
                        help="Building server url")

    parser.add_argument("-r", "--retries", metavar="RETRIES",
                        default=3, required=False,
                        help="Number of retries")

    parser.add_argument("-i", "--retry_interval", metavar="RETRY_INTERVAL",
                        default=30, required=False,
                        help="Retry interval")

    parser.add_argument("-o", "--output", metavar="OUTPUT_FILE",
                        required=True,
                        help="Name of output file")

    basicConfig(level=DEBUG)
    args = parser.parse_args()
    out = downloadBuilding(apiKey=args.api_key,
                           buildingId=args.building_id,
                           target=args.output,
                           server_url=args.server_url,
                           retries=args.retries,
                           retry_interval=args.retry_interval)

    if len(out) == 0:
        logger.debug('ERROR: Download of building: < %s > failed' % args.building_id)
        sys.exit(1)
    else:
        logger.debug('Download of building: < %s > succeed: %s' % (args.building_id, out))


if __name__ == "__main__":
    main()
