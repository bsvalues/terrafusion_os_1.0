#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Load services for given specification

Authors
-------
indoo.rs research department
       + matej@indoo.rs

"""

from indoorsdatapy.access.building import BuildingAccess
from indoorsdatapy.access.kpi import KpiAccess
from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.access.slam_map import load_slam_map
from indoorsdatapy.access.trajectory import TrajectoryAccess
from indoorsdatapy.server_utils.cloud_entity import *
from indoorsdatapy.server_utils.cloud_fetcher import ParallelCachedFetcher


def access_loader(entity, env=None, idents=None, force=False, local_paths=None,
                  mixed=None, only_path=False):
    """
    Function provide fetching data and load services
    Parameters
    ----------
    env: from indoorsdatapy.server_utils.cloud_env import DEV,TEST,PROD
    entity:  from indoorsdatapy.server_utils.cloud_entity import BUILDINGS,RECORDINGS,IDMS,SLAMS, KPIS,KPI_BENCHMARKS
    idents: identifiers of entity to be download
    force: not use cached files
    local_paths: paths of local dto
    mixed: dict of env:idents allows to load services from different environment e.g {PROD:[1,2,11]}

    Returns
    -------
    dictionary where key() is path to file and val() is services of given entity.
    In case of IDMS returned is output path to file
    """

    services = {}
    local_paths = _access_fetcher(entity, env, idents, force, local_paths,
                                  mixed)
    if only_path:
        return local_paths

    for path in local_paths:
        if entity == SLAMS:
            services[path] = load_slam_map(open(path, 'rb'))
        if entity == BUILDINGS:
            services[path] = BuildingAccess(path)
        if entity == RECORDINGS:
            services[path] = RecordingAccess(path)
        if entity == TRAJECTORIES:
            services[path] = TrajectoryAccess(path)
        if entity == KPI_BENCHMARKS or entity == KPIS:
            services[path] = KpiAccess(path)
        if entity == IDMS:
            raise NotImplementedError

    return services


def access_gen(entity, env=None, idents=None, force=False, local_paths=None,
               mixed=None):
    """
    Function provide fetching data and load services
    Parameters
    ----------
    env: from indoorsdatapy.server_utils.cloud_env import DEV,TEST,PROD
    entity:  from indoorsdatapy.server_utils.cloud_entity import BUILDINGS,RECORDINGS,IDMS,SLAMS
    idents: identifiers of entity to be download
    force: not use cached files
    local_paths: paths of local dto
    mixed: dict of env:idents allows to load services from different environment e.g {PROD:[1,2,11]}

    Returns
    -------
    dictionary where key() is path to file and val() is services of given entity.
    In case of IDMS returned is output path to file
    """

    services = {}
    local_paths = _access_fetcher(entity, env, idents, force, local_paths,
                                  mixed)

    for path in local_paths:
        if entity == SLAMS:
            services[path] = load_slam_map(open(path, 'rb'))
        if entity == BUILDINGS:
            services[path] = BuildingAccess(path)
        if entity == RECORDINGS:
            services[path] = RecordingAccess(path)
        if entity == TRAJECTORIES:
            services[path] = TrajectoryAccess(path)
        if entity == KPI_BENCHMARKS or entity == KPIS:
            services[path] = KpiAccess(path)
        if entity == IDMS:
            raise NotImplementedError

        yield path, services


def _access_fetcher(entity, env=None, idents=None, force=False,
                    local_paths=None, mixed=None):
    if local_paths:
        local_paths = [local_paths] if isinstance(local_paths,
                                                  str) else local_paths
    else:
        local_paths = []

    if not mixed:
        if None not in [env, entity, idents, force]:
            fetcher = ParallelCachedFetcher(env=env, entity=entity,
                                            force=force)
            local_paths += fetcher.get_paths(idents)
    else:
        for environ, _ids in mixed.iteritems():
            fetcher = ParallelCachedFetcher(env=environ, entity=entity,
                                            force=force)
            local_paths += fetcher.get_paths(_ids)

    return local_paths
