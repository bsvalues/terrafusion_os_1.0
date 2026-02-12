from logging import getLogger

from indoorsdatapy.access.factory.df2pb import dfs2pb
from indoorsdatapy.access.factory.pb2df import pb2dfs
from indoorsdatapy.access.factory.pb2json2df import json2dfs
from indoorsdatapy.access.factory.utils import load_pb
from indoorsdatapy.access.factory.utils import save, update_pb

logger = getLogger(__name__)


class AccessBase(dict):
    def __init__(self, pb_cls, f=None, fields=None, json=False):
        super(AccessBase, self).__init__()
        self.pb_cls = pb_cls
        self.pb = None
        self._json = json
        if not f:
            logger.info('initialized empty access')
            return

        if isinstance(f, str):
            f = open(f, 'rb')
        self.pb = load_pb(pb_cls, f)
        self._fields = fields
        if fields:
            for field in fields:
                self[field]
        if json:
            self.update(json2dfs(self.pb, None))

    def __getitem__(self, item):
        """

        :param item:
        :return:
        """
        if item in self:
            return self.get(item)
        if self._json:
            self.update(json2dfs(self.pb, [item]))
        else:
            self.update(pb2dfs(self.pb, [item]))
        return self.get(item)

    def cln_pb(self):
        self.pb = None
        self.pb_cls = None

    def update_pb(self, dfs, out):
        if isinstance(out, str):
            out = open(out, 'rb')
        save(update_pb(dfs, self.pb), out)

    def dfs2pb(self, frames):
        return dfs2pb(frames, self.pb_cls())

    def access2file(self, frames, out):
        save(dfs2pb(frames, self.pb_cls()), out)

    @staticmethod
    def save_pb(pb, f_out):

        if isinstance(f_out, str):
            f_out = open(f_out, 'wb')

        save(pb, f_out)
