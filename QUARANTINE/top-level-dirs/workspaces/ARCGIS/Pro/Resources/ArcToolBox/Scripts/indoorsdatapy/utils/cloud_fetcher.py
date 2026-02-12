#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Download entities from indoors cloud
usage: cloud_fetcher.py [-h] --env {dev,test,prod} --entity
                        {buildings,recordings,slams,idms} --id IDs [IDs ...]
                        [-o OUTPUT] [-f]

optional arguments:
  -h, --help            show this help message and exit
  --env {dev,test,prod}
  --entity {buildings,recordings,slams,idms}
  --id IDs [IDs ...], --ids IDs [IDs ...]
                        id(s) to use
  -o OUTPUT, --output OUTPUT
  -f                    Force download over cached

"""
import logging
from argparse import ArgumentParser

from indoorsdatapy.common.cli import *
from indoorsdatapy.server_utils.cloud_fetcher import ParallelCachedFetcher

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)



def main():
    parser = ArgumentParser(description=main.__doc__)
    parser.add_argument("--env",
                        required=True,
                        action='store',
                        choices=[DEV, TEST, PROD],
                        )

    parser.add_argument("--entity",
                        required=True,
                        action='store',
                        choices=[BUILDINGS, RECORDINGS, SLAMS, IDMS])

    parser.add_argument("--id", "--ids", metavar="IDs", type=int, nargs="+",
                        help="id(s) to use", required=True)

    parser.add_argument("-o", "--output", default=False, required=False)

    parser.add_argument("-f", action='store_true',
                        help="Force download over cached", )

    args = parser.parse_args()

    fetcher = ParallelCachedFetcher(env=args.env,
                                    entity=args.entity,
                                    force=args.f,
                                    out=args.output)
    fetcher.get_paths(args.id)


if __name__ == "__main__":
    main()
