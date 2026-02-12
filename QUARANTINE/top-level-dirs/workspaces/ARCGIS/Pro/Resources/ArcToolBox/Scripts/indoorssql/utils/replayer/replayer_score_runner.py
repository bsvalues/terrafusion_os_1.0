"""
usage: replayer_score_runner.py [-h] -u URL [--verbose] [--quiet]
                                [--overwrite] [-R ID] [-O ID]

Running comparison of two kpis,adding result to db, positing slack: None

optional arguments:
  -h, --help            show this help message and exit
  -u URL, --server_url URL
                        url of server
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists
  -R ID, --benchmark_id_ref ID
  -O ID, --benchmark_id_obs ID

(c) indoo.rs GmbH

"""
import os
import shutil
import sys
from logging import getLogger

import pandas as pd

from indoorsdatapy.access.provider.load_access import access_loader, \
    KPI_BENCHMARKS, BUILDINGS, IDMS
from indoorsdatapy.common.cli import server_url, custom_parser, output_dir, \
    output_file
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.server_utils.cloud_env import PROD
from indoorsdatapy.tools.kpi.kpi_slack import BenchmarkSlack
from indoorsdatapy.tools.replayer_benchmark.evaluation import evaluation
from indoorsdatapy.tools.slack import SlackException
from indoorsdatapy.utils.kpi.kpi_csv import save_kpi_csv
from indoorsdatapy.utils.kpi.kpi_generator import FIELDS_STATS
from indoorssql.core.replayer.replayer2sql import insert_score
from indoorssql.core.replayer.sql2replayer import get_benchmark, \
    get_replayer_conf, get_environment

logger = getLogger(__name__)


class BenchmarkAccess(object):

    def __init__(self, benchmark_id, database):
        self.b_id = benchmark_id
        self.kpi = None
        self.building_pb = None
        self.idm = None

        self.database = database
        self.benchmark = get_benchmark([self.b_id], database)[self.b_id]
        self.replayer = get_replayer_conf(self.benchmark['profile_id'],
                                          database)
        self.env = get_environment(self.benchmark['environment_id'], database)

    def download_kpi(self, out_file=None):
        self.kpi = access_loader(KPI_BENCHMARKS,
                                 PROD, [self.benchmark['kpi_id']],
                                 only_path=True)[0]
        if out_file:
            shutil.move(self.kpi, out_file)
            self.kpi = out_file

    def download_building(self, out_file=None):
        self.building_pb = access_loader(BUILDINGS,
                                         PROD,
                                         self.env['building'],
                                         only_path=True)[0]
        if out_file:
            shutil.move(self.building_pb, out_file)
            self.building_pb = out_file

    def download_idm(self, out_file=None):
        self.idm = access_loader(IDMS, PROD, [self.env['idm']],
                                 only_path=True)[0]
        if out_file:
            shutil.move(self.idm, out_file)
            self.idm = out_file

    @staticmethod
    def insert_score(results, benchmark_id_ref, benchmark_id_obs, database):
        # adding new results to benchmark db
        return insert_score(
            {
                'kpi': results['score'],
                'benchmark_ref_id': benchmark_id_ref,
                'benchmark_obs_id': benchmark_id_obs
            }, database)


class SlackReportMaker(object):
    slam_url = 'https://slam.indoo.rs/cloud-api/cache'
    myindors_url = 'https://my.indoo.rs'

    def __init__(self, score_access):
        self.r = score_access.r
        self.o = score_access.o
        self.s = score_access
        self.msg = None
        self.build_msg()

    def build_msg(self):
        percentile = [.05, .15, .25, .50, .75, .85, .95]
        pd.set_option('precision', 3)
        pd.set_option('expand_frame_repr', True)
        pd.set_option('max_rows', 500)
        # formatting result for slack message
        feed = format_msg(self.s.results['score'])
        recordings = pd.DataFrame(self.s.results['recordings'])
        sl = BenchmarkSlack()
        sl.add_item('Environment.name', self.r.env['meta'])
        sl.add_item(
            'Environment.building + .id', "building: %s; id: %s" %
            (self.r.env['building'], self.r.benchmark['environment_id']))

        sl.add_item(
            'Reference replayerprofile + .id', "%s; name: %s; id: %s" %
            ("KNN" if int(self.r.replayer['position_type']) == 0 else "FINAL",
             self.r.replayer['name'], self.r.benchmark['profile_id']))
        sl.add_item(
            'Observed replayerprofile + .id', "%s; name: %s; id: %s" %
            ("KNN" if int(self.o.replayer['position_type']) == 0 else "FINAL",
             self.o.replayer['name'], self.o.benchmark['profile_id']))

        sl.add_item('Reference benchmark + .id',
                    "%s; id: %s" % (self.r.benchmark['meta'], self.r.b_id))
        sl.add_item('Observed benchmark + .id',
                    "%s; id: %s" % (self.o.benchmark['meta'], self.o.b_id))

        sl.add_item(
            'Reference kpi', "%s/kpi_benchmarks/%s.pb" %
            (self.slam_url, self.r.benchmark['kpi_id']))
        sl.add_item(
            'Observed kpi', "%s/kpi_benchmarks/%s.pb" %
            (self.slam_url, self.o.benchmark['kpi_id']))

        sl.add_item('Reference locator git hash',
                    self.r.benchmark['locator_hash'])
        sl.add_item('Observed locator git hash',
                    self.o.benchmark['locator_hash'])

        sl.add_item(
            'Reference replays  archive', "%s/kpi_replays/%s.zip" %
            (self.slam_url, self.r.benchmark['kpi_id']))
        sl.add_item(
            'Observed replays archive', "%s/kpi_replays/%s.zip" %
            (self.slam_url, self.o.benchmark['kpi_id']))

        sl.add_item('Bad recordings (top 3)',
                    recordings.to_csv(sep=' ', float_format='%g'), False)
        sl.add_item('Score archive',
                    "%s/kpi_scores/%s.zip" % (self.slam_url, self.s.new_id))

        sl.add_item(
            'Kpi viewer',
            "%s/#/admin/benchmark?kpi_benchmarks=%s&kpi_benchmarks=%s" %
            (self.myindors_url, self.r.benchmark['kpi_id'],
             self.o.benchmark['kpi_id']),
        )

        sl.add_item('Evaluation: passed recordings [%](obs=<ref)', feed, False)
        sl.add_item('One mark (90 % of recordings better???)',
                    'POSITIVE' if self.s.results['valid'] else "NEGATIVE")
        self.msg = sl

    def send(self):
        try:
            self.msg.send_msg(self.s.results['valid'])
        except SlackException as e:
            logger.warning('Slack message not posted\nERROR: %s' % e)


class ScoreMaker(object):

    def __init__(self, benchmark_access_ref, benchmark_access_obs, output_dir):
        self.r = benchmark_access_ref
        self.o = benchmark_access_obs
        self.output_dir = output_dir
        self.results = self.make_evaluation()
        self.new_id = BenchmarkAccess.insert_score(
            self.results, self.r.b_id, self.o.b_id,
            benchmark_access_ref.database)

    def save_csv_report(self):
        save_kpi_csv(
            self.r.kpi,
            os.path.join(self.output_dir,
                         'ref_%s' % self.r.benchmark['kpi_id']), FIELDS_STATS)
        save_kpi_csv(
            self.o.kpi,
            os.path.join(self.output_dir,
                         'obs_%s' % self.o.benchmark['kpi_id']), FIELDS_STATS)

    def make_evaluation(self):
        return evaluation(self.r.kpi, self.o.kpi)

    def make_archive(self, out_file):
        # zipping kpis to archive
        logger.info('New score_id is: %s' % self.new_id)

        out_path = os.path.join(self.output_dir, 'comparison')
        if os.path.exists(out_path) and os.path.isdir(out_path):
            shutil.rmtree(out_path)
        os.makedirs(out_path)

        self.results['raw']['ref_desc'].to_csv(
            os.path.join(out_path, 'ref_overall.csv'))
        self.results['raw']['obs_desc'].to_csv(
            os.path.join(out_path, 'obs_overall.csv'))
        self.results['raw']['score'].to_csv(
            os.path.join(out_path, 'score_overall.csv'))
        self.results['raw']['diff'].to_csv(
            os.path.join(out_path, 'diff_overall.csv'))
        shutil.make_archive("%s%s" % (out_file, self.new_id), 'zip',
                            self.output_dir)


def format_msg(input_feed):
    feed = '\n'
    for col, res in input_feed.items():
        feed += '%s' % col
        for stat, val in res.items():
            if stat == 'id':
                continue
            feed += '\n\t: %s\t\t%s' % (stat, val)
        feed += '\n'
    return feed


def main():
    args = [server_url, output_dir, output_file]

    parser = custom_parser(
        args,
        description="Running comparison of two kpis, adding result to db, "
        "posting slack msg: {}".format(__doc__))

    parser.add_argument("-R", "--benchmark_id_ref", metavar="ID", type=int)
    parser.add_argument("-O", "--benchmark_id_obs", metavar="ID", type=int)
    parser.add_argument("-F", "--force", type=bool, default=False)

    parser.add_argument("--out_file_ref", type=str)
    parser.add_argument("--out_file_obs", type=str)
    parser.add_argument("--out_building_dto", type=str)
    parser.add_argument("--out_idm", type=str)
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    ref = BenchmarkAccess(parsed.benchmark_id_ref, parsed.server_url)
    obs = BenchmarkAccess(parsed.benchmark_id_obs, parsed.server_url)

    if ref.benchmark['profile_id'] != obs.benchmark['profile_id']:
        logger.warning('Comparison of different replayer profiles')
    if not parsed.force and ref.benchmark['environment_id'] != obs.benchmark[
            'environment_id']:
        logger.error('Does not make sense to compare two different indoors env')
        sys.exit(9)

    ref.download_kpi(parsed.out_file_ref)
    obs.download_kpi(parsed.out_file_obs)

    ref.download_idm(parsed.out_idm or None)
    ref.download_building(parsed.out_building_dto or None)

    sam = ScoreMaker(ref, obs, parsed.output_dir)
    sam.save_csv_report()
    sam.make_archive(parsed.output_file)
    srm = SlackReportMaker(sam)
    srm.send()


if __name__ == '__main__':
    main()
