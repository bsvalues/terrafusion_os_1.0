"""Module to chunk input_layer."""
# use modules from common package. noqa. pylint: disable=import-error
from typing import Tuple, List, Optional
import math
import json

import arcpy

from common import PAFeatureLayer, LogUtils, ToolExit


LOGGER = LogUtils.setup_logger(__name__)


class GeomSplitter:
    """Class module to chunk the input layer."""

    SIMPLIFY_VERTICE_LIMIT = 0.00001
    # the geometry send in the request can not be more than 100,000 points.
    GREATER_THAN_8MB = 100000
    OID_FIELD_NAME = "ENRICH_FID"
    MIN_SPLIT_PER_REQUEST = 30
    MAX_ROW_CNT_PER_REQUEST = 50
    MAX_ROW_DT_PER_REQUEST = 30
    MIN_SPLIT_PER_REQUEST_DT = 15
    MAX_VERTICES_ALLOWED = {"Polygon": 50000,
                            "Polyline": 20000,
                            "Point": MAX_ROW_CNT_PER_REQUEST,
                            "Multipoint": MAX_ROW_CNT_PER_REQUEST}

    def __init__(
        self,
        input_layer: PAFeatureLayer,
        concurr_tasks_count: int,
        buffer_type: Optional[str]
    ):
        """Initialize properties.

        Args:
            input_layer (PAFeatureLayer): layer to be splitted.
            concurr_tasks_count (int): number of concurrent jobs support in a
            single iteration.
            buffer_type (str): type of buffer to use for point/polyline geometry.
        """
        self.input_layer = input_layer
        (self.max_row, self.max_vertices) = self.get_split_criteria(self.input_layer,
                                                                    concurr_tasks_count,
                                                                    buffer_type)
        self.is_count_vertices = "point" not in self.input_layer.shapeType.lower()

        self.null_geoms = []  # null geometries
        self.simplified_geoms = []  # simplified geometries
        self.complex_geoms = []  # geometries too complex to simplify

        self.cursor = None
        # carry-over from last request
        self.leftover_features = []
        self.leftover_verticecnt = 0

    @classmethod
    def generalize_geom(cls, geom: arcpy.Geometry) -> Tuple[arcpy.Geometry, bool]:
        """Generalize the geometry.

        Args:
            geom (arcpy.Geometry): geometry to simplify.

        Returns:
            Tuple[arcpy.Geometry, bool]: a tuple with two items where the first
            item is the geometry after simplication and the second item is a flag
            indicates if the geometry is complicated enough so the simplify is
            needed.
        """
        if geom.pointCount > cls.GREATER_THAN_8MB:
            max_offset = geom.getLength() * cls.SIMPLIFY_VERTICE_LIMIT   # type: ignore
            geom = geom._arc_object.generalize(max_offset)
            return (geom, True)
        return (geom, False)

    @classmethod
    def get_split_criteria(cls, input_layer: PAFeatureLayer,
                           max_concurr_tasks: int,
                           buffer_type: Optional[str]) -> Tuple:
        """Get the criteria of splitting the input_layer.

        Returns:
            Tuple: a two items tuple where the first item is the maximum number
            of features allowed in one request and second item is the maximum
            number of vertices allowed in one request.
        """
        max_row_cnt = math.ceil(input_layer.count / max_concurr_tasks)
        if ((not buffer_type) or (buffer_type.lower() == "straightline")):
            max_vertices_in_split = cls.MAX_VERTICES_ALLOWED[input_layer.shapeType]
            if max_row_cnt < cls.MIN_SPLIT_PER_REQUEST:
                max_row_cnt = cls.MIN_SPLIT_PER_REQUEST
            elif max_row_cnt > cls.MAX_ROW_CNT_PER_REQUEST:
                max_row_cnt = cls.MAX_ROW_CNT_PER_REQUEST
        else:
            # Can only be points input for drive time
            max_vertices_in_split = cls.MAX_ROW_DT_PER_REQUEST
            if max_row_cnt < cls.MIN_SPLIT_PER_REQUEST_DT:
                max_row_cnt = cls.MIN_SPLIT_PER_REQUEST_DT
            elif max_row_cnt > cls.MAX_ROW_DT_PER_REQUEST:
                max_row_cnt = cls.MAX_ROW_DT_PER_REQUEST
        LOGGER.debug(f"max_row_cnt: {max_row_cnt}")
        LOGGER.debug(f"max_vertices_in_split: {max_vertices_in_split}")
        return (max_row_cnt, max_vertices_in_split)

    def count_split(self) -> int:
        """Predict the total number of chunks that the input_layer
        needs to be splitted.

        Returns:
            int: the total number of chunks that the input_layer are going to
            be splitted.
        """
        tot_request = 0
        with arcpy.da.SearchCursor(self.input_layer.layer, ("SHAPE@")) as curr:  # type: ignore
            vertices_in_req = 0
            rows_in_req = 0
            for row in curr:
                geometry = row[0]
                curr_vertices = geometry.pointCount
                if (vertices_in_req + curr_vertices) > self.max_vertices:
                    tot_request += 1
                    vertices_in_req = 0
                    rows_in_req = 0
                elif rows_in_req >= self.max_row:
                    tot_request += 1
                    rows_in_req = 0
                    vertices_in_req = 0
                else:
                    vertices_in_req += curr_vertices
                    rows_in_req += 1
            if rows_in_req != 0:
                tot_request += 1
        return tot_request

    def split(self):
        """Prepare for the split."""
        self.cursor = arcpy.da.SearchCursor(self.input_layer.layer,  # type: ignore
                                            ("OID@", "SHAPE@"))

    def get_features(self) -> List:
        """get features chunk by chunk for the Geoenrich request.

        Returns:
            List: a list of features that are going to send as a chunk.
        """
        vertices_cnt = 0
        row_cnt = 0
        features = []
        if self.leftover_features:
            row_cnt = 1
            features = self.leftover_features
            self.leftover_features = []
            # Check if the verticecount is already greater than max vertices allowed
            if self.leftover_verticecnt >= self.max_vertices:
                self.leftover_verticecnt = 0
                return features
            else:
                vertices_cnt = self.leftover_verticecnt
                self.leftover_verticecnt = 0

        while True:
            try:
                (oid, raw_geom) = next(self.cursor)  # type: ignore
                if self.is_count_vertices:
                    (raw_geom, simplified) = self.generalize_geom(raw_geom)
                    if simplified and raw_geom.pointCount > self.GREATER_THAN_8MB:
                        self.complex_geoms.append(oid)
                    elif simplified:
                        self.simplified_geoms.append(oid)
                    curr_vertice_count = raw_geom.pointCount
                else:
                    curr_vertice_count = 1

                try:
                    geom = raw_geom._arc_object.getjson(False, False, False, False)
                except:
                    # _arc_object.getjson doesn't work for generalized geometries !!!
                    # .getjson method works for generalized polygon geom
                    # but not for points and lines
                    # need to follow up with Dave and check the py wrapper.
                    geom = raw_geom.getjson(False, False, False, False)  # type: ignore
                enrich_json = {"geometry": json.loads(geom),
                               "attributes": {self.OID_FIELD_NAME: oid}}
                vertices_cnt += curr_vertice_count
                row_cnt += 1
                if vertices_cnt > self.max_vertices or row_cnt > self.max_row:
                    self.leftover_features = [enrich_json]
                    self.leftover_verticecnt = curr_vertice_count
                    return features
                else:
                    features.append(enrich_json)
            except StopIteration:
                LOGGER.debug("Reached end of cursor.")
                self.leftover_features = None
                self.leftover_verticecnt = 0
                return features
            except Exception as err:
                LOGGER.debug(f"Unexpected err in getting features due to {str(err)}")
                self.null_geoms.append(oid)  # type: ignore
                continue
