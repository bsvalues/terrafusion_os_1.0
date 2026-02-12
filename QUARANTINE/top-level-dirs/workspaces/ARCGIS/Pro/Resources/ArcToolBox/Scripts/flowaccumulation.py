import time
import sys
import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class FlowAccumulation(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Flow Accumulation"
        self.description = "Calculate flow accumulation for input flow direction raster."
        self.canRunInBackground = False
        self.helpContext = 54020002

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Flow Direction Raster",
            name="inputFlowDirectionRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="OutputName",
            name="outputName",
            datatype="GPString",
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Weight Raster",
            name="inputWeightRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Data Type",
            name="dataType",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['FLOAT', 'INTEGER', 'DOUBLE']
        parameters[-1].value = "FLOAT"

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
        inputRasterParam2 = parameters[2]
        validateNonLocalRaster(inputRasterParam)
        validateNonLocalRaster(inputRasterParam2)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Flow Accumulation"

        inputRas = parameters[0].valueAsText
        url = getRasterURL(inputRas)

        outName = parameters[1].valueAsText

        inputWeightRas = parameters[2].valueAsText        
        url2 = getRasterURL(inputWeightRas)
        param2 = makeJSONParameter(url2)

        outDataType = parameters[3].valueAsText
        flowDType = parameters[4].valueAsText
        
        import json
        params = dict(inputFlowDirectionRaster=json.dumps({"url":url}),                      
                      outputName=json.dumps({"serviceProperties":{"name":outName}}),
                      inputWeightRaster=param2,
                      dataType=outDataType,
                      flowDirectionType=flowDType
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        outLayerName = outName      

        try:
            jdict = json.loads(output)
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outLayerName)
            parameters[5].value = outLayerName
        except:
            pass
