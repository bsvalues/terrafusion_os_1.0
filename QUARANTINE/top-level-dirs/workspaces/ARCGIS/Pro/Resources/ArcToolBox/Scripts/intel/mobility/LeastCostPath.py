# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
LeastCostPath.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2019-09-06 - mfunk - update lib references and module name for Pro integration
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-01-22 - jjones - Mobility base class consolidated into Least Cost Path class
* 2020-08-24 - mfunk - optimize with Distance Accumulation and Optimal Path As Line
* 2021-05-21 - mfunk - fixes for issue 1535
* 2022-11-01 - mfunk - Switch to "NEW" method instead of "LEGACY" method the Legacy
*                      Distance methods are being deprecated.
------------------------------------------------------------------------------
'''

import os
import traceback
import sys
from typing import Union, List, Any, Dict
import arcpy
from arcpy import sa

from intel.utilities import Utilities as iu
from intel.utilities import DEBUG, create_scratch_geodatabase, create_temp_table_name


class LeastCostPathLogic(object):
    '''
    Least Cost Path

    Find optimal route (shortest path) over cost surface

    Input:
    * input_cost_surface: input raster defining cost to travel across each pixel
    * input_start_point: input starting point as point feature
    * input_end_point: input end point as point feature
    * output_path: output path (line) feature to create.
    * handle_zeros: handle surface zero value as NoData or as a small positive

    Output:
    * output_path: path features
    '''
    def __init__(self,
                 input_cost_surface,
                 input_start_point,
                 input_end_point,
                 output_path,
                 handle_zeros):
        '''
        Least Cost Path constructor
        '''
        self._input_cost_surface = input_cost_surface
        self._input_start_point = input_start_point
        self._input_end_point = input_end_point
        self._output_path = output_path
        self._handle_zeros = handle_zeros

        # temp dataset variables
        self._delete_intermediate = []
        self._delete_temp_scratch_flag = False
        self._temp_scratch = None

        arcpy.CheckOutExtension("Spatial")

    @property
    def input_cost_surface(self):
        return self._input_cost_surface

    @input_cost_surface.setter
    def input_cost_surface(self, value):
        self._input_cost_surface = value

    @property
    def input_start_point(self):
        return self._input_start_point

    @input_start_point.setter
    def input_start_point(self, value):
        self._input_start_point = value

    @property
    def input_end_point(self):
        return self._input_end_point

    @input_end_point.setter
    def input_end_point(self, value):
        self._input_end_point = value

    @property
    def output_path(self):
        return self._output_path

    @output_path.setter
    def output_path(self, value):
        self._output_path = value

    def __del__(self):
        '''
        destructor and cleanup
        '''
        self._cleanup()
        arcpy.CheckInExtension("Spatial")

    def _cleanup(self) -> bool:
        """_cleanup remove temporary data and workspace

        _cleanup is an internal method to cleanup temporary data and
        workspaced generated while running the tool.
        1) Remove all temporary datas listed in self._delete_intermediate.
        2) Remove self._temp_scratch if it was created during processing


        :return: cleanup completed
        :rtype: bool
        """
        # "Removing intermedate datasets... "
        arcpy.AddMessage(arcpy.GetIDMessage(190012))
        for i in self._delete_intermediate:
            if arcpy.Exists(i):
                arcpy.management.Delete(i)
                if DEBUG:
                    arcpy.AddMessage(f"...{i}")

        # Remove temp folder and geodatabase if it was created
        if self._delete_temp_scratch_flag is True:
            if self._temp_scratch is not None:
                if DEBUG:
                    arcpy.AddMessage(f"Removing: {self._temp_scratch}")
                arcpy.management.Delete(self._temp_scratch)
                arcpy.management.Delete(os.path.dirname(self._temp_scratch))
                self._temp_scratch = None
        return True

    @staticmethod
    def _parallelizationFactor() -> Any:
        """_parallelizationFactor Raster parallelization factor

        Return Parallelization factor for raster ops
        http://pro.arcgis.com/en/pro-app/tool-reference/environment-settings/parallel-processing-factor.htm

        :return: parallelization factor
        :rtype: Any
        """
        pf = ""  # each tool determines own process.
        # pf = "0" # use only one process
        # available_cpus = len(os.sched_getaffinity(0))
        # desired_processes = 2
        # pf = available_cpus * desired_processes / 100
        return pf

    @staticmethod
    def _calcSmallPositive(cost_raster: str) -> float:
        """_calcSmallPositive Calculate minimum cost to replace zero-value cost cells.

        Intel #3996
        Fixes for problems in sa.DistanceAccumulation caused static small_pos to produce
        incomplete polylines. Max precision of 6-9 decimals depending on cost raster's
        max value. Below calc suggested by DistanceAccumulation dev as workaround. 

        :return: small positive replacement value
        :rtype: float
        """
        cost_desc = arcpy.Describe(cost_raster)
        band_0 = cost_desc.children[0]
        band_0_path: str = os.path.join(cost_desc.catalogPath, band_0.name)
        max_cost: int = arcpy.management.GetRasterProperties(band_0_path, "MAXIMUM").getOutput(0)
        denom: float = 1000000.0
        # calc_min_1 = max(float(band_0.height), float(band_0.width)) * float(max_cost) / denom
        small_pos: float = float(max_cost) / denom
        return small_pos

    @staticmethod
    def _nameOutputPoints(out_line_name: str) -> List[str]:
        """_nameOutputPoints Output names for points

        returns output names for the input starting and ending points
        takes the output_path and appends "_start" and "_end" to the basename
        returns list as [start ,end].

        :param out_line_name: output line feature name
        :type out_line_name: str
        :return: output start and end feature names
        :rtype: List[str]
        """
        folder: str = os.path.dirname(out_line_name)
        basename: str = os.path.basename(out_line_name)
        ext: str = os.path.splitext(out_line_name)
        start: str = os.path.join(folder, f"{basename}_start{ext[1]}")
        end: str = os.path.join(folder, f"{basename}_end{ext[1]}")
        return[start, end]

    @staticmethod
    def _typeZero(input_raster: str) -> Union[int, float]:
        """_typeZero return correct zero (int or double) based on surface pixel type

        Returns integer for integer raster or float for float raster.

        :param input_raster: input raster dataset
        :type input_raster: str
        :return: output zero type
        :rtype: int or float
        """
        zero = 0
        if arcpy.Describe(input_raster).pixelType in ['F32', 'F64']:
            zero = 0.0
        return zero

    def _zeroCostAsNull(self, inputcost: str) -> str:
        """_zeroCostAsNull Convert zeros to null in inputcost

        Return cost surface with all values of zero as NODATA.

        :param inputcost: input cost raster
        :type inputcost: str
        :return: modified cost raster
        :rtype: str
        """
        try:
            arcpy.AddMessage(arcpy.GetIDMessage(190134))
            zero = self._typeZero(inputcost)
            newcost = sa.SetNull(inputcost,
                                 inputcost,
                                 f"VALUE = {zero}")
            return newcost
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def _zeroCostAsSmallPositive(self, inputcost: str) -> str:
        """_zeroCostAsSmallPositive Convert zeros to small positive number

        Return cost surface with all values of zero as a small positive number.

        :param inputcost: input cost raster
        :type inputcost: str
        :return: modified cost raster
        :rtype: str
        """
        try:
            
            zero = self._typeZero(inputcost)
            small_pos_value = self._calcSmallPositive(inputcost)
            arcpy.AddMessage(arcpy.GetIDMessage(190135).format(small_pos_value))
            newcost = sa.Con(inputcost,
                             sa.Plus(inputcost, float(small_pos_value)),
                             inputcost,
                             f"VALUE = {zero}")
            return newcost
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def _costDistance(self,
                      cost_surf: str,
                      start_point: str) -> str:
        """_costDistance Wrap spatial analyt's Cost Distance function.

        [extended_summary]

        :param cost_surf: input cost surface
        :type cost_surf: str
        :param start_point: input starting point
        :type start_point: str
        :return: cost distance raster
        :rtype: str
        """
        try:
            # out_backlink = os.path.join('in_memory', 'lcp_backlink')
            out_backlink = create_temp_table_name(workspace=arcpy.env.scratchGDB)
            if arcpy.Exists(out_backlink):
                arcpy.management.Delete(out_backlink)
            arcpy.AddMessage(arcpy.GetIDMessage(190136))
            out_cost_dist = sa.CostDistance(start_point,
                                            cost_surf,
                                            "#",
                                            out_backlink)
            self._delete_intermediate.append(out_backlink)

            # noted this is not removed after CostDistance is run....
            self._delete_intermediate.append(os.path.join(arcpy.env.scratchGDB,
                                             "CostDis_Poin1"))

            out_cd = create_temp_table_name(workspace=arcpy.env.scratchGDB)
            if arcpy.Exists(out_cd):
                arcpy.management.Delete(out_cd)
            out_cost_dist.save(out_cd)
            self._delete_intermediate.append(out_cd)

            return [out_cost_dist, out_backlink]
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def _costPathAsPolyline(self,
                            out_cost_dist: str,
                            out_backlink: str,
                            end_points: str,
                            start_oid: str,
                            out_cost_path: str) -> str:

        try:
            if DEBUG:
                arcpy.AddMessage(r"CostPathAsPolyline...")

            if arcpy.Exists(out_cost_path):
                arcpy.management.Delete(out_cost_path)

            out_oid_fieldname = arcpy.Describe(end_points).oidFieldName

            sa.CostPathAsPolyline(in_destination_data=end_points,
                                  in_cost_distance_raster=out_cost_dist,
                                  in_cost_backlink_raster=out_backlink,
                                  out_polyline_features=out_cost_path,
                                  path_type="EACH_CELL",
                                  destination_field=out_oid_fieldname)

            self._delete_intermediate.append(out_cost_path)
            return out_cost_path
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def _distanceAccumulation(self,
                              cost_surf: str,
                              start_point: str) -> List[str]:
        """_distanceAccumulation Generate distance accumulation for cost_surf

        Generate Distance Accumulation raster and back direction raster for
        input cost_surf and start_point(s).

        :param cost_surf: Input cost surface
        :type cost_surf: str
        :param start_point: Input start point features
        :type start_point: str
        :return: accumulation and back direction rasters
        :rtype: list
        """
        try:
            out_dist_accum = create_temp_table_name(workspace=arcpy.env.scratchGDB)
            if arcpy.Exists(out_dist_accum):
                arcpy.management.Delete(out_dist_accum)
            out_back_dir = create_temp_table_name(workspace=arcpy.env.scratchGDB)
            if arcpy.Exists(out_back_dir):
                arcpy.management.Delete(out_back_dir)

            # arcpy.AddMessage(arcpy.GetIDMessage(190136))

            # Currently there is an issue with GEODESIC option that causes a problem
            # in the Optimal Path As Line tool. It is suggested that we use "PLANAR"
            # for the time being until it is fixed.
            d_method = "PLANAR"  # "GEODESIC"
            if DEBUG:
                arcpy.AddMessage(r"Distance Accumulation...")
            result_accum = sa.DistanceAccumulation(start_point,
                                                   in_cost_raster=cost_surf,
                                                   out_back_direction_raster=out_back_dir,
                                                   distance_method=d_method)
            self._delete_intermediate.append(out_back_dir)

            result_accum.save(out_dist_accum)
            self._delete_intermediate.append(out_dist_accum)
            if DEBUG:
                arcpy.AddMessage(f"temp data: {out_dist_accum} \n and  {out_back_dir}")
                arcpy.AddMessage(arcpy.GetMessages(0))
            return [out_dist_accum, out_back_dir]
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(0))
            arcpy.AddError(pymsg)

    def _optimalPathAsLine(self,
                           in_dest_points: str,
                           in_dist_accum: str,
                           in_back_dir: str,
                           out_path_lines: str) -> str:
        """_optimalPathAsLine Find optimal path for raster

        Get optimal path for accumulation and back direction rasters
        to the destination points. Return the optimal paths.

        :param in_dest_points: Destination (end) point features
        :type in_dest_points: str
        :param in_dist_accum: Distance Accumulation raster
        :type in_dist_accum: str
        :param in_back_dir: Back Direction raster
        :type in_back_dir: str
        :param out_path_lines: output line feature to create
        :type out_path_lines: str
        :return: output line features
        :rtype: str
        """
        try:
            if DEBUG:
                arcpy.AddMessage(r"Optimal Path As Line...")
            dest_oid = arcpy.Describe(in_dest_points).oidFieldName
            sa.OptimalPathAsLine(in_dest_points,
                                 in_dist_accum,
                                 in_back_dir,
                                 out_path_lines,
                                 destination_field=dest_oid,
                                 path_type="EACH_CELL")
            if DEBUG:
                arcpy.AddMessage(arcpy.GetMessages(0))
            return out_path_lines
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(r"LeastCostPath._optimalPathAsLine",
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(0))
            arcpy.AddError(pymsg)

    def _copyOutputPoints(self,
                          input_start_point: str,
                          input_end_point: str,
                          output_path: str) -> List[str]:
        """_copyOutputPoints Make a copy of input points.

        Copy input point features to output features
        based on output path line name.

        :param input_start_point: original input start point features
        :type input_start_point: str
        :param input_end_point: original input end point features
        :type input_end_point: str
        :param output_path: output path features
        :type output_path: str
        :return: output start point feature name, output end point feature name
        :rtype: list
        """
        try:
            if DEBUG:
                arcpy.AddMessage(f"Input start point count: {arcpy.GetCount_management(input_start_point)[0]}")
                arcpy.AddMessage(f"Input end point count: {arcpy.GetCount_management(input_end_point)[0]}")
            out_start_point, out_end_point = self._nameOutputPoints(output_path)
            arcpy.AddMessage(arcpy.GetIDMessage(190140))
            arcpy.CopyFeatures_management(input_start_point, out_start_point)
            arcpy.CopyFeatures_management(input_end_point, out_end_point)
            return [out_start_point, out_end_point]
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def _writeOutputLineFeatures(self,
                                 output_path_list: list,
                                 output_path: str) -> str:
        """_writeOutputLineFeatures Write output dictionary of lines to feature class

        Merge path list into single polyline featureclass.

        :param output_path_list: list of input line geometries
        :type output_path_list: list
        :param output_path: path for output lines
        :type output_path: str
        :return: output line features
        :rtype: str
        """
        try:
            arcpy.Merge_management(inputs=output_path_list,
                                   output=output_path)
            return output_path
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    @staticmethod
    def _mergeDict(d1: Dict[Any, Any],
                   d2: Dict[Any, Any]) -> Dict[Any, Any]:
        """_mergeDict merge two dictionaries

        Combine two input dictionaries into one

        Aaron Hall (Aaron Hall) "Answer to question 'How to merge two dictionaries in a single expression?'"
        https://stackoverflow.com/a/26853961. November 10 2014. Accessed 2018-10-29

        :param d1: first dictionary
        :type d1: dict
        :param d2: second dictionary
        :type d2: dict
        :return: combined dictionary
        :rtype: dict
        """
        d3 = d1.copy()
        d3.update(d2)
        return d3

    def calculate(self) -> List[str]:
        """calculate Find optimal route (shortest path) over a cost surface.

        Find the least cost path (optimal route) over a cost surface, from
        one or more starting points to one or more ending points.

        :return: Output path, start points, end points
        :rtype: List[str]
        """
        try:

            # Set up initial dataset descriptions so we don't have to
            # repeatedly call it.
            start_point_desc = arcpy.Describe(self._input_start_point)
            end_point_desc = arcpy.Describe(self._input_end_point)
            cost_surf_desc = arcpy.Describe(self._input_cost_surface)

            # Set the raster parallel processing factor (default is to let each
            # tool decide how to process)
            arcpy.env.parallelProcessingFactor = self._parallelizationFactor()
            arcpy.env.cellSize = self._input_cost_surface

            if arcpy.env.scratchGDB is None:
                self._temp_scratch = create_scratch_geodatabase()
                arcpy.env.scratchGDB = self._temp_scratch
                self._delete_temp_scratch_flag = True

            # Set output coordinate system
            # use the coordinate system of the cost surface
            cost_surface_sr = cost_surf_desc.spatialReference
            arcpy.env.outputCoordinateSystem = cost_surface_sr
            if DEBUG:
                arcpy.AddMessage(f"Input Cost Surface sr: {cost_surface_sr.name}")
                start_point_sr = start_point_desc.spatialReference
                arcpy.AddMessage(f"Start Point sr: {start_point_sr.name}")
                end_point_sr = end_point_desc.spatialReference
                arcpy.AddMessage(f"End Point sr: {end_point_sr.name}")

            m = arcpy.GetIDMessage(190141)
            message = m.format(arcpy.GetCount_management(self._input_start_point)[0],
                               arcpy.GetCount_management(self._input_end_point)[0])
            arcpy.AddMessage(message)

            # Handle Zeros in cost surface
            # Handle zeros as either small positive numbers that can be traversed,
            # or as NULL which cannot be traversed.
            if self._handle_zeros == iu.handle_zeros_list[0]:
                cost_surf = self._zeroCostAsSmallPositive(self._input_cost_surface)
            else:
                cost_surf = self._zeroCostAsNull(self._input_cost_surface)
            arcpy.env.mask = cost_surf

            """
            Processing rasters for paths:

            Two methods for doing this, the legacy method and the new method.

            The legacy method uses older tools that are currently (2020-08) faster
            than the new method but require a few more steps. But these produce a
            slightly less desirable result. This process uses Cost Distance, Cost Path,
            and Raster To Polyline for each input start point and then combines output paths.

            The new method is being optimized and is slower, but gives more accurate
            results over raster datasets. This method uses Distance Accumulation and
            Optimal Path As Line. This method should only need to be done once for the
            entire set of input start points.

            2022-11-01 - Legacy distance tools are being deprecated and will not be
            run as part of the Least Cost Path tool.

            """
            method: str = "NEW"  # Method to use at this point in time

            # Create an optimal path for each input start point to each ending point
            output_path_list: list = []
            start_oid_list = [row[0] for row in arcpy.da.SearchCursor(self._input_start_point, ["OID@"])]
            for start_oid in start_oid_list:
                arcpy.AddMessage(arcpy.GetIDMessage(190142).format(start_oid))

                # select current point from the input points and use this point
                start_point_layer = f"startpoints{start_oid}"
                arcpy.MakeFeatureLayer_management(self._input_start_point,
                                                  start_point_layer)
                exp = "{0} = {1}".format(start_point_desc.oidFieldName,
                                         start_oid)
                arcpy.SelectLayerByAttribute_management(start_point_layer,
                                                        "NEW_SELECTION",
                                                        exp)
                temp_lines = os.path.join(arcpy.env.scratchGDB,
                                          f"temp_lines{start_oid}")
                if arcpy.Exists(temp_lines):
                    arcpy.management.Delete(temp_lines)
                if method == "LEGACY":
                    # Cost Distance
                    # create the cost distance and cost backlink rasters from the cost surface
                    # and input points.
                    out_cost_dist, out_backlink = self._costDistance(cost_surf,
                                                                     start_point_layer)

                    # Cost Path As Polyline
                    # Create output path lines from cost distance and cost backlink
                    temp_lines = self._costPathAsPolyline(out_cost_dist=out_cost_dist,
                                                          out_backlink=out_backlink,
                                                          end_points=self._input_end_point,
                                                          start_oid=start_oid,
                                                          out_cost_path=temp_lines)
                    if DEBUG:
                        arcpy.AddMessage(f"... created {temp_lines}")

                else:  # NEW METHOD
                    # Distance Accumulation
                    # Create the distance accumulation and back direction rasters from
                    # the input starting points and cost surface
                    dist_accum, back_dir = self._distanceAccumulation(cost_surf,
                                                                      self._input_start_point)

                    # Optimal Path As Line
                    # Create the optimal paths from the ending points, distance accumulation
                    # raster and back direction raster.
                    temp_lines = self._optimalPathAsLine(self._input_end_point,
                                                         dist_accum,
                                                         back_dir,
                                                         temp_lines)

                # Add StartID field to temp line
                from_id_field_name = "StartID"
                arcpy.AddField_management(temp_lines,
                                          field_name=from_id_field_name,
                                          field_type="LONG",
                                          field_alias="Start ID")
                exp = f"{start_oid}"
                arcpy.CalculateField_management(temp_lines,
                                                field=from_id_field_name,
                                                expression=exp)

                # Add resulting line features into a list
                output_path_list.append(temp_lines)
                self._delete_intermediate.append(temp_lines)
                del temp_lines

            # Merge the resulting line features into single feature class as the final output
            arcpy.AddMessage(arcpy.GetIDMessage(190143))
            self._output_path = self._writeOutputLineFeatures(output_path_list,
                                                              self._output_path)

            # Make a copy of the start and end points
            # this is MOSTLY done for symbology.
            out_start_point, out_end_point = self._copyOutputPoints(self._input_start_point,
                                                                    self._input_end_point,
                                                                    self._output_path)

            if DEBUG:
                arcpy.AddMessage(f"Setting output...: {self._output_path}, {out_start_point}, {out_end_point}")

            return [self._output_path,
                    out_start_point,
                    out_end_point]

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(0))
            arcpy.AddError(pymsg)
