import time
import sys
import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import param_cleanup
from rautils import *

class ConvertRasterToFeature(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Convert Raster to Feature"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 54070001

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Raster Layer",
            name="inputRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Field",
            name="field",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].value = "Value"

        parameters.append(arcpy.Parameter(
            displayName="Output Type",
            name="outputType",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.type = "ValueList"
        parameters[-1].filter.list = ["POINT", "LINE", "POLYGON"]
        parameters[-1].value = "POINT"

        parameters.append(arcpy.Parameter(
            displayName="Simplify Lines or Polygons",
            name="simplifyLinesOrPolygons",
            datatype="GPBoolean",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['SIMPLIFY', 'NO_SIMPLIFY']
        parameters[-1].value = "SIMPLIFY"

        parameters.append(arcpy.Parameter(
            displayName="Output Name",
            name="outputName",
            datatype="GPString",
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Features",
            name="outputFeatures",
            datatype="DEFeatureClass",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Create Multipart Features",
            name="createMultipartFeatures",
            datatype="GPBoolean",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['MULTIPLE_OUTER_PART', 'SINGLE_OUTER_PART']    
        parameters[-1].value = 'SINGLE_OUTER_PART'

        parameters.append(arcpy.Parameter(
            displayName="Maximum Vertices per Polygon Feature",
            name="maxVerticesPerFeature",
            datatype="GPLong",
            parameterType="Optional",
            direction="Input"))

        return parameters

    def isLicensed(self):
        """Execute only if the ArcGIS Spatial Analyst extension is available."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        outType = parameters[2].valueAsText
        if outType.lower() == "point":
            parameters[3].enabled = False
        else:
            parameters[3].enabled = True

        # for polygon output type
        if outType.lower() == "polygon":
            parameters[6].enabled = True
            parameters[7].enabled = True
        else:
            parameters[6].enabled = False
            parameters[7].enabled = False

        try:
            if parameters[0].hasBeenValidated == False:
                if not (parameters[0].value in ["", "#", None]):
                    # get fields
                    listN = listFields(parameters[0].valueAsText, ['Integer', 'SmallInteger', 'String'])
                    # set dropdown
                    parameters[1].filter.list = listN
        except:
            pass

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inputRasterParam = parameters[0]
        validateNonLocalRaster(inputRasterParam)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Convert Raster To Feature"

        inputRas = parameters[0].valueAsText
        url = getRasterURL(inputRas)
        convField = parameters[1].valueAsText
        outType = parameters[2].valueAsText
        simplify = parameters[3].valueAsText
        outName = parameters[4].valueAsText
        createMPart = parameters[6].valueAsText
        maxVerPerPolygon = parameters[7].valueAsText

        import json
        params = dict(inputRaster=json.dumps({"url":url}),
                     field=convField,
                     outputType=outType,
                     simplifyLinesOrPolygons=simplify,
                     outputName=json.dumps({"serviceProperties":{"name":outName}}),
                     createMultipartFeatures=createMPart,
                     maxVerticesPerFeature=maxVerPerPolygon
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        parameters[5].value = output
