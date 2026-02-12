import time
import sys
import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class Fill(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Fill"
        self.description = "Fill sinks on the input DEM raster image service."
        self.canRunInBackground = False
        self.helpContext = 54020001

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

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
            displayName="Z Limit",
            name="zLimit",
            datatype="GPDouble",
            parameterType="Optional",
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
        validateNonLocalRaster(inputRasterParam)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Fill"

        inputRas = parameters[0].valueAsText
        url = getRasterURL(inputRas)

        outName = parameters[1].valueAsText
        
        zLim = parameters[2].valueAsText        

        import json
        params = dict(inputSurfaceRaster=json.dumps({"url":url}),
                      outputName=json.dumps({"serviceProperties":{"name":outName}}),
                      zLimit=zLim
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
