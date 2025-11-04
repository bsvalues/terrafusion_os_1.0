import json
import logging
import os
import subprocess

logger = logging.getLogger(__name__)
logging.basicConfig()
logger.setLevel(logging.DEBUG)


class Replayer(object):
    executable = '/root/app/replayer.sh'
    default = {
        'CLOUD_URL': {
            'prod': 'https://slam.indoo.rs/cloud-api',
            'test': 'https://testing.indoo.rs/cloud-api'
        },
        'INDOORS_API_ENDPOINT': {
            'prod': 'https://api.indoo.rs/indoors/rest',
            'test': 'https://testing.indoo.rs/indoors/rest'
        },
        'JOB_URL_TEMPLATE': {
            'prod': 'https://api.indoo.rs/#/admin/jobs?ids=:jobId',
            'test': 'https://testing.indoo.rs/#/admin/jobs?ids=:jobId'
        },
        'HTTP_USER': 'cloud_writer',
        'HTTP_PASS': None,
        'SETTINGS': {'debugLog': False,
                     'skipValidation': False,
                     'cpuUtilPct': 100,
                     'uploadRecordings': False,
                     'threadsNum': 8
                     },
        'CHANNEL': 'locator-benchmark',
        'PARAMS': {
            'replayer': {
                "name": "test",
                "bool": ['-replay_sensors',
                         '-replay_gps',
                         '-noreplay_pdr',
                         '-replay_radio',
                         '-replay_wifi',
                         '-replay_ble'],
                "locator_params": "",
                "position_type": 0
            },
            'buildingId': None, 'apiKey': None, 'recordings': [None],
            'settings': {
                'kpiStrategy': 'CONSTANT', 'debugLog': False,
                'skipValidation': True, 'cpuUtilPct': 100,
                'uploadRecordings': False, 'threadsNum': 8
            },
        }
    }

    def __init__(self, env, output_file, output_dir):
        """

        :param env: dict
            to update default dict
        :param output_file: str
            kpi result output

        """
        self.env = env
        self.output_file = output_file
        self.output_dir = output_dir
        self._merge_environment_conf()

    @staticmethod
    def replayer_conf_normalize(conf):
        res = []
        for attr, used in conf.items():
            if attr in ['locator_params', 'position_type', 'name', 'id']:
                continue
            if used:
                res.append('-%s' % attr)
            else:
                res.append('-no%s' % attr)
        return res

    def _merge_environment_conf(self):
        """
        Merging default configuration of replayer with the user defined
        :return:
        """
        cfg = self.default.copy()
        indoors_env = self.env['env']['indoors_env']

        cfg['PARAMS']['buildingId'] = self.env['env']['building']
        cfg['PARAMS']['apiKey'] = self.env['env']['api_key']
        cfg['PARAMS']['recordings'] = self.env['env']['recordings']
        cfg['PARAMS']['replayer']['bool'] = self.replayer_conf_normalize(
            self.env['profile'])
        cfg['PARAMS']['replayer']['locator_params'] = self.env['profile'][
            'locator_params']
        cfg['PARAMS']['replayer']['position_type'] = self.env['profile'][
            'position_type']
        cfg['PARAMS']['replayer']['name'] = self.env['profile']['name']

        cfg['CLOUD'] = {
            "http_pass": os.environ.get('HTTP_PASS'),
            "http_user": os.environ.get('HTTP_USER'),
            "cloud_url": cfg['CLOUD_URL'][indoors_env],
            'indoors_api_endpoint': cfg['INDOORS_API_ENDPOINT'][indoors_env],
            'job_url_template': cfg['JOB_URL_TEMPLATE'][indoors_env]
        }
        self.env = cfg

    def run(self):
        """
        Running replayer job in subprocess
        :return: int
            replayer return code
        """
        logger.info('running raplayer with variables %s' % self.env)
        environ = os.environ.copy()
        for name, val in self.env.items():
            environ[name] = json.dumps(val)
            logger.info('env %s:%s' % (name, environ[name]))
        environ['KPI_FILE_DEFAULT'] = self.output_file
        environ['OUTPUT_DIR'] = self.output_dir

        logger.info('Running bash %s %s' % (self.executable, environ))
        result = subprocess.Popen(['bash', self.executable], env=environ)
        result.wait()
        if result.returncode != 0:
            logger.error('replayer failed with code %s' % result.returncode)
            return result.returncode
        else:
            logger.info('replayer finished with code %s' % result.returncode)
            return result.returncode
