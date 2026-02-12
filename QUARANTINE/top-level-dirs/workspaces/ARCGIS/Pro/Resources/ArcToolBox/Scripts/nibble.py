
from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import param_cleanup
from rautils import *

class Nibble(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Nibble"
        self.description = "Replaces cells of a raster corresponding to a mask with the values of the nearest neighbors."
        self.canRunInBackground = False
        self.helpContext = 54040001

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Raster",
            name="inputRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Mask Raster",
            name="inputMaskRaster",
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
            displayName="Use NoData values if they are the nearest neighbor",
            name="nibbleValues",
            datatype="GPBoolean",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['ALL_VALUES', 'DATA_ONLY']
        parameters[-1].value = "ALL_VALUES"
        
        parameters.append(arcpy.Parameter(
            displayName="Nibble NoData cells",
            name="nibbleNodata",
            datatype="GPBoolean",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['PROCESS_NODATA', 'PRESERVE_NODATA']
        parameters[-1].value = "PRESERVE_NODATA"
        
        parameters.append(arcpy.Parameter(
            displayName="Input Zone Raster",
            name="inputZoneRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
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

        analysis_type = "Nibble"

        inputRas = parameters[0].valueAsText
        url = getRasterURL(inputRas)

        inputMaskRas = parameters[1].valueAsText
        url2 = getRasterURL(inputMaskRas)

        outName = parameters[2].valueAsText

        nibValues = parameters[3].valueAsText
        nibNoData = parameters[4].valueAsText

        inputZoneRas = parameters[5].valueAsText        
        url3 = getRasterURL(inputZoneRas)
        param5 = makeJSONParameter(url3)

        params = dict(inputRaster=json.dumps({"url":url}),
                      inputMaskRaster=json.dumps({"url":url2}),
                      outputName=json.dumps({"serviceProperties":{"name":outName}}),
                      nibbleValues=nibValues,
                      nibbleNodata=nibNoData,
                      inputZoneRaster=param5
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        outLayerName = outName      

        try:
            jdict = json.loads(output)
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outLayerName)
            parameters[6].value = outLayerName
        except:
            pass
