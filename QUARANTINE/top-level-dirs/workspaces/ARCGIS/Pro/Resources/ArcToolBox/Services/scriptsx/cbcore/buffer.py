"""Module provides buffer related functionalities."""
# Relax the check for arcpy.env.workspace. noqa. pylint: disable=no-member
# Ignore the check for module import. noqa. pylint: disable=import-error
import os
import locale
from typing import Any, Union
from abc import ABC, abstractmethod

import arcpy
import arcpy.management
import arcpy.analysis
from arcpy.da import SearchCursor, InsertCursor  # type: ignore

from common import (FieldUtils, LogUtils, LogExecutionTime, PALayer,
                    CALFIELD_PY_METHOD, AOLUtils)

LOGGER = LogUtils.setup_logger(__name__)

__all__ = ["BufferUtils", "SingleBuffer", "ThiessenBuffer", "RingBuffer", "MultiBuffer"]


class BufferUtils(ABC):
    """Parent class of buffer utilities."""
    DISTANCE_FIELD_NAME = "BUFF_DIST"
    WORK_SPACE = arcpy.env.workspace  # type: ignore

    def __init__(self, **kwargs):
        arcpy.env.overwriteOutput = True
        self.input_layer = None
        self.output_layer = None
        self.side_type = ""
        self.end_type = ""
        self.dissolve_type = ""
        self.field = ""
        self.distance = None
        self.units = ""
        self.ring_type = "Disks"
        self.calc_field = True
        self.geodesic = 0

        for parameter_name in kwargs:
            setattr(self, parameter_name, kwargs[parameter_name])

        if self.input_layer is None or self.output_layer is None:
            LOGGER.error("Invalid input.")
            raise ValueError

        # Setup the workspace
        if os.path.dirname(self.output_layer) == "in_memory":  # type: ignore
            arcpy.env.workspace = "in_memory"  # type: ignore
        else:
            arcpy.env.workspace = AOLUtils.get_scratch_wkspc()  # type: ignore

    @abstractmethod
    def create(self):
        raise NotImplementedError

    def get_units_code(self) -> int:
        """Get the units code.

        Args:
            No arguments.
        Returns:
            An integer represents the code of units.
        Raises:
            No exceptions.

        """
        units_code_lookup = {"feet": 9002, "yards": 109001, "miles": 9035,
                             "nauticalmiles": 9030, "kilometers": 9036}
        return units_code_lookup.get(self.units.lower(), 9001)

    def get_distance_field_alias(self) -> str:
        """To get a field alias based on units.

        Args:
            No arguments.
        Returns:
            A string represents the alias name of the field
        Raises:
            No exceptions.

        """
        return "Buffer distance in {}".format(self.units)

    @classmethod
    def add_distance_field(cls, layer: Union[PALayer, str], distance: Any, units: str):
        data = layer if isinstance(layer, str) else layer.data
        field_alias = f"Buffer distance in {units}"
        LOGGER.debug("field_alias: {}".format(field_alias))
        if not FieldUtils.verify_field_exists(data, cls.DISTANCE_FIELD_NAME):
            arcpy.management.AddField(data, cls.DISTANCE_FIELD_NAME, "DOUBLE")
        arcpy.management.CalculateField(data, cls.DISTANCE_FIELD_NAME, distance,
                                        CALFIELD_PY_METHOD)
        arcpy.management.AlterField(data, cls.DISTANCE_FIELD_NAME, new_field_alias=field_alias)


class SingleBuffer(BufferUtils):
    """Class module to create single buffer."""
    def __init__(self, **kwargs):
        super(SingleBuffer, self).__init__(**kwargs)
        self.method = "GEODESIC" if self.geodesic else "PLANAR"

    def create(self):
        # Note: fields and distances should be mutually exclusive, if both are specificed, field name trumps distance
        if self.field:
            bufdistance = self.add_linear_units_field()
        elif self.units.lower() not in ["default", "", "#"]:
            bufdistance = f"{self.distance} {self.units}"
        else:
            bufdistance = self.distance
        LOGGER.debug(f"units: {self.units}")
        LOGGER.debug(f"bufdistance: {bufdistance}")

        if self.side_type == "FULL" and self.end_type == "ROUND":
            LOGGER.debug("Create buffers with PairwiseBuffer_analysis.")
            arcpy.analysis.PairwiseBuffer(self.input_layer, self.output_layer,
                                          bufdistance, self.dissolve_type,
                                          method=self.method)
        else:
            LOGGER.debug("Create buffers with Buffer_analysis.")
            arcpy.analysis.Buffer(self.input_layer, self.output_layer, bufdistance,
                                  self.side_type, self.end_type,
                                  self.dissolve_type, method=self.method)
        # check if it contains buffer distance with zero values
        if self.field:
            # message 636: skipping feature 5 because a negative or very small distance resulted in no geometry.
            msgs = LogUtils.get_gp_msgs([636], "warnings")
            if msgs:
                skip_feats = []
                for msg in msgs:
                    sp_msg = msg[2].split(" ")
                    try:
                        skip_feats.append(sp_msg[sp_msg.index("feature") + 1])
                    except (ValueError, IndexError):
                        LOGGER.debug(f"Unable to find the skipped feature from {msg[2]}")
                if skip_feats:
                    LOGGER.warning(100369, extra={"message_ID": 100369, "featureIDs": ",".join(skip_feats)})
                

        if self.field:
            if not self.dissolve_type or self.dissolve_type == "NONE":
                fields = f"{bufdistance};{self.DISTANCE_FIELD_NAME}"
                arcpy.management.DeleteField(self.output_layer, fields)
        elif self.calc_field:
            self.calc_distance_field()

    def calc_distance_field(self):
        """Check and add the distance back onto the intermediate feature class if missing."""
        if self.output_layer:
            self.add_distance_field(self.output_layer, self.distance, self.units)
        else:
            LOGGER.debug(f"output_layer can't be empty for the calculation.")
            raise RuntimeError

    def add_linear_units_field(self):
        """To add a linear units field.

        Args:
            No arguments.
        Returns:
            A string with the name of the field where linear units is assigned.
        Raises:
            No exceptions.

        """
        out_features = arcpy.CreateScratchName('features_', workspace=self.WORK_SPACE)
        with arcpy.EnvManager(qualifiedFieldNames=False):
            try:
                fset = arcpy.FeatureSet(self.input_layer)
                fset.save(out_features)
            except Exception as err:
                LOGGER.debug("Unable to save data to {out_features} due to {str(err)}.")
                arcpy.management.CopyFeatures(self.input_layer, out_features)

        field_name = 'LinearUnits'
        expression = f'"!{self.field}!" + " " + "{self.units}"'
        arcpy.management.AddField(out_features, field_name, "TEXT")
        arcpy.management.CalculateField(out_features, field_name, expression,
                                        CALFIELD_PY_METHOD)

        # Replace the input_layer with the out_features.
        self.input_layer = out_features
        return field_name


class ThiessenBuffer(BufferUtils):
    """Class module to create thiessen buffer."""
    def __init__(self, **kwargs):
        super(ThiessenBuffer, self).__init__(**kwargs)
        self.input_params = kwargs

    def create(self):
        tmp_buffer = arcpy.CreateScratchName("buffer", workspace=self.WORK_SPACE)
        self.input_params["output_layer"] = tmp_buffer
        SingleBuffer(**self.input_params).create()

        tmp_thiessen = arcpy.CreateScratchName("thiessen", workspace=self.WORK_SPACE)
        arcpy.analysis.CreateThiessenPolygons(self.input_layer, tmp_thiessen, self.dissolve_type)
        arcpy.analysis.Intersect([tmp_buffer, tmp_thiessen], self.output_layer)


class RingBuffer(BufferUtils):
    """Class module to create ring buffer."""
    def __init__(self, **kwargs):
        super(RingBuffer, self).__init__(**kwargs)
        self.units_code = self.get_units_code()
        description = AOLUtils.describe(self.input_layer)  # type: ignore
        self.spatial_ref = description.spatialReference
        self.oid_field_name = description.oidFieldName
        if not isinstance(self.distance, list):
            self.distance = [self.distance]

    def create(self):
        outpath = os.path.dirname(self.output_layer)  # type: ignore
        outname = os.path.basename(self.output_layer)  # type: ignore

        orig_id_fieldname = "ORIG_FID"
        shape_field_name = "shape@"
        arcpy.management.CreateFeatureclass(outpath, outname, "POLYGON", "", "DISABLED", "DISABLED", self.spatial_ref)

        arcpy.management.AddField(self.output_layer, orig_id_fieldname, "LONG")
        arcpy.management.AddField(self.output_layer, self.DISTANCE_FIELD_NAME, "DOUBLE",
                                  field_alias=self.get_distance_field_alias())

        infields = [shape_field_name, self.oid_field_name]
        incursor = SearchCursor(self.input_layer, infields)

        outfields = [shape_field_name, orig_id_fieldname, self.DISTANCE_FIELD_NAME]
        outcursor = InsertCursor(self.output_layer, outfields)

        for row in incursor:
            previous_buffer = None
            feature = row[0]
            fid = row[1]

            for dist in self.distance:
                buffer_distance = locale.atof(str(dist))  # type: ignore
                current_buffer = feature._arc_object.bufferex(buffer_distance,
                                                              self.units_code, self.geodesic)
                if previous_buffer is not None:
                    ring = current_buffer.difference(previous_buffer)
                    outcursor.insertRow([ring, fid, buffer_distance])
                else:
                    outcursor.insertRow([current_buffer, fid, buffer_distance])
                previous_buffer = current_buffer

        del incursor
        del outcursor

        if self.calc_field:
            with LogExecutionTime("JoinField"):
                arcpy.management.JoinField(self.output_layer, orig_id_fieldname,
                                           self.input_layer, self.oid_field_name)


class MultiBuffer(BufferUtils):
    """Class module to create multi buffers."""
    def __init__(self, **kwargs):
        super(MultiBuffer, self).__init__(**kwargs)
        desc = AOLUtils.describe(self.input_layer)  # type: ignore
        self.gcs_code = desc.spatialReference.GCSCode
        if not isinstance(self.distance, list):
            self.distance = [self.distance]
        self.input_params = kwargs
        self.input_params["side_type"] = ""
        self.input_params["end_type"] = ""
        self.input_params["field"] = ""

    def create(self):
        buffer_list = []
        for distance in self.distance:
            out_buf = arcpy.CreateScratchName("buffer_", workspace=self.WORK_SPACE)
            LOGGER.debug("out_buf: {}".format(out_buf))
            tmp_params = self.input_params
            tmp_params["distance"] = distance
            tmp_params["output_layer"] = out_buf
            SingleBuffer(**tmp_params).create()
            buffer_list.append(out_buf)

        if self.ring_type.lower() == "rings" and self.dissolve_type == "ALL":
            count = len(buffer_list)
            index = count - 1
            while index > 0:
                with LogExecutionTime("Erase"):
                    out_erase = arcpy.CreateScratchName("erase_", workspace=self.WORK_SPACE)
                    arcpy.Erase_analysis(buffer_list[index], buffer_list[index - 1], out_erase)
                    buffer_list[index] = out_erase
                    index -= 1
        buffer_list.sort(reverse=True)
        arcpy.management.CopyFeatures(buffer_list[0], self.output_layer)
        if len(buffer_list) > 1:
            arcpy.management.Append(buffer_list[1::], self.output_layer, "NO_TEST")
