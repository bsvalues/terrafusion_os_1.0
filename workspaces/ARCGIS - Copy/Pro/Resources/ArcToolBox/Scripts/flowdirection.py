import time
import sys
import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class FlowDirection(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Flow Direction"
        self.description = "Create flow direction output for input DEM image service."
        self.canRunInBackground = False
        self.helpContext = 54020003

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
            displayName="Output Flow Direction Name",
            name="outputFlowDirectionName",
            datatype="GPString",
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Force all edge cells to flow outward",
            name="forceFlow",
            datatype="GPBoolean",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['FORCE', 'NORMAL']
        parameters[-1].value = "NORMAL"

        parameters.append(arcpy.Parameter(
            displayName="Flow Direction Type",
            name="flowDirectionType",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['D8', 'MFD', 'DINF']
        parameters[-1].value = "D8"

        parameters.append(arcpy.Parameter(
            displayName="Output Drop Name",
            name="outputDropName",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Flow Direction Raster",
            name="outputFlowDirectionRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Output Drop Raster",
            name="outputDropRaster",
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

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inputRasterParam = parameters[0]
        validateNonLocalRaster(inputRasterParam)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Flow Direction"

        inputRas = parameters[0].valueAsText
        url = getRasterURL(inputRas)

        outName = parameters[1].valueAsText
        forceOut = parameters[2].valueAsText
        flowType = parameters[3].valueAsText
        outDropNm = parameters[4].valueAsText        

        import json
        params = dict(inputSurfaceRaster=json.dumps({"url":url}),
                      outputFlowDirectionName=json.dumps({"serviceProperties":{"name":outName}}),
                      forceFlow=forceOut,
                      flowDirectionType=flowType,
                      outputDropName=makeJSONOptionalOutput(outDropNm)
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        outLayerName = outName
        outDropLayerName = outDropNm

        try:
            jdict = json.loads(output[0])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outLayerName)
            parameters[5].value = outLayerName
        except:
            pass

        #add second output
        if outDropLayerName == "" or outDropLayerName == None or outDropLayerName == "#":
            pass
        else:
            try:
                jdict = json.loads(output[1])
                arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outDropLayerName)
                parameters[6].value = outDropLayerName
            except:
                pass
