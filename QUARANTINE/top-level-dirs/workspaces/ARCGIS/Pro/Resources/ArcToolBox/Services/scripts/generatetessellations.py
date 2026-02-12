"""---------------------------------------------------------------------------
Name:              GenerateTessellations.py
Purpose:           Generate tessellations.
Author:            Esri Inc.
Created:           11/29/2018
Copyright:   (c)   Esri, Inc. 2018
ArcGIS Version:    10.7
---------------------------------------------------------------------------"""
# Properties of TessellationGenerator are dynamically binded. pylint: disable=E1101, E0203
import time
import os
import math

import arcpy  # pylint: disable=E0401
import hostedgp as agolgp  # pylint: disable=E0401
import aolutils
import rendererUtils
import debugUtils
from feature_count_query_utils import TessellationFeatureCountUtils as TFCU


# constants
TASK_NAME = "GenerateTessellations"
ERROR_CODES = [100268, 100269]

errorMsgs = {100268: "Generate Tessellations failed.",
             100269: "Invalid extent for generating tessellations."}


class TessellationGenerator:
    DEFAULT_VARIABLES = {"output_layer": None, "shape_type": "SQUARE", "size": 1,
                         "size_unit": "#", "extent": None, "extent_layer": None,
                         "intersect_study_area": False}

    def __init__(self, **kwargs):
        """Set the properties.

        Args:
            output_layer: an instance of PAFeatureLayer with the layer attribute point to the output path.
            shape_type: a string represents the output polygon shape type. Can only be "Square", "Triangle",
            "Diamond", "Hexagon", and "Transverse Hexagon".
            size: a float number represents the numeric number of the area of the tessellation polygon.
            size_unit: unit of the tessellation polygon area.
            extent: an instance of arcpy.Extent (default of None).
            extent_layer: an instance of PAFeatureLayer (default is None). If extent_layer is not None, then the
            tessellation polygons will be generated based upon the extent of the extent_layer. Otherwise, the
            tessellation polygons will be generated based upon the extent.
            keep_intersect_features: select features overlap with the extent_layer if True. False will return all polys.
            spatial_reference: an instance of arcpy.spatialReference.
        Returns:
            No return.
        Exceptions:
            No exception.

        """
        for variable_name in self.DEFAULT_VARIABLES:
            setattr(self, variable_name, kwargs.get(variable_name, self.DEFAULT_VARIABLES[variable_name]))

        if self.shape_type.lower() == "transversehexagon":
            self.shape_type = "TRANSVERSE_HEXAGON"

        self.size_areal_unit = TFCU.get_areal_size(self.size, self.shape_type, self.size_unit)

    def _generate(self, extent, templatePolySR, output_path):
        """Generate from extent layer.

        Args:
            extent: an instance of arcpy.Extent based on which the tessellations will be created.
            templatePolySR: the spatial reference of the original extent. If the extent was projected to GCS in
            create_proj_extent, then project the output back to the original PCS.
            output_path: absolute path of saving the output.
        """
        tmpBinPolygon = arcpy.CreateUniqueName("tmpBinPolygon", arcpy.env.scratchGDB)

        arcpy.management.GenerateTessellation(tmpBinPolygon, extent, self.shape_type, self.size_areal_unit)

        # out put data should be projected and simplified.
        arcpy.Project_management(tmpBinPolygon, output_path, templatePolySR, "#", "#", "PRESERVE_SHAPE")
        arcpy.Delete_management(tmpBinPolygon)

    def generate(self):
        """Generate tessellation polygons."""
        # Use the extent of extent_layer. If no extent_layer, use the pass-in extent instead.
        tmp_extent = self.extent_layer if self.extent_layer else self.extent
        (extent, projPolySR) = TFCU.create_proj_extent(tmp_extent)

        if self.extent_layer and self.intersect_study_area:
            # only keep features intersect with study area
            tmpBinPolygon = arcpy.CreateUniqueName("tmp_tessellations", arcpy.env.scratchGDB)
            self._generate(extent, projPolySR, tmpBinPolygon)
            tmp_poly_lyr = arcpy.MakeFeatureLayer_management(tmpBinPolygon).getOutput(0)
            arcpy.SelectLayerByLocation_management(tmp_poly_lyr.name, "intersect", self.extent_layer)
            arcpy.CopyFeatures_management(tmp_poly_lyr.name, self.output_layer)
        else:
            self._generate(extent, projPolySR, self.output_layer)


if __name__ == "__main__":
    hostedgp = None
    # Initiate start time
    startTime = time.time()
    beginTime = startTime

    try:
        hostedgp = agolgp.HostedGP(6, 5)
        startTime = aolutils.AddTimerMessage(startTime, "Init hosted gp")
        outputName = hostedgp.GetOutputName(5)
        startTime = aolutils.AddTimerMessage(startTime, "Get output name")
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)
        startTime = aolutils.AddTimerMessage(startTime, "Check privilege")

        if arcpy.GetParameterAsText(3).strip():
            # set max_featcount_limit to None so it won't check the maximum # of features for extent_layer.
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "extent layer", 3,
                                                              max_download_featcount=None)
            extentLayer = Input.name
        else:
            # arcpy.env.extent and extentLayer can not be both empty.
            if not arcpy.env.extent:
                aolutils.AddErrorCode(100269, errorMsgs.get(100269, ""))
                raise arcpy.ExecuteError
            else:
                extentLayer = None

        shape_type = arcpy.GetParameterAsText(0).upper()
        size = arcpy.GetParameter(1) or "#"
        size_unit = arcpy.GetParameterAsText(2) or "#"
        intersect_study_area = arcpy.GetParameter(4)
        startTime = aolutils.AddTimerMessage(startTime, "Get parameters.")

        paramsDict = {"binType": shape_type,
                      "binSize": size,
                      "binSizeUnit": size_unit}

        if arcpy.GetParameterAsText(3).strip():
            paramsDict["extentLayer"] = {"layer": extentLayer, "shapeType": "esriGeometryPolygon"}

        if arcpy.GetParameterAsText(6).strip():
            paramsDict["context"] = arcpy.GetParameterAsText(6)

        aolutils.checkForCredits(TASK_NAME, paramsDict)

        result_layer = os.path.join(arcpy.env.scratchGDB, "resultLayer")
        TessellationGenerator(output_layer=result_layer, shape_type=shape_type, size=size,
                              size_unit=size_unit, extent=arcpy.env.extent,
                              extent_layer=extentLayer,
                              intersect_study_area=intersect_study_area).generate()

        # debugUtils.debugToolMessages(result)
        startTime = aolutils.AddTimerMessage(startTime, "Run GenerateTessellation.")

        # Create output-service
        desc_output = arcpy.Describe(result_layer)
        # set the arcpy.env.extent as None before GetCount so to get the count of all output features
        arcpy.env.extent = None
        tessellation_count = int(arcpy.GetCount_management(result_layer).getOutput(0))
        arcpy.AddMessage(desc_output.shapeType)
        drawing_info = rendererUtils.getSimpleRendererInfo(desc_output.shapeType, TASK_NAME)
        out_desc = aolutils.getOutDescription("TesselationPolygons", 0, drawing_info)

        # Publish output to server
        result_service = aolutils.HostedToolResult(outputName)
        result_service.addHostedOutput(desc_output, out_desc, 7)
        startTime = result_service.generateHostedResult(hostedgp, startTime)
        startTime = aolutils.AddTimerMessage(startTime, "Generate output")

        # Logging info and credit usage
        values = [desc_output.shapeType,
                  tessellation_count,
                  2 if outputName.createService else 1]
        aolutils.LogUsageMetering(TASK_NAME, tessellation_count,
                                  tessellation_count * 0.001, startTime, values)

        params_for_report = {
            "tessellationLayer": {
                "count": tessellation_count,
                "shapeType": desc_output.shapeType
            },
            "binType": shape_type,
            "binSize": size,
            "binSizeUnit": size_unit
        }
        aolutils.reportParamsForCost(hostedgp, TASK_NAME, params_for_report)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)
    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)
    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")
