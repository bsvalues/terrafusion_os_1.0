import time
import sys
import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class StreamLink(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Stream Link"
        self.description = "Create stream links for input stream raster image service."
        self.canRunInBackground = False
        self.helpContext = 54020004

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
            displayName="Input Flow Direction Raster",
            name="inputFlowDirectionRaster",
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
            displayName="Output Raster",
            name="outputRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

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
        validateNonLocalRaster(inputRasterParam)
        validateNonLocalRaster(inputRasterParam2)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Stream Link"

        inputRas = parameters[0].valueAsText
        url = getRasterURL(inputRas)

        inputRas2 = parameters[1].valueAsText
        url2 = getRasterURL(inputRas2)
        
        outName = parameters[2].valueAsText

        import json
        params = dict(inputStreamRaster=json.dumps({"url":url}),
                      inputFlowDirectionRaster=json.dumps({"url":url2}),
                      outputName=json.dumps({"serviceProperties":{"name":outName}})
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        outLayerName = outName        

        try:
            jdict = json.loads(output)
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outLayerName)
            parameters[3].value = outLayerName
        except:
            pass
