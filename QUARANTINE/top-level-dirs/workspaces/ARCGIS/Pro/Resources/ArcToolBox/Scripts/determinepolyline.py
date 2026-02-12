
import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class CostPathAsPolyline(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Cost Path As Polyline"
        self.description = "Determine travel paths to the destination layer and output a polyline feature service."
        self.canRunInBackground = False
        self.helpContext = 54050007        

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
            displayName="Input Cost Distance or Euclidean Distance Raster",
            name="inputCostDistanceRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 2

        parameters.append(arcpy.Parameter(
            displayName="Input Cost Backlink, Back Direction or Flow Direction Raster",
            name="inputCostBacklinkRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 3

        parameters.append(arcpy.Parameter(
            displayName="Output Polyline Name",
            name="outputPolylineName",
            datatype="GPString",
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 4       
        
        parameters.append(arcpy.Parameter(
            displayName="Path Type",
            name="pathType",
            datatype=u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['EACH_CELL', 'EACH_ZONE', 'BEST_SINGLE']
        parameters[-1].value = "BEST_SINGLE"
        parameters[-1].displayOrder = 5

        parameters.append(arcpy.Parameter(
            displayName="Destination Field",
            name="destinationField",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 1
        
        parameters.append(arcpy.Parameter(
            displayName="Output Polyline Features",
            name="outputPolylineFeatures",
            datatype=u"GPFeatureLayer",
            parameterType="Derived",
            direction="Output"))        
        parameters[-1].displayOrder = 6

        return parameters

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        inputDestLayer = parameters[0]
        destField = parameters[5]

        # Default zone field
        if not inputDestLayer.hasBeenValidated:
            if not (inputDestLayer.value in ["", "#", None]):
                destField.filter.list = listFields(inputDestLayer.valueAsText, ['OID', 'Integer', 'SmallInteger'])
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

        analysis_type = "Cost Path As Polyline"

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

        pType = parameters[4].valueAsText
        destField = parameters[5].valueAsText

        params = dict(inputDestinationRasterOrFeatures=json.dumps({"url": url}),
                      inputCostDistanceRaster=makeJSONParameter(url2),
                      inputCostBacklinkRaster=makeJSONParameter(url3),                      
                      outputPolylineName=json.dumps({"serviceProperties": {"name": outName}}),                      
                      pathType=pType,
                      destinationField=destField
                      )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        jdict1 = json.loads(output)
        parameters[6].value = jdict1['url']
