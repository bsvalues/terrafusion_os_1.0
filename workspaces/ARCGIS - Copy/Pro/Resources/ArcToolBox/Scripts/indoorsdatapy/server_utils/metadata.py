from indoorsdatapy.server_utils.cloud_entity import BUILDINGS, RECORDINGS, SLAMS


class MetadataFactory(object):
    def __init__(self, access, entity, meta=None):
        self.access = access
        self.entity = entity

        if isinstance(meta, dict):
            self.meta = meta
        else:
            self.meta = {}

    def create_metadata(self):
        if self.entity == SLAMS:
            self._make_slam_meta()
        elif self.entity == BUILDINGS:
            self._make_building_meta()
        elif self.entity == RECORDINGS:
            self._make_recording_meta()

    def get_metadata(self):
        return self.meta

    def _make_meta(self):
        if hasattr(self.access, 'pb'):
            if hasattr(self.access.pb,'metadata'):
                for md in self.access.pb.metadata:
                    self.meta[md.name] = md.value
            else:
                for md in self.access.pb.meta:
                    self.meta[md.name] = md.value


        else:
            for idx, md in self.access['meta'].iterrows():
                self.meta[md.name] = md.value

    def _make_building_meta(self):
        self._make_meta()
        self.meta['id'] = self.access.pb.id
        self.meta['name'] = self.access.pb.name
        self.meta['description'] = self.access.pb.description
        self.meta['rotation'] = self.access.pb.rotation
        self.meta['lat_origin'] = self.access.pb.lat_origin
        self.meta['lon_origin'] = self.access.pb.lon_origin

    def _make_recording_meta(self):
        self._make_meta()
        self.meta['id'] = self.access['id']
        self.meta['start'] = self.access['start']
        self.meta['end'] = self.access['start']
        self.meta['created_at'] = self.access['created_at']

        for key, val in self.access.info().items():
            if key.startswith('n_'):
                self.meta['statistics.' + key] = val

    def _make_slam_meta(self):
        self._make_meta()
        self.meta['building'] = self.access['building']
        self.meta['recordings'] = self.access['recordings']

    def _cln_empty(self):
        for key, val in self.meta.items():
            if val in [None, '', ' ']:
                del self.meta[key]
