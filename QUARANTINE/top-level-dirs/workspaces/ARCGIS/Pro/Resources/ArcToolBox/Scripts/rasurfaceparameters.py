import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class SurfaceParameters(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Surface Parameters"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 54060004

    def getParameterInfo(self):
        """Define parameter definitions"""              

        param_1 = arcpy.Parameter()
        param_1.name = u'inputSurfaceRaster'
        param_1.displayName = u'Input Surface Raster'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = [u"DEImageServer", u"GPRasterLayer", u"GPString"]
        param_1.displayOrder = 0

        param_2 = arcpy.Parameter()
        param_2.name = u'outputRasterName'
        param_2.displayName = u'Output Raster Name'
        param_2.parameterType = 'Required'
        param_2.direction = 'Input'
        param_2.datatype = u'GPString'
        param_2.displayOrder = 1
        
        param_3 = arcpy.Parameter()
        param_3.name = u'parameterType'
        param_3.displayName = u'Parameter Type'
        param_3.parameterType = 'Optional'
        param_3.direction = 'Input'
        param_3.datatype = u'GPString'

        param_3.filter.list = ["SLOPE", "ASPECT", "MEAN_CURVATURE", "TANGENTIAL_CURVATURE", "PROFILE_CURVATURE",
                               "CONTOUR_CURVATURE", "CONTOUR_GEODESIC_TORSION", "GAUSSIAN_CURVATURE", "CASORATI_CURVATURE"]
        param_3.value = "SLOPE"
        param_3.displayOrder = 3

        param_4 = arcpy.Parameter()
        param_4.name = u'localSurfaceType'
        param_4.displayName = u'Local Surface Type'
        param_4.parameterType = 'Optional'
        param_4.direction = 'Input'
        param_4.datatype = u'GPString'
        param_4.filter.list = ["QUADRATIC", "BIQUADRATIC"]
        param_4.value = "QUADRATIC"
        param_4.displayOrder = 4

        param_5 = arcpy.Parameter()
        param_5.name = u'neighborhoodDistance'
        param_5.displayName = u'Neighborhood Distance'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = u'GPLinearUnit'
        param_5.displayOrder = 5

        param_6 = arcpy.Parameter()
        param_6.name = u'useAdaptiveNeighborhood'
        param_6.displayName = u'Use Adaptive Neighborhood'
        param_6.parameterType = 'Optional'
        param_6.direction = 'Input'
        param_6.datatype = u'GPBoolean'
        param_6.filter.list = ["ADAPTIVE_NEIGHBORHOOD", "FIXED_NEIGHBORHOOD"]
        param_6.value = "FIXED_NEIGHBORHOOD"
        param_6.displayOrder = 6

        param_7 = arcpy.Parameter()
        param_7.name = u'zUnit'
        param_7.displayName = u'Z Unit'
        param_7.parameterType = 'Optional'
        param_7.direction = 'Input'
        param_7.datatype = u'GPString'
        param_7.filter.list = ["METER", "INCH","FOOT","YARD","MILE_US","NAUTICAL_MILE",
                               "MILLIMETER","CENTIMETER","KILOMETER","DECIMETER"]
        param_7.value = "METER"
        param_7.displayOrder = 7

        param_8 = arcpy.Parameter()
        param_8.name = u'outputSlopeMeasurement'
        param_8.displayName = u'Output Slope Measurement'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = u'GPString'
        param_8.filter.list = ["DEGREE","PERCENT_RISE"]
        param_8.value = "DEGREE"
        param_8.displayOrder = 8

        param_9 = arcpy.Parameter()
        param_9.name = u'projectGeodesicAzimuths'
        param_9.displayName = u'Project Geodesic Azimuths'
        param_9.parameterType = 'Optional'
        param_9.direction = 'Input'
        param_9.datatype = u'GPBoolean'
        param_9.filter.list = ["PROJECT_GEODESIC_AZIMUTHS", "GEODESIC_AZIMUTHS"]
        param_9.value = "GEODESIC_AZIMUTHS"
        param_9.displayOrder = 9

        param_10 = arcpy.Parameter()
        param_10.name = u'useEquatorialAspect'
        param_10.displayName = u'Use Equatorial Aspect'
        param_10.parameterType = 'Optional'
        param_10.direction = 'Input'
        param_10.datatype = u'GPBoolean'
        param_10.filter.list = ["EQUATORIAL_ASPECT", "NORTH_POLE_ASPECT"]
        param_10.value = "NORTH_POLE_ASPECT"
        param_10.displayOrder = 10

        param_11 = arcpy.Parameter()
        param_11.name="outputRaster"
        param_11.displayName="Output Raster"
        param_11.parameterType="Derived"
        param_11.direction="Output"
        param_11.datatype=u"GPRasterLayer"
        param_11.displayOrder = 11

        param_12 = arcpy.Parameter()
        param_12.name="inputAnalysisMask"
        param_12.displayName="Input Analysis Mask"
        param_12.parameterType="Optional"
        param_12.direction="Input"
        param_12.datatype=[u"DEImageServer", u"GPFeatureLayer", u"GPRasterLayer", u"GPString"]        
        param_12.displayOrder = 2
                
        params = [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12]
        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        nbrDistParam = parameters[4]

        def PopulateDefaultDistance():
            if not (parameters[0].valueAsText in ["", "#", None]):
                inRas = arcpy.Raster(parameters[0].valueAsText)
                cz = inRas.meanCellHeight
                if inRas.spatialReference.type.lower() == "geographic":
                    linearUName = "degrees"
                else:
                    linearUName = inRas.spatialReference.linearUnitName
                try:
                    nbrDistParam.value = str(cz) + " " + validateUnitName(linearUName)
                except:
                    nbrDistParam.value = str(cz) + " unknown"        
                
        ## validate Neighborhood Distance param
        # populate first default
        if not (nbrDistParam.altered):
            PopulateDefaultDistance()
        ## validate Neighborhood Distance param: End

        ## Parameter type related validation
        paramTypeText = parameters[2].valueAsText
        paramSlopeMsm = parameters[7]
        paramUseGAzim = parameters[8]
        paramUseEqAsp = parameters[9]
        
        if paramTypeText.upper() == "SLOPE":
            paramSlopeMsm.enabled = True
        else:
            paramSlopeMsm.enabled = False

        if paramTypeText.upper() == "ASPECT":
            paramUseGAzim.enabled = True
            paramUseEqAsp.enabled = True
        else:
            paramUseGAzim.enabled = False
            paramUseEqAsp.enabled = False
        ## Parameter type related validation: End
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inputRasterParam = parameters[0]
        validateNonLocalRaster(inputRasterParam)
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        
        analysis_type = "Surface Parameters"

        inputRas = parameters[0].valueAsText
        url0 = getRasterURL(inputRas)

        urlMask = getFeatureOrRasterURL(parameters[11].valueAsText)
        
        params = dict(inputSurfaceRaster=makeJSONParameter(url0),
                      outputName=json.dumps({"serviceProperties":{"name":parameters[1].valueAsText}}),
                      parameterType=parameters[2].valueAsText,
                      localSurfaceType=parameters[3].valueAsText,
                      neighborhoodDistance=parameters[4].valueAsText,
                      useAdaptiveNeighborhood=parameters[5].value,
                      zUnit=parameters[6].valueAsText,
                      outputSlopeMeasurement=parameters[7].valueAsText,
                      projectGeodesicAzimuths=parameters[8].value,
                      useEquatorialAspect=parameters[9].value,
                      inputAnalysisMask=makeJSONParameter(urlMask))

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        outLayerName = parameters[1].valueAsText

        try:
            jdict = json.loads(output)
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outLayerName)
            parameters[10].value = outLayerName
        except:
            pass
