# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
HLZSuitability.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2019-08-09 - mfunk - original writeup
* 2019-09-06 - mfunk - update lib references and module name for Pro integration
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-09-11 - mfunk - fix output history - issue 2033
* 2021-01-14 - mfunk - fixes for issue 2478
* 2021-05-24 - mfunk - fixes for issue 1535
* 2021-08-16 - mfunk - fixes for issue 2781, update coding standards, error handling
* 2022-08-29 - mfunk - change ddd.Plus/ddd.Reclassify into sa.Plus/sa.Reclassify
* 2022-11-01 - mfunk - Buffer to PairwiseBuffer, Clip to PairwiseClip
------------------------------------------------------------------------------
'''

import os
import arcpy
from typing import List, Any, Optional
from intel.utilities import DEBUG, \
                            SR_GCS_WGS_1984, \
                            create_scratch_geodatabase, \
                            create_temp_table_name, \
                            Logger
from intel.utilities.ErrorHandlers import general_error_logger


class HLZBase (object):
    """HLZBase base class for HLZ tools

    Carry common properties and methods for all HLZ tools

    """

    def __init__(self):
        self.logger = Logger()
        self.logger.create_logger(self.__class__.__name__)
        if DEBUG:
            self.logger.debug(f"Loggers: {self.logger.loggers}")
        return

    def _cleanup(self) -> bool:
        """_cleanup object cleanup method

        Cleanup for delete.
        Remove temporary features.

        :param data_to_delete: List of datasets to delete
        :type data_to_delete: list
        """
        # Remove all temp datasets
        # "Removing intermedate datasets... "
        arcpy.AddMessage(arcpy.GetIDMessage(190012))
        for i in self._delete_intermediate:
            if arcpy.Exists(i):
                arcpy.management.Delete(i)
                if DEBUG:
                    self.logger.debug(f"...{i}")

        # Remove temp folder and geodatabase if it was created
        if self._delete_temp_scratch_flag is True:
            if self._temp_scratch is not None:
                if DEBUG:
                    self.logger.debug(f"Removing: {self._temp_scratch}")
                arcpy.management.Delete(self._temp_scratch)
                arcpy.management.Delete(os.path.dirname(self._temp_scratch))
                self._temp_scratch = None
        return True

    @general_error_logger
    def _clip(self,
              in_features: str,
              clip_features: str,
              out_features: str) -> str:
        """_clip clip data to specific area

        Clip in_features to the area of clip_features

        :param in_features: Features to clip
        :type in_features: GPFeatureLayer
        :param clip_features: Clipping features
        :type clip_features: GPFeatureLayer
        :param out_features: Output features to create
        :type out_features: DEFeatureClass

        License: ArcGIS Pro Basic

        """
        arcpy.AddMessage(arcpy.GetIDMessage(190092))
        if arcpy.Exists(out_features):
            arcpy.management.Delete(out_features)
        arcpy.analysis.PairwiseClip(in_features,
                                    clip_features,
                                    out_features)

        return out_features

    @general_error_logger
    def _add_approachD_field(self,
                             in_table: str,
                             source_field: str,
                             approach_field_name: str) -> str:
        """_add_approachD_field Add approach field

        Add approachD field to table and calculate value.
        Based on 10:1 ratio defined in Pathfinder manual

        :param in_table: target table to add field
        :type in_table: GPTableView

        License: ArcGIS Pro Basic with these options.

        """
        arcpy.AddMessage(arcpy.GetIDMessage(190095))

        arcpy.management.AddField(in_table,
                                  field_name=approach_field_name,
                                  field_type="DOUBLE",
                                  field_alias="Obstacle Approach/Departure Distance (m)")
        ad_expression = f"!{source_field}! * 10.0"

        arcpy.management.CalculateField(in_table,
                                        field=approach_field_name,
                                        expression=ad_expression)
        return in_table

    @general_error_logger
    def _feature_to_3d_by_attribute(self,
                                    in_features: str,
                                    out_features: str,
                                    height_field_name: str) -> str:
        """_feature_to_3d_by_attribute convert 2D feature to 3D using field

        Convert a 2D feature to 3D using existing field name

        :param in_features: source 2D features to convert
        :type in_features: GPFeatureLayer
        :param out_features: target features to create
        :type out_features: DEFeatureClass

        License: 3D Analyst

        """
        arcpy.AddMessage(arcpy.GetIDMessage(190094))
        arcpy.ddd.FeatureTo3DByAttribute(in_features,
                                        out_features,
                                        height_field=height_field_name)  # self._amsl_field_name)
        return out_features

    @general_error_logger
    def _buffer(self,
                in_features: str,
                out_features: str,
                distance_field: str) -> str:
        """_buffer Create area features at a constant distance from source features

        Create output areas based on input features at a field-based distance.
        Each feature will be buffered based on the field value.

        :param in_features: source features to buffer
        :type in_features: GPFeatureLayer
        :param out_features: area features to create
        :type out_features: DEFeatureClass
        :param distance_field: field to buffer each feature
        :type distance_field: GPField

        License: ArcGIS Pro Basic with these options.

        """
        arcpy.AddMessage(arcpy.GetIDMessage(190096))
        if arcpy.Exists(out_features):
            arcpy.management.Delete(out_features)
        arcpy.analysis.PairwiseBuffer(in_features,
                                      out_features,
                                      distance_field,
                                      method="GEODESIC")
        return out_features


class DOFToFeatures (HLZBase):
    """DOFToFeatures

    Convert FAA's Digital Obstacle Files into
    obstacle features and buffers for HLZ suitabilty.

    Requires 3D Analyst license
    """

    def __init__(self,
                 input_csv: str,
                 output_obstacles: str,
                 output_buffers: str,
                 input_AOI: Optional[str] = None,
                 ):
        """__init__ [summary]

        [extended_summary]

        :param input_csv: [description]
        :type input_csv: [type]
        :param output_obstacles: [description]
        :type output_obstacles: [type]
        :param input_AOI: [description], defaults to None
        :type input_AOI: [type], optional
        :return: [description]
        :rtype: [type]
        """

        super().__init__()

        self._input_csv = input_csv
        self._input_AOI = input_AOI
        # DOF input files are always WGS 1984
        self._output_coordinate_system = SR_GCS_WGS_1984
        self._output_obstacles = output_obstacles
        self._output_buffers = output_buffers
        self._amsl_meters_field_name = r"AMSLm"
        self._amsl_field_name = r"AMSL"
        self._agl_meters_field_name = r"AGLm"
        self._agl_field_name = r"AGL"
        self._approach_field_name = r"appoachD"

        self._delete_intermediate = []
        self._temp_scratch = None
        self._delete_temp_scratch_flag = True

    @property
    def input_csv(self) -> str:
        return self._input_csv

    @input_csv.setter
    def input_csv(self, value: str):
        self._input_csv = value

    @property
    def input_AOI(self) -> Optional[str]:
        return self._input_AOI

    @input_AOI.setter
    def input_AOI(self, value: Optional[str]):
        self._input_AOI = value

    @property
    def output_coordinate_system(self) -> arcpy.SpatialReference:
        return self._output_coordinate_system

    @output_coordinate_system.setter
    def output_coordinate_system(self, value: arcpy.SpatialReference):
        self._output_coordinate_system = value

    @property
    def output_obstacles(self) -> str:
        return self._output_obstacles

    @output_obstacles.setter
    def output_obstacles(self, value: str):
        self._output_obstacles = value

    @property
    def output_buffers(self) -> str:
        return self._output_buffers

    @output_buffers.setter
    def output_buffers(self, value: str):
        self._output_buffers = value

    @general_error_logger
    def __del__(self):
        self._cleanup()
        return

    @general_error_logger
    def _prerequisite_field_check(self,
                                  in_table: str) -> None:
        """
        _prerequisite_field_check Check AGL and AMSL fields exist in input table

        Check that input table contains required AGL and AMSL fields.

        :param in_table: Input table to check for fields
        :type in_table: Table
        :return: None
        :rtype: None
        """
        field_names: List[str] = [field.name.lower() for field in arcpy.ListFields(in_table)]
        # MUST CONTAIN AGL and AMSL fields
        if not self._agl_field_name.lower() in field_names:
            arcpy.AddError(arcpy.GetIDMessage(190097))
        if not self._amsl_field_name.lower() in field_names:
            arcpy.AddError(arcpy.GetIDMessage(190098))
        return

    @general_error_logger
    def _add_dof_fields(self,
                        in_table: str) -> str:
        """_add_dof_fields Add DOF required field conversions to input table.

        Further calculations are based on meters, but input are feet. Add fields
        and convert AMSL and AGL values to meters.

        :param in_table: Input table to add converted fields
        :type in_table: Table
        """
        arcpy.AddMessage(arcpy.GetIDMessage(190093))
        field_names: List[str] = [field.name.lower() for field in arcpy.ListFields(in_table)]

        if not self._amsl_meters_field_name.lower() in field_names:
            arcpy.management.AddField(in_table,
                                      field_name=self._amsl_meters_field_name,
                                      field_type="DOUBLE",
                                      field_alias="AMSL (m)")
        amsl_expression: str = f"!{self._amsl_field_name}! * 0.3048"
        arcpy.management.CalculateField(in_table,
                                        field=self._amsl_meters_field_name,
                                        expression=amsl_expression)

        if not self._agl_meters_field_name.lower() in field_names:
            arcpy.management.AddField(in_table,
                                      field_name=self._agl_meters_field_name,
                                      field_type="DOUBLE",
                                      field_alias="AGL (m)")
        agl_expression: str = f"!{self._agl_field_name}! * 0.3048"
        arcpy.management.CalculateField(in_table,
                                        field=self._agl_meters_field_name,
                                        expression=agl_expression)
        return in_table

    @general_error_logger
    def _xy_table_to_point(self,
                           in_csv: str,
                           out_point: str) -> str:
        """_xy_table_to_point [summary]

        [extended_summary]

        :param in_csv: [description]
        :type in_csv: [type]
        :param out_point: [description]
        :type out_point: [type]

        License: ArcGIS Pro Basic

        """
        row_count: int = int(arcpy.GetCount_management(in_csv)[0])
        arcpy.AddMessage(arcpy.GetIDMessage(190091).format(row_count))
        if arcpy.Exists(out_point):
            arcpy.management.Delete(out_point)
        arcpy.XYTableToPoint_management(in_csv,
                                        out_point,
                                        x_field="LONDEC",
                                        y_field="LATDEC",
                                        coordinate_system=SR_GCS_WGS_1984,
                                        )
        return out_point

    @general_error_logger
    def _execute(self) -> List[str]:
        """_execute internal execution code for DOFToFeatures

        internal execution code for DOFToFeatures

        :return: Returns obstacle feaures and obstacle buffers
        :rtype: list
        """
        arcpy.env.outputCoordinateSystem = self.output_coordinate_system
        if DEBUG:
            self.logger.debug("STARTING DOF TO OBSTACLE FEATURES")

        if arcpy.env.scratchGDB is None:
            self._temp_scratch = create_scratch_geodatabase()
            arcpy.env.scratchGDB = self._temp_scratch
            self._delete_temp_scratch_flag = True

        # Convert CSV to point features
        temp_point: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        temp_point: str = self._xy_table_to_point(self._input_csv,
                                                  temp_point)
        self._delete_intermediate.append(temp_point)
        self._prerequisite_field_check(temp_point)

        # Reduce area/number of points
        if self.input_AOI:
            point_clip: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
            if DEBUG:
                self.logger.debug(f"_clip: temp_point: {temp_point}")
            point_clip: str = self._clip(temp_point,
                                         self._input_AOI,
                                         point_clip)
            self._delete_intermediate.append(point_clip)
        else:
            point_clip = temp_point

        # Add & Calculate Fields: AMSLm, AGLm
        point_clip: str = self._add_dof_fields(point_clip)

        # Feature To 3D By Attribute
        point_3d: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        point_3d: str = self._feature_to_3d_by_attribute(point_clip,
                                                         self._output_obstacles,
                                                         self._amsl_meters_field_name)

        # Add & Calculate Fields: approachD
        point_3d: str = self._add_approachD_field(self._output_obstacles,
                                                  self._agl_meters_field_name,
                                                  self._approach_field_name)

        # Buffer obstacles
        out_buffers: str = self._buffer(self._output_obstacles,
                                        self._output_buffers,
                                        self._approach_field_name)

        arcpy.DeleteField_management(in_table=self._output_buffers,
                                     drop_field="BUFF_DIST")

        if DEBUG:
            self.logger.debug("Done.")

        return [self._output_obstacles, self._output_buffers]

    @general_error_logger
    def calculate(self) -> Any:
        """calculate generates DOF obstacles and obstacle buffers
        from input DOF features.

        generates DOF obstacles and obstacle buffers
        from input DOF features.

        :return: Returns obstacle feaures and obstacle buffers
        :rtype: list
        """
        return self._execute()


class ObstacleFeatures(HLZBase):
    """GenerateObstacleFeatures

    Convert feature class with height field into
    obstacle features and buffers for HLZ suitability.

    Requires 3D Analyst license
    """

    def __init__(self,
                 input_features: str,
                 height_field: str,
                 output_obstacles: str,
                 output_buffers: str,
                 input_AOI: str = None,
                 ):

        super().__init__()

        self._input_features = input_features
        self._height_field = height_field
        self._output_obstacles = output_obstacles
        self._output_buffers = output_buffers
        self._input_AOI = input_AOI
        self._output_coordinate_system = arcpy.Describe(input_features).spatialReference
        self._text_field_surrogate = None
        self._approach_field_name = r"appoachD"

        self._delete_intermediate = []
        self._temp_scratch = None
        self._delete_temp_scratch_flag = True

    @property
    def input_features(self) -> str:
        return self._input_features

    @input_features.setter
    def input_features(self, value: str):
        self._input_features = value

    @property
    def height_field(self) -> str:
        return self._height_field

    @height_field.setter
    def height_field(self, value: str):
        self._height_field = value

    @property
    def output_coordinate_system(self) -> arcpy.SpatialReference:
        return self._output_coordinate_system

    @output_coordinate_system.setter
    def output_coordinate_system(self, value: arcpy.SpatialReference):
        self._output_coordinate_system = value

    @property
    def output_obstacles(self) -> str:
        return self._output_obstacles

    @output_obstacles.setter
    def output_obstacles(self, value: str):
        self._output_obstacles = value

    @property
    def output_buffers(self) -> str:
        return self._output_buffers

    @output_buffers.setter
    def output_buffers(self, value: str):
        self._output_buffers = value

    @property
    def input_AOI(self) -> Optional[str]:
        return self._input_AOI

    @input_AOI.setter
    def input_AOI(self, value: Optional[str]):
        self._input_AOI = value

    @general_error_logger
    def __del__(self):
        self._cleanup()

    @general_error_logger
    def _copy_text_height_field(self,
                                in_table: str) -> str:
        """_copy_text_height_field fix text fields as numeric

        3D elevation cannot be calculated from a string field. Convert
        height string field to DOUBLE.

        :param in_table: Source table
        :type in_table: GPTableView
        """
        height_field_obj: arcpy.Field = [field for field in arcpy.ListFields(in_table) if field.name == self.height_field][0]
        height_field_name: str = height_field_obj.name
        height_field_alias: str = height_field_obj.aliasName
        height_field_type: str = height_field_obj.type
        if height_field_type == "String":
            arcpy.AddWarning(arcpy.GetIDMessage(190099).format(height_field_name))
            self._text_field_surrogate = "del_temp0"
            if DEBUG:
                self.logger.debug("Adding surrogate field...")
            arcpy.AddField_management(in_table,
                                      self._text_field_surrogate,
                                      "DOUBLE")
            swap_expression = f"float(!{height_field_name}!)"
            if DEBUG:
                self.logger.debug("Calculating surrogate field...")
            arcpy.CalculateField_management(in_table,
                                            self._text_field_surrogate,
                                            swap_expression,
                                            "PYTHON_9.3")
            if DEBUG:
                self.logger.debug("Deleteing original field...")
            arcpy.DeleteField_management(in_table,
                                         height_field_name)
            if DEBUG:
                self.logger.debug(f"Adding new field {height_field_name} ...")
            arcpy.AddField_management(in_table,
                                      height_field_name,
                                      "DOUBLE",
                                      field_alias=height_field_alias)
            if DEBUG:
                self.logger.debug("Calculating new field...")
            fix_expression = f"!{self._text_field_surrogate}!"
            arcpy.CalculateField_management(in_table,
                                            height_field_name,
                                            fix_expression,
                                            "PYTHON_9.3")
            if DEBUG:
                self.logger.debug("Deleting surrogate field...")
            arcpy.DeleteField_management(in_table,
                                         self._text_field_surrogate)
            if DEBUG:
                self.logger.debug("Field swap complete.")
        else:
            if DEBUG:
                self.logger.debug("Using numeric field for height.")
        return in_table

    @general_error_logger
    def _execute(self) -> List[str]:
        """_execute internal execution code for FeatureToObstacleFeatures

        internal execution code for FeatureToObstacleFeatures.

        :return: Returns obstacle feaures and obstacle buffers
        :rtype: list
        """
        arcpy.env.outputCoordinateSystem = self.output_coordinate_system

        if arcpy.env.scratchGDB is None:
            self._temp_scratch = create_scratch_geodatabase()
            arcpy.env.scratchGDB = self._temp_scratch
            self._delete_temp_scratch_flag = True

        # Reduce area/number of points
        point_clip: str = ''
        if self.input_AOI:
            point_clip = self._clip(self.input_features,
                                    self.input_AOI,
                                    self.output_obstacles)
        else:
            point_clip = arcpy.management.CopyFeatures(self.input_features,
                                                       self.output_obstacles)

        point_clip = self._copy_text_height_field(self.output_obstacles)

        # Feature To 3D By Attribute - input height field is height above ground and
        # not the feature's Z. Closing this out for now.
        #
        # point_3d = os.path.join(scratchGDB, "point_3d")
        # point_3d = self._feature_to_3d_by_attribute(point_clip,
        #                                             self.output_obstacles,
        #                                             self.height_field)

        # Add & Calculate Fields: approachD
        point_3d = self._add_approachD_field(self.output_obstacles,
                                                self.height_field,
                                                self._approach_field_name)

        # Buffer obstacles
        out_buffers = self._buffer(self.output_obstacles,
                                   self.output_buffers,
                                   self._approach_field_name)

        arcpy.management.DeleteField(in_table=self.output_buffers,
                                     drop_field="BUFF_DIST")

        if DEBUG:
            self.logger.debug("Done.")
        return [self.output_obstacles, self.output_buffers]

    @general_error_logger
    def calculate(self) -> Any:
        """calculate generates obstacles and obstacle buffers
        from input features.

        generates obstacles and obstacle buffers
        from input features.

        :return: Returns obstacle feaures and obstacle buffers
        :rtype: list
        """
        return self._execute()


class HLZSuitability(HLZBase):
    """GenerateHLZSuitability

    Geoprocessing business code for Generate HLZ Suitability.

    Requires Spatial Analyst
    """

    def __init__(self,
                 in_slope: str,
                 in_land_cover: str,
                 in_obstacles: str,
                 out_suitability: str):
        """__init__ Generate HLZ Suitability constructor

        Initialize constructor

        :param in_slope: Input Slope raster
        :type in_slope: GPRasterLayer
        :param in_land_cover: Input Land Cover raster
        :type in_land_cover: GPRasterLayer
        :param in_obstacles: Input Obstacle features
        :type in_obstacles: GPFeatureLayer
        :param out_suitability: Output raster layer path
        :type out_suitability: string
        :return: Resulting raster layer
        :rtype: DERasterDataset
        """
        super().__init__()

        self._in_slope = in_slope
        self._in_land_cover = in_land_cover
        self._in_obstacles = in_obstacles
        self._out_suitability = out_suitability

        self._delete_intermediate = []
        self._temp_scratch = None
        self._delete_temp_scratch_flag = True

    @property
    def in_slope(self) -> str:
        return self._in_slope

    @in_slope.setter
    def in_slope(self, value: str):
        self._in_slope = value

    @property
    def in_land_cover(self) -> str:
        return self._in_land_cover

    @in_land_cover.setter
    def in_land_cover(self, value: str):
        self._in_land_cover = value

    @property
    def in_obstacles(self) -> str:
        return self._in_obstacles

    @in_obstacles.setter
    def in_obstacles(self, value: str):
        self._in_obstacles = value

    @property
    def out_suitability(self) -> str:
        return self._out_suitability

    @out_suitability.setter
    def out_suitability(self, value: str):
        self._out_suitability = value

    @general_error_logger
    def __del__(self):
        """__del__ HLZ class cleanup

        Removes temporary datsets.
        """
        self._cleanup()

    @general_error_logger
    def _copy_raster(self,
                     in_ras: str,
                     out_ras: str) -> str:
        """_copy_raster Copy a raster dataset

        Copies all cells from one raster to another.

        Wrapper for CopyRaster_management tool.

        :param in_ras: Source raster to copy
        :type in_ras: GPRasterLayer
        :param out_ras: Target raster to create
        :type out_ras: DERasterDataset
        """
        arcpy.AddMessage(arcpy.GetIDMessage(190100).format(os.path.basename(in_ras)))
        if arcpy.Exists(out_ras):
            arcpy.management.Delete(out_ras)
        arcpy.management.CopyRaster(in_raster=in_ras,
                                    out_rasterdataset=out_ras,
                                    # pixel_type="8_BIT_UNSIGNED",
                                    )
        return out_ras

    @general_error_logger
    def _plus(self,
              in_first_ras: str,
              in_second_ras: str,
              out_ras: str) -> str:
        """_plus Combines values of two input rasters

        Summation of input values on a cell-by-cell basis

        Wrapper for Plus function
        Requires 3D Analyst, Spatial Analyst, or Image Analyst

        :param in_first_ras: First source raster
        :type in_first_ras: GPRasterLayer
        :param in_second_ras: Second source raster
        :type in_second_ras: GPRasterLayer
        :param out_ras: Resulting summation raster
        :type out_ras: DERasterDataset
        """
        arcpy.AddMessage(arcpy.GetIDMessage(190101))
        if arcpy.Exists(out_ras):
            arcpy.management.Delete(out_ras)
        outPlus = arcpy.sa.Plus(in_first_ras,
                                in_second_ras)
        outPlus.save(out_ras)
        return out_ras

    @general_error_logger
    def _reclassify(self,
                    in_ras: str,
                    out_ras: str) -> str:
        """_reclassify Change input landcover and slope values

        Change input slope and land cover values.
        Values from 0 to 2 changed to 1.
        Values from 3 to 100 changed to 2.
        All other values become NODATA.

        Wrapper for Reclassify.
        Requires 3D Analyst or Spatial Analyst

        :param in_ras: Source raster to reclassify
        :type in_ras: GPRasterLayer
        :param out_ras: Reclassified raster dataset
        :type out_ras: DERasterDataset
        """
        arcpy.AddMessage(arcpy.GetIDMessage(190102))
        if arcpy.Exists(out_ras):
            arcpy.management.Delete(out_ras)
        remap_values: str = r"0 2 1;3 100 2"
        remap_field: str = r"VALUE"
        missing_value: str = r"NODATA"
        outReclass = arcpy.sa.Reclassify(in_ras,
                            remap_field,
                            remap_values,
                            missing_values=missing_value)
        outReclass.save(out_ras)
        return out_ras

    @general_error_logger
    def _poly_to_raster(self,
                        in_features: str,
                        out_ras: str,
                        template_ras: str) -> str:
        """_poly_to_raster Rasterizes polygon features.

        Converts polygons to raster cells using ObjectID values.

        Wrapper for PolygonToRaster_conversion tool.
        Requires 3D Analyst, Spatial Analyst or an Advanced license.

        :param in_features: Source feature to rasterize
        :type in_features: GPFeatureLayer
        :param out_ras: Output raster dataset
        :type out_ras: DERasterDataset
        :param template_ras: out_ras aligns cell orientation and size
        :type template_ras: GPRasterLayer
        """
        # Requires 3D, Spatial, or Advanced
        arcpy.AddMessage(arcpy.GetIDMessage(190103))
        if arcpy.Exists(out_ras):
            arcpy.management.Delete(out_ras)
        val_field: str = arcpy.Describe(in_features).OIDFieldName
        cell_assign: str = r""
        priority: str = r"NONE"
        arcpy.conversion.PolygonToRaster(in_features=in_features,
                                         value_field=val_field,
                                         out_rasterdataset=out_ras,
                                         cell_assignment=cell_assign,
                                         priority_field=priority,
                                         cellsize=template_ras)
        return out_ras

    @general_error_logger
    def _con(self,
             in_con_ras: str,
             out_ras: str) -> str:
        """_con Converts all obstacle buffers to value 3

        Obstacle buffer areas changed to value 3, all other cells
        are NODATA.

        Wrapper for Con (Conditional)
        Requires Spatial Analyst (or Image Analyst)

        :param in_con_ras: Input buffer raster
        :type in_con_ras: GPRasterLayer
        :param out_ras: Output modified buffers
        :type out_ras: DERasterDataset
        """
        arcpy.AddMessage(arcpy.GetIDMessage(190104))
        if arcpy.Exists(out_ras):
            arcpy.management.Delete(out_ras)
        true_value: int = 3
        expression: str = r"VALUE > 0"
        outCon: Any = arcpy.sa.Con(in_conditional_raster=in_con_ras,
                                   in_true_raster_or_constant=true_value,
                                   where_clause=expression)
        outCon.save(out_ras)
        return out_ras

    @general_error_logger
    def _cell_stats_max(self,
                        in_ras_list: str,
                        out_ras: str) -> str:
        """_cell_stats_max Determines maximum input value

        On a cell-by-cell basis determines the maximum cell value
        of all input rasters (list).

        Wrapper to CellStatisics with "MAXIMUM" option.
        Requires Spatial Analyst or Image Analyst

        :param in_ras_list: List of input rasters
        :type in_ras_list: list (GPRasterLayer)
        :param out_ras: Output raster dataset
        :type out_ras: DERasterDataset
        """
        arcpy.AddMessage(arcpy.GetIDMessage(190105))
        if arcpy.Exists(out_ras):
            arcpy.management.Delete(out_ras)
        maximum: str = r"MAXIMUM"
        ignore: str = r"DATA"
        out_cell_stats: Any = arcpy.sa.CellStatistics(in_ras_list,
                                                      statistics_type=maximum,
                                                      ignore_nodata=ignore)
        if DEBUG:
            self.logger.debug(f"CellStats out: {out_cell_stats}")
        out_cell_stats.save(out_ras)
        return out_ras

    @general_error_logger
    def _execute(self) -> str:
        """_execute Execution code for HLZ Suitability

        Workflow for combining inputs for HLZ Suitability

        :return: Output suitability raster
        :rtype: DERasterDataset
        """
        arcpy.env.extent = "MAXOF"

        # TODO: output coordinate system?
        # arcpy.env.outputCoordinateSystem = self.output_coordinate_system

        if arcpy.env.scratchGDB is None:
            self._temp_scratch = create_scratch_geodatabase()
            arcpy.env.scratchGDB = self._temp_scratch
            self._delete_temp_scratch_flag = True

        # Copy Land Cover
        temp_land_cover: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        temp_land_cover = self._copy_raster(self._in_land_cover,
                                            temp_land_cover)
        self._delete_intermediate.append(temp_land_cover)

        # Copy Slope
        temp_slope: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        temp_slope = self._copy_raster(self._in_slope,
                                       temp_slope)
        self._delete_intermediate.append(temp_slope)

        # SA Plus (slope and land cover)
        plus_slope_land: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        plus_slope_land = self._plus(temp_slope,
                                     temp_land_cover,
                                     plus_slope_land)
        self._delete_intermediate.append(plus_slope_land)

        # Reclassify
        reclass_slope_land: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        reclass_slope_land = self._reclassify(plus_slope_land,
                                              reclass_slope_land)
        self._delete_intermediate.append(reclass_slope_land)

        # Issue 2781 - if obstacles are emtpy, then CON will fail and tool will stop execution
        # Check if there are features, then run. If no then skip and just copy the combined
        # reclass.
        obx_count: int = int(arcpy.management.GetCount(self._in_obstacles)[0])
        if obx_count > 0:
            # Rasterize obstacle buffers
            raster_obx_buffers: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
            raster_obx_buffers = self._poly_to_raster(self._in_obstacles,
                                                      raster_obx_buffers,
                                                      reclass_slope_land)
            self._delete_intermediate.append(raster_obx_buffers)

            # CON obstacle raster
            ras_con: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
            ras_con = self._con(raster_obx_buffers,
                                ras_con)
            self._delete_intermediate.append(ras_con)

            # Cell Stats Max ConOstacle and ReclassSlopeLandCov
            self.out_suitability = self._cell_stats_max([reclass_slope_land, ras_con],
                                                        self._out_suitability)
        else:
            # Warning: Obstacle count is zero for the analysis area.
            arcpy.AddWarning(arcpy.GetIDMessage(190108))
            self.out_suitability = self._copy_raster(reclass_slope_land,
                                                     self._out_suitability)

        # Find  current project if there is one
        project: Optional[arcpy.mp.ArcGISProject]
        activeMap: arcpy.Map
        try:
            project = arcpy.mp.ArcGISProject('CURRENT')
        except Exception:
            # No current project or map.
            project = None
            arcpy.AddMessage(arcpy.GetIDMessage(190194))

        # Add layers to current map if there is one
        if project:
            activeMap = project.activeMap
            layer_name = f"{os.path.basename(self._out_suitability)}_Layer"
            layer: arcpy.Layer = arcpy.management.MakeRasterLayer(in_raster=self._out_suitability,
                                                                  out_rasterlayer=layer_name)[0]
            activeMap.addLayer(layer, "TOP")

        return self._out_suitability

    @general_error_logger
    def calculate(self) -> str:
        """calculate Generate the Helicopter Landing Zone suitability raster.

        Output raster contains values:
        1 - Acceptable
        2 - Acceptable with caution
        3 - Within obstacle approach distance

        :return: Output suitability raster
        :rtype: DERasterDataset
        """
        return self._execute()
