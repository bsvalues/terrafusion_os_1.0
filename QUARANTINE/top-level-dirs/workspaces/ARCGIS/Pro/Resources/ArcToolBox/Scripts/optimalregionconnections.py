
import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class OptimalRegionConnections(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Optimal Region Connections"
        self.description = "Calculates the optimal connectivity network between two or more input regions."
        self.canRunInBackground = False
        self.helpContext = 54050008

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Region Raster or Features",
            name="inputRegionRasterOrFeatures",
            datatype=[u'DEImageServer', u"GPFeatureLayer", u'GPRasterLayer', u"GPString"], #,u'GPFeatureRecordSetLayer',
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Optimal Connectivity Lines Name",
            name="outputOptimalLinesName",
            datatype= u"GPString",
            parameterType="Required",
            direction="Input"))        

        parameters.append(arcpy.Parameter(
            displayName="Input Barrier Raster or Features",
            name="inputBarrierRasterOrFeatures",
            datatype=[u'DEImageServer', u"GPFeatureLayer", u'GPRasterLayer', u"GPString"],
            parameterType="Optional",
            direction="Input"))    

        parameters.append(arcpy.Parameter(
            displayName="Input Cost Raster",
            name="inputCostRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Optional",
            direction="Input"))        

        parameters.append(arcpy.Parameter(
            displayName="Output Neighboring Connections Name",
            name="outputNeighborConnectionsName",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input")) 

        parameters.append(arcpy.Parameter(
            displayName="Distance Method",
            name="distanceMethod",
            datatype=u"GPString",
            parameterType="Optional",
            direction="Input"))       

        parameters[-1].filter.list = ['PLANAR', 'GEODESIC']
        parameters[-1].value = "PLANAR"

        parameters.append(arcpy.Parameter(
            displayName="Connections Within Regions",
            name="connectionsWithinRegions",
            datatype=u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['GENERATE_CONNECTIONS', 'NO_CONNECTIONS']
        parameters[-1].value = "GENERATE_CONNECTIONS"

        parameters.append(arcpy.Parameter(
            displayName="Output Optimal Connectivity Lines Features",
            name="outputOptimalLinesFeatures",
            datatype=u"GPFeatureLayer",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Output Neighboring Connections Features",
            name="outputNeighborConnectionFeatures",
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
        inSourceRaster = parameters[0]
        inBarrierRaster = parameters[2]
        inCostRaster = parameters[3]
        validateNonLocalRaster(inSourceRaster)
        validateNonLocalRaster(inBarrierRaster)
        validateNonLocalRaster(inCostRaster)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""
        import json

        analysis_type = "Optimal Region Connections"

        inputZoneLayer = parameters[0]
        # get first input url
        url = getFeatureOrRasterURL(inputZoneLayer.valueAsText)

        outName = parameters[1].valueAsText

        inputBarrierRas = parameters[2].valueAsText
        url2 = getFeatureOrRasterURL(inputBarrierRas)

        #get cost raster url
        inputCostRas = parameters[3].valueAsText
        url3 = getRasterURL(inputCostRas)

        outNbrName = parameters[4].valueAsText

        disMethod = parameters[5].valueAsText

        connWR = parameters[6].valueAsText

        params = dict(inputRegionRasterOrFeatures=json.dumps({"url":url}),
                      outputOptimalLinesName=json.dumps({"serviceProperties":{"name":outName}}),
                      inputBarrierRasterOrFeatures=makeJSONParameter(url2),
                      inputCostRaster=makeJSONParameter(url3),
                      outputNeighborConnectionsName=makeJSONOptionalOutput(outNbrName),
                      distanceMethod=disMethod,
                      connectionsWithinRegions=connWR
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        jdict0 = json.loads(output[0])            
        parameters[7].value = jdict0['url']

        try:
            jdict1 = json.loads(output[1])
            parameters[8].value = jdict1['url']
        except:
            pass
       
