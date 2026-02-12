import time
import sys
import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class FlowDistance(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Flow Distance"
        self.description = "Calculate flow distance for input stream raster."
        self.canRunInBackground = False
        self.helpContext = 54020006

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Stream Raster",
            name="inputStreamRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Surface Raster",
            name="inputSurfaceRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Name",
            name="outputName",
            datatype="GPString",
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Flow Direction Raster",
            name="inputFlowDirectionRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Distance Type",
            name="distanceType",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['VERTICAL', 'HORIZONTAL']
        parameters[-1].value = "VERTICAL"

        parameters.append(arcpy.Parameter(
            displayName="Flow Direction Type",
            name="flowDirectionType",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['D8', 'MFD', 'DINF']
        parameters[-1].value = "D8"
        
        parameters.append(arcpy.Parameter(
            displayName="Output Raster",
            name="outputRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Statistics Type",
            name="statisticsType",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['MINIMUM', 'MAXIMUM', 'WEIGHTED_MEAN']
        parameters[-1].value = "MINIMUM"

        return parameters

    def isLicensed(self):
        """Execute only if the ArcGIS Spatial Analyst extension is available."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inputRasterParam = parameters[0]
        inputRasterParam2 = parameters[1]
        inputRasterParam3 = parameters[3]
        validateNonLocalRaster(inputRasterParam)
        validateNonLocalRaster(inputRasterParam2)
        validateNonLocalRaster(inputRasterParam3)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Flow Distance"

        inputRas = parameters[0].valueAsText
        url = getRasterURL(inputRas)

        inputRas2 = parameters[1].valueAsText
        url2 = getRasterURL(inputRas2)

        outName = parameters[2].valueAsText

        inputRas3 = parameters[3].valueAsText
        url3 = getRasterURL(inputRas3)

        distType = parameters[4].valueAsText
        flowDType = parameters[5].valueAsText
        statType = parameters[7].valueAsText

        import json
        params = dict(inputStreamRaster=json.dumps({"url":url}),
                      inputSurfaceRaster=json.dumps({"url":url2}),
                      outputName=json.dumps({"serviceProperties":{"name":outName}}),
                      inputFlowDirectionRaster=makeJSONParameter(url3),
                      distanceType=distType,
                      flowDirectionType=flowDType,
                      statisticsType=statType
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        outLayerName = outName

        try:
            jdict = json.loads(output)
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outLayerName)
            parameters[6].value = outLayerName
        except:
            pass
