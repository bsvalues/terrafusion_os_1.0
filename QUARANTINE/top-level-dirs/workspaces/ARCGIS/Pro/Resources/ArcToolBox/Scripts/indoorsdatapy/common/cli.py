import argparse
from functools import reduce
from logging import basicConfig, DEBUG, INFO

from indoorsdatapy.access.provider.load_access import access_loader
from indoorsdatapy.server_utils.cloud_entity import BUILDINGS, RECORDINGS
from indoorsdatapy.server_utils.cloud_env import TEST, DEV, PROD


def cloud_env(parser, kwargs):
    parser.add_argument(
        '-e', "--environment",
        action='store',
        required=True,
        choices=[DEV, TEST, PROD],
        help='Cloud environment', **kwargs
    )
    parser.add_argument(
        "-n", '--no_cache', action='store_true',
        help="Force download - not use local cache")
    return parser


def building_id(parser, kwargs):
    use_kargs = {
        "help": "building id to use",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-b", "--building_id", metavar="ID",
        type=int, **use_kargs)
    return parser


def building_ids(parser, kwargs):
    use_kargs = {
        "help": "building id(s) to use",
        "nargs": "+"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-b", "--building_ids", metavar="IDS",
        type=int, **use_kargs)
    return parser


def building_dto(parser, kwargs):
    use_kargs = {
        "help": "path of building dto",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-B", "--building_dto", metavar="DTO",
        type=str, **use_kargs)
    return parser

def idm_id(parser, kwargs):
    use_kargs = {
        "help": "idm id",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-o", "--idm_id", metavar="ID",
        type=int, **use_kargs)
    return parser

def idm(parser, kwargs):
    use_kargs = {
        "help": "path of idm file",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-I", "--idm", metavar="ZIP",
        type=str, **use_kargs)
    return parser

def building_bundle(parser, kwargs):
    use_kargs = {
        "help": "path of building_bundle file",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-B", "--building_bundle", metavar="ZIP",
        type=str, **use_kargs)

    return parser

def kpi_dto(parser, kwargs):
    use_kargs = {
        "help": "path of kpi dto",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-K", "--kpi_dto", metavar="DTO",
        type=str, **use_kargs)
    return parser


def kpi_dtos(parser, kwargs):
    use_kargs = {
        "help": "path of kpis dto",
        "nargs": "+"

    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-K", "--kpi_dtos", metavar="DTOs",
        type=str, **use_kargs)
    return parser


def pkl(parser, kwargs):
    use_kargs = {
        "help": "pkl",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "--pkl", metavar="PKL",
        type=str, **use_kargs)
    return parser


def building_dtos(parser, kwargs):
    use_kargs = {
        "help": "path of building dto(s)",
        "nargs": "+"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-B", "--building_dtos", metavar="DTOS",
        type=str, **use_kargs)
    return parser


def building(parser, kwargs):
    use_kargs = {
        "required": True,
    }
    use_kargs.update(kwargs)
    building = parser.add_mutually_exclusive_group(**use_kargs)
    building_id(building, {})
    building_dto(building, {})
    return parser


def recording_ids(parser, kwargs):
    use_kargs = {
        "help": "recording id(s) to use",
        "nargs": "+"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-r", "--recording_ids", metavar="IDS",
        type=int, **use_kargs)
    return parser


def recording_dtos(parser, kwargs):
    use_kargs = {
        "help": "Path of recordings dto(s)",
        "nargs": "+"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-R", "--recording_dtos", metavar="DTOS",
        type=str, **use_kargs)
    return parser


def replayer_dtos(parser, kwargs):
    use_kargs = {
        "help": "Path of replayer dto(s)",
        "nargs": "+"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-L", "--replayer_dtos", metavar="DTOS",
        type=str, **use_kargs)
    return parser


def recordings(parser, kwargs):
    use_kargs = {
        "required": True,
    }
    use_kargs.update(kwargs)
    recordings = parser.add_mutually_exclusive_group(**use_kargs)
    recording_ids(recordings, {})
    recording_dtos(recordings, {})
    return parser


def recording_id(parser, kwargs):
    use_kargs = {
        "help": "recording id to use",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-r", "--recording_id", metavar="ID",
        type=int, **use_kargs)
    return parser


def recording_dto(parser, kwargs):
    use_kargs = {
        "help": "Path of recordings dto",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-R", "--recording_dto", metavar="DTO",
        type=str, **use_kargs)
    return parser


def epsg(parser, kwargs):
    use_kargs = {
        "help": "EPSG code of coordinate reference system",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "--epsg", metavar="DTO",
        type=str, **use_kargs)

    return parser


def slam_dto(parser, kwargs):
    use_kargs = {
        "help": "Path of slam dto",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "--slam_dto", metavar="DTO",
        type=str, **use_kargs)
    return parser


def slam_map_dtos(parser, kwargs):
    use_kargs = {
        "help": "Path of slam dto",
        "nargs": "+"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-M", "--slam_map_dtos", metavar="DTO",
        type=str, **use_kargs)

    return parser


def slam_map_dto(parser, kwargs):
    use_kargs = {
        "help": "Path of slam dto",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-M", "--slam_map_dto", metavar="DTO",
        type=str, **use_kargs)

    return parser


def slam_trajectory_dto(parser, kwargs):
    use_kargs = {
        "help": "Path of slam_trajectory_dto",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-T", "--slam_trajectory_dto", metavar="DTO",
        type=str, **use_kargs)
    return parser


def slam_trajectory_dtos(parser, kwargs):
    use_kargs = {
        "help": "Path of slam_trajectory_dto",
        "nargs": "+"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-T", "--slam_trajectory_dtos", metavar="DTO",
        type=str, **use_kargs)
    return parser


def slam_grid_dtos(parser, kwargs):
    use_kargs = {
        "help": "Path of slam_grid_dto",
        "nargs": "+"

    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-G", "--slam_grid_dtos", metavar="DTO",
        type=str, **use_kargs)
    return parser


def slam_grid_dto(parser, kwargs):
    use_kargs = {
        "help": "Path of slam_grid_dto",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-G", "--slam_grid_dto", metavar="DTO",
        type=str, **use_kargs)
    return parser


def slam_prior_grid_dto(parser, kwargs):
    use_kargs = {
        "help": "Path of slam_prior_grid_dto",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-P", "--slam_prior_grid_dto", metavar="DTO",
        type=str, **use_kargs)
    return parser


def slam_radio_map(parser, kwargs):
    use_kargs = {
        "help": "Path of slam_radio_map",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-S", "--slam_radio_map", metavar="DTO",
        type=str, **use_kargs)
    return parser


def slam_radio_maps(parser, kwargs):
    use_kargs = {
        "help": "Path of slam_radio_map",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-S", "--slam_radio_map", metavar="DTO",
        type=str, **use_kargs)
    return parser


def recording(parser, kwargs):
    use_kargs = {
        "required": True,
    }
    use_kargs.update(kwargs)
    recording = parser.add_mutually_exclusive_group(**use_kargs)
    recording_id(recording, {})
    recording_dto(recording, {})
    return parser


def settings(parser, kwargs):
    use_kargs = {
        "help": "Settings (json string)"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-s", "--settings", metavar="SETTINGS_JSON",
        type=str, **use_kargs)
    return parser


def input_file(parser, kwargs):
    use_kargs = {
        "help": "Input file path",
        "required": True,
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-i", "--input_file", metavar="INPUT_FILE",
        type=str, **use_kargs)
    return parser


def input_files(parser, kwargs):
    use_kargs = {
        "help": "Input file path",
        "nargs": "+"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-i", "--input_files", metavar="INPUT_FILES", type=str, **use_kargs)
    return parser


def output_file(parser, kwargs):
    use_kargs = {
        "help": "Output file destination",
        "required": True,
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-o", "--output_file", metavar="OUTPUT_FILE",
        type=str, **use_kargs)
    return parser


def output_dir(parser, kwargs):
    use_kargs = {
        "help": "Output dir destination",
        "required": True,
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-d", "--output_dir", metavar="OUTPUT_DIR",
        type=str, **use_kargs)
    return parser


def input_dir(parser, kwargs):
    use_kargs = {
        "help": "Input dir destination",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "--input_dir", metavar="INPUT_DIR",
        type=str, **use_kargs)
    return parser


def output_prefix(parser, kwargs):
    use_kargs = {
        "help": "Prefix of output file",
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-p", "--output_prefix", metavar="OUTPUT_FILE_PREFIX",
        type=str, **use_kargs)
    return parser


def file_format(parser, kwargs):
    use_kargs = {
        "help": "File format for table output",
        "required": True,
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-f", "--file_format", **use_kargs)
    return parser


def transmitters(parser, kwargs):
    use_kargs = {
        "help": "Transmitters to use",
        "nargs": "+"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-t", "--transmitters", metavar="TRANSMITTERS",
        type=str, **use_kargs)
    return parser


def floor_levels(parser, kwargs):
    use_kargs = {
        "help": "floor_levels to use"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-f", "--floor_levels", metavar="floor_levels",
        type=int, nargs="+", **use_kargs)
    return parser


def interactive_plot(parser, kwargs):
    use_kargs = {
        "help": "Show plots in matplotlib window"
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-i", "--interactive", action='store_true', **use_kargs)
    return parser


def server_url(parser, kwargs):
    use_kargs = {
        "help": "url of server",
        "required": True,
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-u", "--server_url", metavar="URL",
        type=str, **use_kargs)
    return parser


def building_api_url(parser, kwargs):
    # https://api.indoo.rs/indoors/rest
    # https://testing.indoo.rs/indoors/rest
    # https://indoors-server-dev.indoo.rs/indoors/rest

    use_kargs = {
        "help": "output dir destination",
        "required": False,
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-a", "--building_api_url", metavar="URL",
        type=str, **use_kargs)
    return parser


def api_key(parser, kwargs):
    use_kargs = {
        "help": "api key of application",
        "required": False,
    }
    use_kargs.update(kwargs)
    parser.add_argument(
        "-k", "--api_key", metavar="API_KEY",
        type=str, **use_kargs)
    return parser


def verbose(parser, kwargs):
    """
    To use setup logger on DEBUG

    """
    parser.add_argument(
        '--verbose', action='store_true', default=False,
        help="increase output verbosity")
    return parser


def quiet(parser, kwargs):
    """
    To use switch off logger

    """
    parser.add_argument(
        '--quiet', action='store_true', default=False,
        help="decrease output verbosity")
    return parser


def overwrite(parser, kwargs):
    parser.add_argument(
        '--overwrite', action='store_true', default=False,
        help="force overwrite output if exists")
    return parser


def custom_parser(arglist, description="Indoors CLI parser"):
    """
    Allows to create python cli parser based on predefined functions of this module.
    The purops is unification of cli interfaces of indoors cli tools
    >>> parser = custom_parser([building_dto, (recording, {"required": True}), (settings, {"default": "banana"})])
    >>> parsed = parser.parse_args()
    >>> print(parsed)
    Parameters
    ----------
    arglist - function of this module e.g server_url(adding argument to sdt python parser)
     or list of tuples where first item of tuple is function(above) and next are additional arguments stored in dict,
    description - free string

    Returns
    -------
    initialized ArgumentParser
    """
    parser = argparse.ArgumentParser(
        description="%s" % description,
        epilog="(c) indoo.rs GmbH")

    # add default arguments
    arglist += [verbose, quiet, overwrite]
    return reduce(lambda x, y: y[0](x, y[1] if len(y) > 1 else {})
    if isinstance(y, tuple) else y(x, {}), arglist, parser)


def cli_helper(args):
    """
    Helper for loading services for buildng and recording
    Parameters
    ----------
    args Parsed args

    Returns
    -------
    dict where key buildings or/and key buildings is service
    """
    out = {}
    building_args = {}
    if hasattr(args, 'building_id'):
        building_args['idents'] = args.building_id
    if hasattr(args, 'building_dto'):
        building_args['local_paths'] = args.building_dto
    if building_args:
        building_args['env'] = args.environment
        building_args['force'] = args.no_cache
        building_args['entity'] = BUILDINGS
        out['buildings'] = access_loader(**building_args)

    recording_args = {}
    if hasattr(args, 'recording_ids'):
        recording_args['idents'] = args.recording_ids
    if hasattr(args, 'recording_dtos'):
        recording_args['local_paths'] = args.recording_dtos

    if recording_args:
        recording_args['env'] = args.environment
        recording_args['force'] = args.no_cache
        recording_args['entity'] = RECORDINGS
        out['recordings'] = access_loader(**recording_args)

    basicConfig(level=DEBUG if hasattr(args, 'verbose') else INFO)

    return out
