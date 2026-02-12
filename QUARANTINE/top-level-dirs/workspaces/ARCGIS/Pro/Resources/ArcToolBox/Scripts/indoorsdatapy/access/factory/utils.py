from logging import getLogger

logger = getLogger(__name__)

from indoorsdatapy.access.factory.df2pb import dfs2pb


def update_pb(frames, pb_object):
    """
    Update pb object by frames
    Parameters
    ----------
    frames - dict of frames: dict{property:panda data frame}
             naming of keys accordingly to <entity> pb definition

    pb_object - initialized protobuff object

    Returns
    -------
    initialized proto object

    """
    return dfs2pb(frames, pb_object)


def validate(pb_instance):
    """
    Validate the protocol buffer object. If true, can be serialized
    Parameters
    ----------
    pb_instance

    Returns
    -------

    """
    return pb_instance.IsInitialized()


def save(pb_instance, to):
    """
    Serialize protocol buffer object to binary
    Parameters
    ----------
    pb_instance
    to std or open('wb')

    Returns
    -------
    None
    """
    to.write(pb_instance.SerializeToString())


def load_pb(pb_cls, pb_file):
    """
    Allows to initialize protocol buffer object using binary file
    Parameters
    ----------
    pb_cls
    pb_file

    Returns
    -------
    Initialized protocol buffer object
    """
    if not hasattr(pb_file, 'read'):
        logger.error("Dto must be open('file.pb','rb)")

    pb = pb_cls()
    pb.ParseFromString(pb_file.read())
    return pb
