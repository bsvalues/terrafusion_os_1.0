
import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class DetermineTravelCostPathsToDestinations(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Determine Travel Cost Paths To Destinations"
        self.description = "Calculate minimum cost path to destinations."
        self.canRunInBackground = False
        self.helpContext = 54050004

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Destination Raster or Features",
            name="inputDestinationRasterOrFeatures",
            datatype=[u'DEImageServer', u"GPFeatureLayer", u'GPRasterLayer', u"GPString"], #,u'GPFeatureRecordSetLayer',
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Cost Distance Raster",
            name="inputCostDistanceRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Cost Backlink Raster",
            name="inputCostBacklinkRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Name",
            name="outputName",
            datatype= u"GPString",
            parameterType="Required",
            direction="Input"))        

        parameters.append(arcpy.Parameter(
            displayName="Destination Field",
            name="destinationField",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Path Type",
            name="pathType",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['EACH_CELL', 'EACH_ZONE', 'BEST_SINGLE']
        parameters[-1].value = "EACH_CELL"

        parameters.append(arcpy.Parameter(
            displayName="Output Raster",
            name="outputRaster",
            datatype=u"GPRasterLayer",
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
        inputSourceLayer = parameters[0]
        allocField = parameters[4]

        # Default zone field
        if not inputSourceLayer.hasBeenValidated:
            if not (inputSourceLayer.value in ["", "#", None]):
                allocField.filter.list = listFields(inputSourceLayer.valueAsText, ['OID', 'Integer', 'SmallInteger'])
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inputRasterParam = parameters[0]
        inputRasterParam2 = parameters[1]
        inputRasterParam3 = parameters[2]
        validateNonLocalRaster(inputRasterParam)
        validateNonLocalRaster(inputRasterParam2)
        validateNonLocalRaster(inputRasterParam3)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""
        import json

        analysis_type = "Determine Travel Cost Paths To Destinations"

        inputZoneLayer = parameters[0]
        # get first input url
        url = getFeatureOrRasterURL(inputZoneLayer.valueAsText)

        #get cost raster url
        inputCostRas = parameters[1].valueAsText
        url2 = getRasterURL(inputCostRas)

        #get surface raster url
        inputSurfRas = parameters[2].valueAsText
        url3 = getRasterURL(inputSurfRas)

        outName = parameters[3].valueAsText        

        destField = parameters[4].valueAsText

        pType = parameters[5].valueAsText       

        params = dict(inputDestinationRasterOrFeatures=json.dumps({"url":url}),
                      inputCostDistanceRaster=makeJSONParameter(url2),
                      inputCostBacklinkRaster=makeJSONParameter(url3),
                      outputName=json.dumps({"serviceProperties":{"name":outName}}),
                      destinationField=destField,
                      pathType=pType
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        try:
            jdict = json.loads(output)
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outName)
            parameters[6].value = outName
        except:
            pass
