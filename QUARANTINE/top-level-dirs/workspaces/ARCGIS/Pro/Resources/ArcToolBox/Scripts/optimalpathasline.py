
import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class OptimalPathAsLine(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Optimal Path As Line"
        self.description = "Calculates the least-cost path from a source to a destination as a feature."
        self.canRunInBackground = False
        self.helpContext = 54050009        

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Destination Raster or Features",
            name="inputDestinationRasterOrFeatures",
            datatype=[u'DEImageServer', u"GPFeatureLayer", u'GPRasterLayer', u"GPString"],
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 0

        parameters.append(arcpy.Parameter(
            displayName="Input Distance Accumulation Raster",
            name="inputDistanceAccumulationRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 2

        parameters.append(arcpy.Parameter(
            displayName="Input Back Direction or Flow Direction Raster",
            name="inputBackDirectionRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 3

        parameters.append(arcpy.Parameter(
            displayName="Output Optimal Path as Feature",
            name="outputPolylineName",
            datatype="GPString",
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 4   

        parameters.append(arcpy.Parameter(
            displayName="Destination Field",
            name="destinationField",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 1      

        parameters.append(arcpy.Parameter(
            displayName="Path Type",
            name="pathType",
            datatype=u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['BEST_SINGLE', 'EACH_CELL', 'EACH_ZONE']
        parameters[-1].value = "EACH_ZONE"
        parameters[-1].displayOrder = 5
        
        parameters.append(arcpy.Parameter(
            displayName="Output Polyline Features",
            name="outputPolylineFeatures",
            datatype=u"GPFeatureLayer",
            parameterType="Derived",
            direction="Output"))        
        parameters[-1].displayOrder = 6

        parameters.append(arcpy.Parameter(
            displayName="Create Network Paths",
            name="createNetworkPaths",
            datatype=u"GPBoolean",
            parameterType="Optional",
            direction="Input"))        
        parameters[-1].displayOrder = 7
        parameters[-1].filter.list = ['NETWORK_PATHS', 'DESTINATIONS_TO_SOURCES']
        parameters[-1].value = "DESTINATIONS_TO_SOURCES"

        return parameters

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        inputDestLayer = parameters[0]
        destField = parameters[4]

        # Default zone field
        if not inputDestLayer.hasBeenValidated:
            if not (inputDestLayer.value in ["", "#", None]):
                destField.filter.list = listFields(inputDestLayer.valueAsText, ['OID', 'Integer', 'SmallInteger'])
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inRasterParam = parameters[0]
        inRasterParam2 = parameters[1]
        inRasterParam3 = parameters[2]
        validateNonLocalRaster(inRasterParam)
        validateNonLocalRaster(inRasterParam2)
        validateNonLocalRaster(inRasterParam3)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""
        import json

        analysis_type = "Optimal Path As Line"

        inputDestLayer = parameters[0]
        # get first input url
        url = getFeatureOrRasterURL(inputDestLayer.valueAsText)

        # get distance raster or feature url
        inputDistRas = parameters[1].valueAsText
        url2 = getFeatureOrRasterURL(inputDistRas) 

        # get dir raster url
        inputDirRas = parameters[2].valueAsText
        url3 = getRasterURL(inputDirRas)

        outName = parameters[3].valueAsText

        destField = parameters[4].valueAsText
        pType = parameters[5].valueAsText
        createNP = parameters[7].valueAsText     

        params = dict(inputDestinationRasterOrFeatures=json.dumps({"url": url}),
                      inputDistanceAccumulationRaster=makeJSONParameter(url2),
                      inputBackDirectionRaster=makeJSONParameter(url3),                      
                      outputPolylineName=json.dumps({"serviceProperties": {"name": outName}}),      
                      destinationField=destField,                                      
                      pathType=pType,
                      createNetworkPaths=createNP
                      )

        #params['context'] = None #setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask"])
        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask"])
        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        jdict1 = json.loads(output)
        parameters[6].value = jdict1['url']

