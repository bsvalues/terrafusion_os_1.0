from logging import getLogger

from indoorsdatapy.access.base import AccessBase
from indoorsprotocol.trajectories_pb2 import Trajectory

logger = getLogger(__name__)


class TrajectoryAccess(AccessBase):
    def __init__(self, f=None, fields=None):
        super(TrajectoryAccess, self).__init__(Trajectory, f, fields, False)
