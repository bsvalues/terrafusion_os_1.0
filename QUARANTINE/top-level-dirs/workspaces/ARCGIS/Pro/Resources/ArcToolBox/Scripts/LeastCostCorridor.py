# scratch folder is used for temp outputs, user can change scratchWorkspace environment to control location
# https://pro.arcgis.com/en/pro-app/latest/tool-reference/environment-settings/scratch-folder.htm

import arcpy
import os
import uuid
from arcpy.sa import *


def LeastCostCorridor(in_accumulative_cost_distance_raster1, in_back_direction_raster1,
                      in_accumulative_cost_distance_raster2, in_back_direction_raster2, out_raster,
                      threshold_method, threshold):
    fsTempInitialCombinedCorridor = None
    fsTempConnectedCorridor1 = None
    fsTempConnectedCorridor2 = None
    fsTempInitialCorridorEdges = None

    try:
        # Add the accumulative cost distance rasters together.
        rCombinedCost_full = Raster(in_accumulative_cost_distance_raster1) + Raster(
            in_accumulative_cost_distance_raster2)

        # If threshold_method is 'No threshold' (regardless of threshold value), out_raster at full extent.
        if threshold_method.upper() == 'NO THRESHOLD' or threshold_method.upper() == 'NO_THRESHOLD':
            rCombinedCost_full.save(out_raster)
            out_raster = pyramids(out_raster)
            return

        Threshold0 = threshold
        if threshold_method.upper() == 'PERCENT OF LEAST COST' or threshold_method == 'PERCENT_OF_LEAST_COST':
            # Convert the threshold from percent to accumulative cost units.
            threshold = (rCombinedCost_full.minimum) + (rCombinedCost_full.minimum * threshold / 100.0)
            arcpy.AddIDMessage("INFORMATIVE", 10691, Threshold0, threshold)

        # If the threshold value in accumulative cost units is greater than the maximum value, use the full extent.
        if threshold > rCombinedCost_full.maximum:
            rCombinedCost_full.save(out_raster)
            out_raster = pyramids(out_raster)
            return

        # If the threshold value is smaller than the least cost path (minimum), warning and output an empty raster.
        if threshold < rCombinedCost_full.minimum:
            arcpy.AddIDMessage("WARNING", 10686)

            # Produce an empty raster (out_raster) with same extent, cellsize, etc.
            Con(rCombinedCost_full, 1, "", "VALUE <= {0}".format(threshold)).save(out_raster)
            out_raster = pyramids(out_raster)

        # Otherwise, when the threshold is between or equal to the max and min, apply the threshold.
        if rCombinedCost_full.minimum <= threshold and threshold <= rCombinedCost_full.maximum:

          rCombinedCost = Con(rCombinedCost_full, 1, "", "VALUE <= {0}".format(threshold))

          fsTempInitialCombinedCorridor = os.path.join(arcpy.env.scratchFolder, "tc_{0}.crf".format(uuid.uuid1()))
          fsTempConnectedCorridor1 = os.path.join(arcpy.env.scratchFolder, "t1_{0}.crf".format(uuid.uuid1()))
          fsTempConnectedCorridor2 = os.path.join(arcpy.env.scratchFolder, "t2_{0}.crf".format(uuid.uuid1()))
          fsTempInitialCorridorEdges = os.path.join(arcpy.env.scratchFolder, "te_{0}.crf".format(uuid.uuid1()))

          rCombinedCost.save(fsTempInitialCombinedCorridor)

          # only trace paths from edges of region
          rEdges = Con(rCombinedCost & IsNull(FocalStatistics(rCombinedCost, "", "VARIETY", "NODATA")), 1)
          rEdges.save(fsTempInitialCorridorEdges)

          arcpy.gp.OptimalPathAsRaster_sa(rEdges, in_accumulative_cost_distance_raster1, in_back_direction_raster1,
                                          fsTempConnectedCorridor1, "", "EACH_CELL")
          arcpy.gp.OptimalPathAsRaster_sa(rEdges, in_accumulative_cost_distance_raster2, in_back_direction_raster2,
                                          fsTempConnectedCorridor2, "", "EACH_CELL")
          Con(CellStatistics([rCombinedCost, fsTempConnectedCorridor1, fsTempConnectedCorridor2], "VARIETY", "DATA"),
              rCombinedCost_full).save(out_raster)
          out_raster = pyramids(out_raster)
                
    except arcpy.ExecuteError:    
        arcpy.AddError(arcpy.GetMessages(2))
        arcpy.AddWarning(arcpy.GetMessages(1))

    except Exception as e:
        arcpy.AddError(str(e))
        
    finally:
        if fsTempConnectedCorridor1:
            arcpy.management.Delete(fsTempConnectedCorridor1)
        if fsTempConnectedCorridor2:
            arcpy.management.Delete(fsTempConnectedCorridor2)
        if fsTempInitialCorridorEdges:
            arcpy.management.Delete(fsTempInitialCorridorEdges)
        if fsTempInitialCombinedCorridor:
            arcpy.management.Delete(fsTempInitialCombinedCorridor)
    return
    
def pyramids(out_raster):
    if Raster(out_raster).format == "Cache/LERC2D" or Raster(out_raster).format == "Cache/RAW":
        arcpy.management.CalculateStatistics(out_raster, "", "", "", "SKIP_EXISTING", "")
        a = arcpy.management.BuildPyramids(out_raster, "", "", "", "", "", "")
    else:
        a = out_raster
    return a


if __name__ == '__main__':

    in_accumulative_cost_distance_raster1 = arcpy.GetParameterAsText(0)
    in_back_direction_raster1 = arcpy.GetParameterAsText(1)
    in_accumulative_cost_distance_raster2 = arcpy.GetParameterAsText(2)
    in_back_direction_raster2 = arcpy.GetParameterAsText(3)
    out_raster = arcpy.GetParameterAsText(4)
    threshold_method = arcpy.GetParameterAsText(5)
    threshold = arcpy.GetParameter(6)

    LeastCostCorridor(in_accumulative_cost_distance_raster1, in_back_direction_raster1,
                      in_accumulative_cost_distance_raster2, in_back_direction_raster2, out_raster,
                      threshold_method, threshold)

