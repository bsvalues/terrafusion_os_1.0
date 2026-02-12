import os
import tempfile
import zipfile

from indoorsdatapy.access.building import BuildingAccess


class BuildingBundle(object):
    def __init__(self, bundle, tables=None):
        self._bundle = bundle
        self.access = None
        self.imgs = {}
        self.__init(tables)

    def __init(self, tables):
        bundle_dir = tempfile.mkdtemp('boundle')
        zip_ref = zipfile.ZipFile(self._bundle, 'r')
        zip_ref.extractall(bundle_dir)
        zip_ref.close()
        self.access = BuildingAccess(os.path.join(bundle_dir, 'building.pb'), tables)
        # map floorplans to dict
        for floorplan in os.listdir(os.path.join(bundle_dir, 'floorplans')):
            floor = int(floorplan.split('.')[0])
            self.imgs[floor] = os.path.join(
                os.path.join(bundle_dir, 'floorplans', floorplan))
