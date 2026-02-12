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
