
import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class DetermineOptimumTravelCostNetwork(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Determine Optimum Travel Cost Network"
        self.description = "Calculate optimum travel cost network for input regions."
        self.canRunInBackground = False
        self.helpContext = 54050003

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Regions Raster or Features",
            name="inputRegionsRasterOrFeatures",
            datatype=[u'DEImageServer', u"GPFeatureLayer", u'GPRasterLayer', u"GPString"], #,u'GPFeatureRecordSetLayer',
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Cost Raster",
            name="inputCostRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))        

        parameters.append(arcpy.Parameter(
            displayName="Output Optimum Network Name",
            name="outputOptimumNetworkName",
            datatype= u"GPString",
            parameterType="Required",
            direction="Input"))        

        parameters.append(arcpy.Parameter(
            displayName="Output Neighbor Network Name",
            name="outputNeighborNetworkName",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input")) 

        parameters.append(arcpy.Parameter(
            displayName="Output Optimum Network Features",
            name="outputOptimumNetworkFeatures",
            datatype=u"GPFeatureLayer",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Output Neighbor Network Features",
            name="outputNeighborNetworkFeatures",
            datatype=u"GPFeatureLayer",
            parameterType="Derived",
            direction="Output"))   

        return parameters

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
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
        import json

        analysis_type = "Determine Optimum Travel Cost Network"

        inputZoneLayer = parameters[0]
        # get first input url
        url = getFeatureOrRasterURL(inputZoneLayer.valueAsText)

        #get cost raster url
        inputCostRas = parameters[1].valueAsText
        url2 = getRasterURL(inputCostRas)

        outName = parameters[2].valueAsText

        outNbrName = parameters[3].valueAsText

        params = dict(inputRegionsRasterOrFeatures=json.dumps({"url":url}),
                      inputCostRaster=makeJSONParameter(url2),
                      outputOptimumNetworkName=json.dumps({"serviceProperties":{"name":outName}}),
                      outputNeighborNetworkName=makeJSONOptionalOutput(outNbrName)
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        try:
            jdict0 = json.loads(output[0])
            parameters[4].value = jdict0['url']
        except:
            pass

        try:
            jdict1 = json.loads(output[1])
            parameters[5].value = jdict1['url']
        except:
            pass
