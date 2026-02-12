
import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class CalculateDistance(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Calculate Distance"
        self.description = "Calculate distance for input source layer."
        self.canRunInBackground = False
        self.helpContext = 54050001
        self.luFilter = [u'Meters', u'Kilometers', u'Feet', u'Yards', u'Miles', u'FeetInt', u'YardsInt', u'MilesInt']

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter( # 0
            displayName="Input Source Raster or Features",
            name="inputSourceRasterOrFeatures",
            datatype=[u'DEImageServer', u"GPFeatureLayer", u'GPRasterLayer', u"GPString"], #,u'GPFeatureRecordSetLayer',
            parameterType="Required",
            direction="Input"))

        parameters[-1].displayOrder = 0

        parameters.append(arcpy.Parameter( # 1
            displayName="Output Distance Name",
            name="outputDistanceName",
            datatype= u"GPString",
            parameterType="Required",
            direction="Input"))

        parameters[-1].displayOrder = 1

        parameters.append(arcpy.Parameter( # 2
            displayName="Maximum Distance",
            name="maximumDistance",
            datatype= u"GPLinearUnit",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].displayOrder = 3

        parameters[-1].filter.list = self.luFilter

        parameters.append(arcpy.Parameter( # 3
            displayName="Output Cell Size",
            name="outputCellSize",
            datatype= u"GPLinearUnit",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].displayOrder = 4

        parameters[-1].filter.list = self.luFilter

        parameters.append(arcpy.Parameter( # 4
            displayName="Output Direction Name",
            name="outputDirectionName",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].displayOrder = 6

        parameters.append(arcpy.Parameter( # 5
            displayName="Output Allocation Name",
            name="outputAllocationName",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].displayOrder = 8

        parameters.append(arcpy.Parameter( # 6
            displayName="Allocation Field",
            name="allocationField",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].displayOrder = 9

        parameters.append(arcpy.Parameter( # 7
            displayName="Output Distance Raster",
            name="outputDistanceRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters[-1].displayOrder = 10

        parameters.append(arcpy.Parameter( # 8
            displayName="Output Direction Raster",
            name="outputDirectionRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters[-1].displayOrder = 11

        parameters.append(arcpy.Parameter( # 9
            displayName="Output Allocation Raster",
            name="outputAllocationRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters[-1].displayOrder = 13

        parameters.append(arcpy.Parameter( # 10
            displayName="Distance Method",
            name="distanceMethod",
            datatype=u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['Planar', 'Geodesic']
        parameters[-1].value = "Planar"
        parameters[-1].displayOrder = 5

        parameters.append(arcpy.Parameter( # 11
            displayName="Input Barrier Raster or Features",
            name="inputBarrierRasterOrFeatures",
            datatype=[u'DEImageServer', u"GPFeatureLayer", u'GPRasterLayer', u"GPString"], #,u'GPFeatureRecordSetLayer',
            parameterType="Optional",
            direction="Input"))

        parameters[-1].displayOrder = 2

        parameters.append(arcpy.Parameter( # 12
            displayName="Output Back Direction Name",
            name="outputBackDirectionName",
            datatype=u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].displayOrder = 7

        parameters.append(arcpy.Parameter( # 13
            displayName="Output Back Direction Raster",
            name="outputBackDirectionRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters[-1].displayOrder = 12

        return parameters

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        inputSourceLayer = parameters[0]
        allocField = parameters[6]

        # Default zone field
        if not inputSourceLayer.hasBeenValidated:
            if not (inputSourceLayer.value in ["", "#", None]):
                allocField.filter.list = listFields(inputSourceLayer.valueAsText, ['OID', 'Integer', 'SmallInteger'])
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inputRasterParam = parameters[0]
        inputRasterParam2 = parameters[11]
        validateNonLocalRaster(inputRasterParam)
        validateNonLocalRaster(inputRasterParam2)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""
        import json

        analysis_type = "Calculate Distance"

        inputZoneLayer = parameters[0]
        # get first input url
        url = getFeatureOrRasterURL(inputZoneLayer.valueAsText)
        if not ("://" in inputZoneLayer.valueAsText):
            url = convertURLToRest(url)

        outName = parameters[1].valueAsText
        maxDistance = parameters[2].value
        outCZ = parameters[3].value

        outDirName = parameters[4].valueAsText
        if outDirName == "" or outDirName == "#" or outDirName == None:
            outDirNameJS = ""
        else:
            outDirNameJS = json.dumps({"serviceProperties":{"name":outDirName}})

        outAllocName = parameters[5].valueAsText
        if outAllocName == "" or outAllocName == "#" or outAllocName == None:
            outAllocNameJS = ""
        else:
            outAllocNameJS = json.dumps({"serviceProperties":{"name":outAllocName}})

        allocField = parameters[6].valueAsText
        distMethod = parameters[10].valueAsText
        inBarriersURL = getFeatureOrRasterURL(parameters[11].valueAsText)
        outBackDirName = parameters[12].valueAsText        
        if outBackDirName == "" or outBackDirName == "#" or outBackDirName == None:
            outBackDirNameJS = ""
        else:
            outBackDirNameJS = json.dumps({"serviceProperties":{"name":outBackDirName}})
        
        params = dict(inputSourceRasterOrFeatures=json.dumps({"url":url}),
                      outputDistanceName=json.dumps({"serviceProperties":{"name":outName}}),
                      maximumDistance=maxDistance,
                      outputCellSize=outCZ,
                      outputDirectionName=outDirNameJS,
                      outputAllocationName=outAllocNameJS,
                      allocationField=allocField,
                      distanceMethod=distMethod,
                      inputBarrierRasterOrFeatures=makeJSONParameter(inBarriersURL),
                      outputBackDirectionName=outBackDirNameJS
                      )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        try:
            jdict = json.loads(output[0])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outName)
            parameters[7].value = outName
        except:
            pass

        try:
            jdict = json.loads(output[1])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outDirName)
            parameters[8].value = outDirName
        except:
            pass

        try:
            jdict = json.loads(output[2])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outBackDirName) 
            parameters[9].value = outBackDirName
        except:
            pass

        try:
            jdict = json.loads(output[3])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outAllocName)
            parameters[13].value = outAllocName
        except:
            pass
