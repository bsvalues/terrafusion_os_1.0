from logging import getLogger

from indoorssql.core.sql_base import SqlExporter, SqlException
from indoorssql.model.replayer import ReplayerProfile, Environment, \
    RecordingSet, ReplayerBenchmark

logger = getLogger(__name__)


class ReplayerConfExporter(SqlExporter):

    def __init__(self, db_url, replayer_profile_id):
        """
        Query replayerprofile from benchmark db
        :param db_url: str
            connection string of sql
        :param replayer_profile_id: int
            unique id of replayer profile
        """
        super(ReplayerConfExporter, self).__init__(db_url)
        self._id = replayer_profile_id

    def export(self):
        rp = self.session.query(ReplayerProfile).filter(
            ReplayerProfile.id == self._id).first()
        if not rp:
            raise SqlException(
                "SqlException: No results found for env_profile_id %s" %
                self._id)
        rp = rp.__dict__.copy()
        if '_sa_instance_state' in rp:
            del rp['_sa_instance_state']
        logger.info('Fetched Replayer Configuration is %s' % rp)
        return rp


class BenchmarkExporter(SqlExporter):

    def __init__(self, db_url, benchmark_id=None):
        """
        Query benchmark table from benchmark db
        :param db_url: str
            connection string of sql
        :param benchmark_id: int
            unique id of benchmark
        """
        super(BenchmarkExporter, self).__init__(db_url)
        self._id = benchmark_id

    def export(self, benchmark_id=None):
        self._id = benchmark_id or self._id
        rp = self.session.query(ReplayerBenchmark).filter(
            ReplayerBenchmark.id == self._id).first()
        if not rp:
            raise SqlException(
                "SqlException: No results found for benchmark_id %s" % self._id)
        rp = rp.__dict__.copy()
        if '_sa_instance_state' in rp:
            del rp['_sa_instance_state']
        logger.info('Fetched Replayer Configuration is %s' % rp)
        return rp


class EnvironmentExporter(SqlExporter):

    def __init__(self, db_url, env_profile_id):
        """
        Query environment table from benchmark db
        :param db_url: str
            connection string of sql
        :param env_profile_id: int
            unique id of environment
        """
        super(EnvironmentExporter, self).__init__(db_url)
        self._id = env_profile_id

    def export(self):
        e = self.session.query(Environment).filter(
            Environment.id == self._id).first()
        recordings = self.session.query(RecordingSet.recording_id).filter(
            RecordingSet.environment_id == self._id).all()
        if not e or len(recordings) == 0:
            raise SqlException(
                "SqlException: No results found for env_profile_id %s" %
                self._id)
        e_dict = e.__dict__.copy()
        e_dict.update(dict(recordings=[q[0] for q in recordings]))
        if '_sa_instance_state' in e_dict:
            del e_dict['_sa_instance_state']
        logger.info('Fetched env variables are %s' % e_dict)
        return e_dict


def get_environment(environment_id, db_url):
    """
     Query data from benchmark db
    :param environment_id: int
        id of table environment
    :param db_url: str
        connection string of db
    :return: dict
        key=column, val=value
    """
    eo = EnvironmentExporter(db_url, environment_id)
    return eo.export()


def get_replayer_conf(configuration_id, db_url):
    """
      Query data from benchmark db
     :param configuration_id: int
         id of table replayerprofile
     :param db_url: str
         connection string of db
     :return: dict
         key=column, val=value
     """
    rco = ReplayerConfExporter(db_url, configuration_id)
    return rco.export()


def get_benchmark(ids, db_url):
    """
      Query data from benchmark db
     :param ids: list(int)
         ids of table benchmark
     :param db_url: str
         connection string of db
     :return: dict(dict)
        {id:int}:{column: value}
     """
    result = {}
    be = BenchmarkExporter(db_url)
    for _id in ids:
        result[_id] = be.export(_id)
    return result
