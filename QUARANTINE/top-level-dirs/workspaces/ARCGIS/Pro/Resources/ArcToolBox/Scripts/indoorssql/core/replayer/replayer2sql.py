from logging import getLogger

from indoorssql.core.sql_base import SqlBase
from indoorssql.model.replayer import *

logger = getLogger(__name__)


class ReplayerScoreCreator(SqlBase):

    def __init__(self, db_path, data):
        """
         Class for inserting data to table 'score','kpi','kpistatistics
          in benchmark database
        :param db_path: str
            sql connection string
        :param data: dict
            feed to be inserted to db
        """
        super(ReplayerScoreCreator, self).__init__(db_path,
                                                   ReplayerBenchmarkBase)
        self.data = data
        logger.info('Data feed is %s' % self.data)
        self.score_id = None

    def _add_score(self, new_kpi_id):
        logger.info('Running _add_score..  ')
        newscore_id = self.get_last_id(Score.id) + 1

        self.session.add(
            Score(
                id=newscore_id,
                benchmark_ref_id=self.data['benchmark_ref_id'],
                benchmark_obs_id=self.data['benchmark_obs_id'],
                kpi_id=new_kpi_id,
            ))
        self.score_id = newscore_id
        self.commit()

    def _add_kpi(self, d_ref_id, t_res_id, d_floor_id, **args):
        logger.info('Running _add_kpi..  ')
        new_id = self.get_last_id(Kpi.id) + 1
        self.session.add(
            Kpi(id=new_id, d_ref=d_ref_id, t_res=t_res_id, d_floor=d_floor_id))
        self.commit()
        self._add_score(new_id)

    def add_kpistatistics(self):
        _id = self.get_last_id(KpiStatistics.id) + 1
        ids = {}
        for col, val in self.data['kpi'].items():
            ids['%s_id' % col] = _id
            val['id'] = _id
            self.session.add(KpiStatistics(**val))
            _id += 1
            self.commit()

        self._add_kpi(**ids)


class ReplayerBenchmarkCreator(SqlBase):

    def __init__(self, db_path, data):
        """
         Class for inserting data to tables
          'benchmark','kpi in benchmark database
         :param db_path: str
             sql connection string
         :param data: dict
             feed to be inserted to db
         """
        super(ReplayerBenchmarkCreator, self).__init__(db_path,
                                                       ReplayerBenchmarkBase)
        self.data = data
        logger.info('Data feed is %s' % self.data)
        self.new_id = dict(kpi_id=None, benchmark_id=None)

    def _add_benchmark(self, new_kpi_id):
        benchmark_id = self.get_last_id(ReplayerBenchmark.id) + 1
        self.session.add(
            ReplayerBenchmark(id=benchmark_id,
                              locator_hash=self.data['locator_hash'],
                              profile_id=self.data['profile_id'],
                              environment_id=self.data['environment_id'],
                              kpi_id=new_kpi_id,
                              meta=self.data['meta']))
        self.new_id['kpi_id'] = new_kpi_id
        self.new_id['benchmark_id'] = benchmark_id

        self.commit()

    def _add_kpi(self, d_ref_id, t_res_id, d_floor_id):
        new_id = self.get_last_id(Kpi.id) + 1
        self.session.add(
            Kpi(id=new_id, d_ref=d_ref_id, t_res=t_res_id, d_floor=d_floor_id))
        self.commit()
        self._add_benchmark(new_id)

    def add_kpistatistics(self):
        _id = self.get_last_id(KpiStatistics.id) + 1
        ids = {}
        for col, val in self.data['kpi'].items():
            ids['%s_id' % col] = _id
            val['id'] = _id
            self.session.add(KpiStatistics(**val))
            _id += 1
            self.commit()
        self._add_kpi(**ids)


class ReplayerBenchmarkCfgCreator(SqlBase):

    def __init__(self, db_path, configuration):
        """
         Class for inserting data to tables
         'environment','recordings in benchmark database
         :param db_path: str
             sql connection string
         :param configuration:  dict
             feed to be inserted to db
         """
        super(ReplayerBenchmarkCfgCreator,
              self).__init__(db_path, ReplayerBenchmarkBase)

        self.cfg = configuration
        logger.info('Data feed is %s' % self.cfg)

    def add_environment(self):
        if 'env' in self.cfg:
            self.session.add(
                Environment(idm=self.cfg['env']['idm'],
                            building=self.cfg['env']['building'],
                            indoors_env=self.cfg['env']['indoors_env'],
                            api_key=self.cfg['env']['api_key'],
                            meta=self.cfg['env']['meta']))
            self.commit()
            new_recording_set_id = self.get_last_id(Environment.id)
            logger.info("New environment.id is %s" % new_recording_set_id)
            self._add_recording_set(new_recording_set_id)
        else:
            logger.info("Skipping add_environment, no data..")

    def _add_recording_set(self, recording_set_id):
        for recording in self.cfg['env']['recordings']:
            self.session.add(
                RecordingSet(environment_id=recording_set_id,
                             recording_id=recording))
        self.commit()

    def add_profile(self):
        if 'profile' in self.cfg:
            self.session.add(
                ReplayerProfile(
                    name=self.cfg['profile']['name'],
                    replay_sensors=self.cfg['profile']['replay_sensors'],
                    replay_radio=self.cfg['profile']['replay_radio'],
                    replay_gps=self.cfg['profile']['replay_gps'],
                    replay_pdr=self.cfg['profile']['replay_pdr'],
                    locator_params=self.cfg['profile']['locator_params'],
                    position_type=self.cfg['profile']['position_type']))
            self.commit()
            new_id = self.get_last_id(ReplayerProfile.id)
            logger.info("New replayer profile.id is %s" % new_id)
        else:
            logger.info("Skipping add_profile, no data..")


def insert_configuration(cfg, db_path):
    """
    inserting new data to benchmark db
    :param cfg: dict
        data to insert
    :param db_path:  str
        connection string to sql
    :return: none
    """
    rbcc = ReplayerBenchmarkCfgCreator(db_path, cfg)
    rbcc.run()


def insert_benchmark(data, db_path):
    """
    inserting new data to benchmark db
    :param data: dict
        data to insert
    :param db_path:  str
        connection string to sql
    :return: dict
        new ids of inserted data
    """

    rbcc = ReplayerBenchmarkCreator(db_path, data)
    rbcc.run()
    return rbcc.new_id


def insert_score(score, db_path):
    """
    inserting new data to benchmark db
    :param score: dict
        data to insert
    :param db_path:  str
        connection string to sql
    :return: int
        new score id of inserted data
    """
    rbcc = ReplayerScoreCreator(db_path, score)
    rbcc.run()
    return rbcc.score_id
