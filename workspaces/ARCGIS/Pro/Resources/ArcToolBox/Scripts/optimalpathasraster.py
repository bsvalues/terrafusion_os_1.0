import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class OptimalPathAsRaster(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Optimal Path As Raster"
        self.description = "Calculate optimal path to destinations and output a raster."
        self.canRunInBackground = False
        self.helpContext = 54050010

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
            displayName="Input Distance Accumulation Raster ",
            name="inputDistanceAccumulationRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 2

        parameters.append(arcpy.Parameter(
            displayName="Input Back Direction Raster",
            name="inputBackDirectionRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 3

        parameters.append(arcpy.Parameter(
            displayName="Output Raster Name",
            name="outputRasterName",
            datatype= u"GPString",
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
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 5

        parameters[-1].filter.list = ['BEST_SINGLE', 'EACH_CELL', 'EACH_ZONE']
        parameters[-1].value = "EACH_ZONE"

        parameters.append(arcpy.Parameter(
            displayName="Output Raster",
            name="outputRaster",
            datatype=u"GPRasterLayer",
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
        inputSourceLayer = parameters[0]
        dstField = parameters[4]

        # Default zone field
        if not inputSourceLayer.hasBeenValidated:
            if not (inputSourceLayer.value in ["", "#", None]):
                dstField.filter.list = listFields(inputSourceLayer.valueAsText, ['OID', 'Integer', 'SmallInteger'])
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inDestRaster = parameters[0]
        inDistAccRaster = parameters[1]
        inBackRaster = parameters[2]
        # 1. destination raster must be integer type
        validateIntegerRaster(inDestRaster)
        # 2. filter out local data 
        validateNonLocalRaster(inDestRaster)
        validateNonLocalRaster(inDistAccRaster)
        validateNonLocalRaster(inBackRaster)        
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""
        import json

        analysis_type = "Optimal Path As Raster"

        inputZoneLayer = parameters[0]
        # get first input url
        url = getFeatureOrRasterURL(inputZoneLayer.valueAsText)

        #get cost raster url
        inputDistAccRas = parameters[1].valueAsText
        url2 = getRasterURL(inputDistAccRas)

        #get surface raster url
        inputBackDirRas = parameters[2].valueAsText
        url3 = getRasterURL(inputBackDirRas)

        outName = parameters[3].valueAsText  

        pType = parameters[5].valueAsText
        
        destField = parameters[4].valueAsText

        params = dict(inputDestinationRasterOrFeatures=json.dumps({"url":url}),
                      inputDistanceAccumulationRaster=makeJSONParameter(url2),
                      inputBackDirectionRaster=makeJSONParameter(url3),
                      outputRasterName=json.dumps({"serviceProperties":{"name":outName}}),
                      destinationField=destField,
                      pathType=pType
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        try:
            jdict = json.loads(output)
            arcpy.AddMessage(jdict['url'])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outName) #
            parameters[6].value = outName
        except:
            pass
