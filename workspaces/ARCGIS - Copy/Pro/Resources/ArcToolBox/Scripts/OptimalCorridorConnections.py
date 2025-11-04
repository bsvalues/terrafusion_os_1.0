# scratch folder is used for temp outputs, user can change scratchWorkspace environment to control location
# https://pro.arcgis.com/en/pro-app/latest/tool-reference/environment-settings/scratch-folder.htm

import arcpy
import os
import uuid
from arcpy.sa import *
from arcpy.analysis import Buffer
from math import floor, ceil
import numpy as np


def OptimalCorridorConnections(
        in_regions: str,
        out_optimal_polygons: str,
        in_barriers: str,
        in_cost_raster: str,
        out_optimal_lines: str = "",
        out_neighbor_polygons: str = "",
        out_neighbor_lines: str = "",
        corridor_method: str = "Fixed width corridor",
        corridor_width: float = 0,
        distance_method: str = "Planar",
):
    temp_files = {}
    try:
        temp_files = {
            "fsTempLines_Optimal": os.path.join(arcpy.env.scratchFolder, "Lines_Optimal_{0}.shp".format(uuid.uuid1())),
            "fsTempLines_Neighbor": os.path.join(arcpy.env.scratchFolder,
                                                 "Lines_Neighbor_{0}.shp".format(uuid.uuid1())),
            "fsTempPoly_Optimal": os.path.join(arcpy.env.scratchFolder, "Poly_Optimal_{0}.shp".format(uuid.uuid1())),
            "fsTempPoly_Neighbor": os.path.join(arcpy.env.scratchFolder, "Poly_Neighbor{0}.shp".format(uuid.uuid1())),
            "fsTempCostSurface": os.path.join(arcpy.env.scratchFolder, "CostSurface_{0}.tif".format(uuid.uuid1())),
            "fsTempBarriers": os.path.join(arcpy.env.scratchFolder, "Barriers_{0}.tif".format(uuid.uuid1()))
        }

        # Divide corridor_width by 2
        corridor_width = corridor_width/2

        # Set cost_surface, max_cost, and barrier for each category
        cost_surface, max_cost, barrier = set_occ_variables(in_regions, corridor_width, in_cost_raster, in_barriers, temp_files)
        
        # Run ORC and create_corridor
        arcpy.gp.OptimalRegionConnections_sa(in_regions, temp_files["fsTempLines_Optimal"], barrier,
                                             cost_surface,
                                             temp_files["fsTempLines_Neighbor"], distance_method, "NO_CONNECTIONS")
        arcpy.AddWarning(arcpy.GetMessages(1))
        create_corridor("Optimal", max_cost, temp_files, out_optimal_polygons)

        # Check optional outputs and calculate if requested
        if bool(out_neighbor_polygons):
            create_corridor("Neighbor", max_cost, temp_files, out_neighbor_polygons)
        if bool(out_optimal_lines):
            arcpy.management.CopyFeatures(temp_files["fsTempLines_Optimal"], out_optimal_lines)
        if bool(out_neighbor_lines):
            arcpy.management.CopyFeatures(temp_files["fsTempLines_Neighbor"], out_neighbor_lines)


    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))
        arcpy.AddWarning(arcpy.GetMessages(1))

    except Exception as e:
        arcpy.AddError(str(e))

    finally:
        for temp_file in temp_files.values():
            arcpy.management.Delete(temp_file)
    return


def set_occ_variables(in_regions, corridor_width: float, in_cost_raster: str, in_barriers, temp_files):
    """Sets the cost_surface and max_cost variables"""
    if corridor_width == 0.0:
        cost_surface = in_cost_raster
        barrier = in_barriers
        max_cost = "0"
    elif in_cost_raster == "":
        cost_surface = ""
        max_cost = f"{corridor_width}"
        if in_barriers == "":
            barrier = in_barriers
        else:
            # We need to "Grow the barriers"
            if "Feature" in arcpy.Describe(in_barriers).dataType or "Shape" in arcpy.Describe(in_barriers).dataType:
                bar_desc = arcpy.Describe(in_barriers)
                if "Raster" in arcpy.Describe(in_regions).dataType:
                    feature_cell_size = min(
                        Raster(in_regions).meanCellWidth,
                        corridor_width
                    )
                else:
                    feature_cell_size = min(
                        max(bar_desc.extent.height, bar_desc.extent.width) / 250,
                        corridor_width
                    )
                arcpy.FeatureToRaster_conversion(
                    in_barriers, arcpy.ListFields(in_barriers)[0].name, temp_files["fsTempCostSurface"],
                    feature_cell_size
                )
                barrier_ras = Raster(temp_files["fsTempCostSurface"])
            else:
                barrier_ras = Raster(in_barriers)
            barrier = grow_barrier(barrier_ras, corridor_width, temp_files)
    else:
        # Add barrier data to the in_cost_raster
        if in_barriers != "":
            arcpy.gp.ExtractByMask_sa(in_cost_raster, in_barriers, temp_files["fsTempBarriers"], "OUTSIDE", in_cost_raster)
            ras = SetNull(IsNull(temp_files["fsTempBarriers"]), in_cost_raster)
        else:
            ras = in_cost_raster
        # Find the raster cell radius to use for focal statistics
        cell_size = arcpy.GetRasterProperties_management(ras, "CELLSIZEX")
        cell_radius = ceil(float(corridor_width) / float(cell_size.getOutput(0)))

        cost_surface = arcpy.sa.FocalStatistics(ras, arcpy.sa.NbrCircle(cell_radius, "CELL"), "MEAN", "NODATA")
        max_cost = corridor_width
        barrier = in_barriers
        cost_surface.save(temp_files["fsTempCostSurface"])

    return cost_surface, max_cost, barrier


def grow_barrier(ras, corridor_width, temp_files):
    lower_left_original = arcpy.Point(ras.extent.XMin, ras.extent.YMin)
    cell_size = ras.meanCellWidth
    min_value = float(arcpy.GetRasterProperties_management(ras, "MINIMUM")[0]) - 1.

    # We need to find the padding number of cells:
    padding = ceil(1.1 * (float(corridor_width) / float(cell_size)))
    original_array = arcpy.RasterToNumPyArray(ras, nodata_to_value=min_value)
    # Grow the array by x number of cells
    expanded_rows = original_array.shape[0] + 2 * padding
    expanded_cols = original_array.shape[1] + 2 * padding
    expanded_matrix = min_value * np.ones((expanded_rows, expanded_cols))
    start_row, start_col = padding, padding

    expanded_matrix[start_row:start_row + original_array.shape[0], start_col:start_col + original_array.shape[1]] = original_array
    lower_left_new = arcpy.Point(lower_left_original.X - padding * cell_size, lower_left_original.Y - padding * cell_size)
    # Convert it back into a raster
    expanded_matrix[expanded_matrix != min_value] = 1

    expanded_raster = arcpy.NumPyArrayToRaster(expanded_matrix, lower_left_new, cell_size, value_to_nodata=min_value)

    # cell_radius = ceil(float(corridor_width) / float(cell_size))
    nbr_circle = arcpy.sa.NbrCircle(corridor_width, "MAP")
    barrier = arcpy.sa.FocalStatistics(expanded_raster, nbr_circle, "MAXIMUM", "DATA")

    return barrier


def create_corridor(
    method: str,
    max_cost,
    temp_files,
    out_polygon
):
    """Creates corridors based on the value for max_cost"""
    if max_cost == "0":
        arcpy.management.CopyFeatures(temp_files[f"fsTempLines_{method}"], out_polygon)
    else:
        arcpy.analysis.Buffer(temp_files[f"fsTempLines_{method}"], temp_files[f"fsTempPoly_{method}"], float(max_cost), line_end_type="ROUND")
        arcpy.management.AddField(temp_files[f"fsTempPoly_{method}"], "CORRID", "LONG")
        arcpy.management.CalculateField(temp_files[f"fsTempPoly_{method}"], "CORRID", "!PATHID!")
        arcpy.management.DeleteField(temp_files[f"fsTempPoly_{method}"], "PATHID")
        arcpy.management.DeleteField(temp_files[f"fsTempPoly_{method}"], "PATHCOST")
        arcpy.management.DeleteField(temp_files[f"fsTempPoly_{method}"], "BUFF_DIST")
        arcpy.management.DeleteField(temp_files[f"fsTempPoly_{method}"], "ORIG_FID")
        arcpy.management.CopyFeatures(temp_files[f"fsTempPoly_{method}"], out_polygon)



if __name__ == '__main__':
    _in_regions = arcpy.GetParameterAsText(0)
    _out_optimal_polygons = arcpy.GetParameterAsText(1)
    _in_barriers = arcpy.GetParameterAsText(2)
    _in_cost_raster = arcpy.GetParameterAsText(3)
    _out_optimal_lines = arcpy.GetParameterAsText(4)
    _out_neighbor_polygons = arcpy.GetParameterAsText(5)
    _out_neighbor_lines = arcpy.GetParameterAsText(6)
    _corridor_method = arcpy.GetParameterAsText(7)
    _corridor_width = arcpy.GetParameter(8)
    _distance_method = arcpy.GetParameterAsText(9)

    OptimalCorridorConnections(in_regions=_in_regions,
                               out_optimal_polygons=_out_optimal_polygons,
                               in_barriers=_in_barriers,
                               in_cost_raster=_in_cost_raster,
                               out_optimal_lines=_out_optimal_lines,
                               out_neighbor_polygons=_out_neighbor_polygons,
                               out_neighbor_lines=_out_neighbor_lines,
                               corridor_method=_corridor_method,
                               corridor_width=_corridor_width,
                               distance_method=_distance_method)
