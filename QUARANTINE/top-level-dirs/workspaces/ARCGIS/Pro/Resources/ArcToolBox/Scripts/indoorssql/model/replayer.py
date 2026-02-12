from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Boolean,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

ReplayerBenchmarkBase = declarative_base()


class ReplayerProfile(ReplayerBenchmarkBase):
    __tablename__ = 'replayerprofile'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    replay_sensors = Column(Boolean)
    replay_radio = Column(Boolean)
    replay_gps = Column(Boolean)
    replay_pdr = Column(Boolean)
    locator_params = Column(String)
    position_type = Column(Integer)


class Environment(ReplayerBenchmarkBase):
    __tablename__ = 'environment'
    id = Column(Integer, primary_key=True)
    api_key = Column(String)
    building = Column(Integer)
    idm = Column(Integer)
    indoors_env = Column(String)
    meta = Column(String)


class RecordingSet(ReplayerBenchmarkBase):
    __tablename__ = 'recording'
    id = Column(Integer, primary_key=True)
    recording_id = Column(Integer)
    environment_id = Column(Integer, ForeignKey("environment.id"))


class ReplayerBenchmark(ReplayerBenchmarkBase):
    __tablename__ = 'benchmark'
    id = Column(Integer, primary_key=True)
    datetime = Column(DateTime(timezone=True), server_default=func.now())
    locator_hash = Column(String)
    profile_id = Column(Integer, ForeignKey('replayerprofile.id'))
    environment_id = Column(Integer, ForeignKey('environment.id'))
    kpi_id = Column(Integer, ForeignKey('kpi.id'))
    meta = Column(String)


class Kpi(ReplayerBenchmarkBase):
    __tablename__ = 'kpi'
    id = Column(Integer, primary_key=True)
    d_ref = Column(Integer, ForeignKey('kpistatistics.id'))
    t_res = Column(Integer, ForeignKey('kpistatistics.id'))
    d_floor = Column(Integer, ForeignKey('kpistatistics.id'))


class KpiStatistics(ReplayerBenchmarkBase):
    __tablename__ = 'kpistatistics'
    id = Column(Integer, primary_key=True)
    mean = Column(Float)
    median = Column(Float)
    std = Column(Float)


class Score(ReplayerBenchmarkBase):
    __tablename__ = 'score'
    id = Column(Integer, primary_key=True)
    benchmark_ref_id = Column(Integer, ForeignKey('benchmark.id'))
    benchmark_obs_id = Column(Integer, ForeignKey('benchmark.id'))
    kpi_id = Column(Integer, ForeignKey('kpi.id'))
