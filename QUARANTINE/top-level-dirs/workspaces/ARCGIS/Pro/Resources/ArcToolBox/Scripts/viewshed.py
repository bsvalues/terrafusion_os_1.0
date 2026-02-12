import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class CreateViewshed(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Create Viewshed"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 54060001
        self.luFilter = [u'Meters', u'Kilometers', u'Feet', u'Yards', u'Miles',
                         u'FeetInt', u'YardsInt', u'MilesInt']

    def getParameterInfo(self):
        """Define parameter definitions"""

        # inputElevationSurface # Raster Layer, Image Service, String
        param_1 = arcpy.Parameter()
        param_1.name = u'inputElevationSurface'
        param_1.displayName = u'Input Elevation Surface'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = [u"DEImageServer", u"GPRasterLayer", u"GPString"]
        param_1.displayOrder = 0

        # inputObserverFeatures # Feature Layer
        param_2 = arcpy.Parameter()
        param_2.name = u'inputObserverFeatures'
        param_2.displayName = u'Observer Features'
        param_2.parameterType = 'Required'
        param_2.direction = 'Input'
        param_2.datatype = u'GPFeatureRecordSetLayer'
        param_2.filter.list = ["Point", "Multipoint", "Polyline"]
        param_2.displayOrder = 1

        # outputName # String
        param_3 = arcpy.Parameter()
        param_3.name = u'outputName'
        param_3.displayName = u'Output Name'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = u'GPString'
        param_3.displayOrder = 2

        # optimizeFor # String
        param_4 = arcpy.Parameter()
        param_4.name = u'optimizeFor'
        param_4.displayName = u'Optimize For'
        param_4.parameterType = 'Optional'
        param_4.direction = 'Input'
        param_4.datatype = u'GPString'
        param_4.filter.list = [u'SPEED', u'ACCURACY']
        param_4.value = u'SPEED'
        param_4.displayOrder = 3

        # maximumViewingDistanceType # String
        param_5 = arcpy.Parameter()
        param_5.name = u'maximumViewingDistanceType'
        param_5.displayName = u'Maximum Viewing Distance Type'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = u'GPString'
        param_5.filter.list = [u'DISTANCE', u'FIELD']
        param_5.value = u'DISTANCE'
        param_5.displayOrder = 6

        # maximumViewingDistance # Linear unit
        param_6 = arcpy.Parameter()
        param_6.name = u'maximumViewingDistance'
        param_6.displayName = u'Maximum Viewing Distance'
        param_6.parameterType = 'Optional'
        param_6.direction = 'Input'
        param_6.datatype = u'GPLinearUnit'
        param_6.filter.list = self.luFilter
        param_6.value = u'9 MilesInt'
        param_6.displayOrder = 7

        # maximumViewingDistanceField # Field
        param_7 = arcpy.Parameter()
        param_7.name = u'maximumViewingDistanceField'
        param_7.displayName = u'Maximum Viewing Distance Field'
        param_7.parameterType = 'Optional'
        param_7.direction = 'Input'
        param_7.datatype = u'Field'
        param_7.parameterDependencies = ["inputObserverFeatures"]
        param_7.filter.list = ['Short', 'Long', 'Float', 'Double', 'OID']
        param_7.displayOrder = 8

        # minimumViewingDistanceType # String
        param_8 = arcpy.Parameter()
        param_8.name = u'minimumViewingDistanceType'
        param_8.displayName = u'Minimum Viewing Distance Type'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = u'GPString'
        param_8.filter.list = [u'DISTANCE', u'FIELD']
        param_8.value = u'DISTANCE'
        param_8.displayOrder = 9

        # minimumViewingDistance # Linear unit
        param_9 = arcpy.Parameter()
        param_9.name = u'minimumViewingDistance'
        param_9.displayName = u'Minimum Viewing Distance'
        param_9.parameterType = 'Optional'
        param_9.direction = 'Input'
        param_9.datatype = u'GPLinearUnit'
        param_9.filter.list = self.luFilter
        param_9.displayOrder = 10

        # minimumViewingDistanceField # Field
        param_10 = arcpy.Parameter()
        param_10.name = u'minimumViewingDistanceField'
        param_10.displayName = u'Minimum Viewing Distance Field'
        param_10.parameterType = 'Optional'
        param_10.direction = 'Input'
        param_10.datatype = u'Field'
        param_10.parameterDependencies = ["inputObserverFeatures"]
        param_10.filter.list = ['Short', 'Long', 'Float', 'Double', 'OID']
        param_10.displayOrder = 11

        # viewingDistanceIs3D # Boolean
        param_11 = arcpy.Parameter()
        param_11.name = u'viewingDistanceIs3D'
        param_11.displayName = u'Viewing distances are 3D'
        param_11.parameterType = 'Optional'
        param_11.direction = 'Input'
        param_11.datatype = u'GPBoolean'
        param_11.filter.list = [u'3D', u'2D']
        param_11.value = '2D'
        param_11.displayOrder = 12

        # observersElevationType # String
        param_12 = arcpy.Parameter()
        param_12.name = u'observersElevationType'
        param_12.displayName = u'Observers Elevation Type'
        param_12.parameterType = 'Optional'
        param_12.direction = 'Input'
        param_12.datatype = u'GPString'
        param_12.filter.list = [u'ELEVATION', u'FIELD']
        param_12.value = u'ELEVATION'
        param_12.displayOrder = 13

        # observersElevation # Linear unit
        param_13 = arcpy.Parameter()
        param_13.name = u'observersElevation'
        param_13.displayName = u'Observers Elevation'
        param_13.parameterType = 'Optional'
        param_13.direction = 'Input'
        param_13.datatype = u'GPLinearUnit'
        param_13.filter.list = self.luFilter
        param_13.displayOrder = 14

        # observersElevationField # Field
        param_14 = arcpy.Parameter()
        param_14.name = u'observersElevationField'
        param_14.displayName = u'Observers Elevation Field'
        param_14.parameterType = 'Optional'
        param_14.direction = 'Input'
        param_14.datatype = u'Field'
        param_14.parameterDependencies = ["inputObserverFeatures"]
        param_14.filter.list = ['Short', 'Long', 'Float', 'Double', 'OID']
        param_14.displayOrder = 15

        # observersHeightType # String
        param_15 = arcpy.Parameter()
        param_15.name = u'observersHeightType'
        param_15.displayName = u'Observers Height Type'
        param_15.parameterType = 'Optional'
        param_15.direction = 'Input'
        param_15.datatype = u'GPString'
        param_15.filter.list = [u'HEIGHT', u'FIELD']
        param_15.value = u'HEIGHT'
        param_15.displayOrder = 16

        # observersHeight # Linear unit
        param_16 = arcpy.Parameter()
        param_16.name = u'observersHeight'
        param_16.displayName = u'Observers Height'
        param_16.parameterType = 'Optional'
        param_16.direction = 'Input'
        param_16.datatype = u'GPLinearUnit'
        param_16.filter.list = self.luFilter
        param_16.value = u'6 FeetInt'
        param_16.displayOrder = 17

        # observersHeightField # Field
        param_17 = arcpy.Parameter()
        param_17.name = u'observersHeightField'
        param_17.displayName = u'Observers Height Field'
        param_17.parameterType = 'Optional'
        param_17.direction = 'Input'
        param_17.datatype = u'Field'
        param_17.parameterDependencies = ["inputObserverFeatures"]
        param_17.filter.list = ['Short', 'Long', 'Float', 'Double', 'OID']
        param_17.displayOrder = 18

        # targetHeightType # String
        param_18 = arcpy.Parameter()
        param_18.name = u'targetHeightType'
        param_18.displayName = u'Target Height Type'
        param_18.parameterType = 'Optional'
        param_18.direction = 'Input'
        param_18.datatype = u'GPString'
        param_18.filter.list = [u'HEIGHT', u'FIELD']
        param_18.value = u'HEIGHT'
        param_18.displayOrder = 19

        # targetHeight # Linear unit
        param_19 = arcpy.Parameter()
        param_19.name = u'targetHeight'
        param_19.displayName = u'Target Height'
        param_19.parameterType = 'Optional'
        param_19.direction = 'Input'
        param_19.datatype = u'GPLinearUnit'
        param_19.filter.list = self.luFilter
        param_19.displayOrder = 20

        # targetHeightField # Field
        param_20 = arcpy.Parameter()
        param_20.name = u'targetHeightField'
        param_20.displayName = u'Target Height Field'
        param_20.parameterType = 'Optional'
        param_20.direction = 'Input'
        param_20.datatype = u'Field'
        param_20.parameterDependencies = ["inputObserverFeatures"]
        param_20.filter.list = ['Short', 'Long', 'Float', 'Double', 'OID']
        param_20.displayOrder = 21

        # aboveGroundLevelOutputName # String
        param_21 = arcpy.Parameter()
        param_21.name = u'aboveGroundLevelOutputName'
        param_21.displayName = u'Above Ground Level Output Name'
        param_21.parameterType = 'Optional'
        param_21.direction = 'Input'
        param_21.datatype = u'GPString'
        param_21.displayOrder = 26

        # outputRaster # Raster
        param_22 = arcpy.Parameter()
        param_22.name = u'outputRaster'
        param_22.displayName = u'Output Raster'
        param_22.parameterType = 'Derived'
        param_22.direction = 'Output'
        param_22.datatype = u'GPRasterLayer'
        param_22.displayOrder = 27

        # outputAboveGroundLevelRaster # Raster
        param_23 = arcpy.Parameter()
        param_23.name = u'outputAboveGroundLevelRaster'
        param_23.displayName = u'Output Above Ground Level Raster'
        param_23.parameterType = 'Derived'
        param_23.direction = 'Output'
        param_23.datatype = u'GPRasterLayer'
        param_23.displayOrder = 28

        param_24 = arcpy.Parameter()
        param_24.name = u'verticalError'
        param_24.displayName = u'Vertical Error'
        param_24.parameterType = 'Optional'
        param_24.direction = 'Input'
        param_24.datatype = 'GPLinearUnit'
        param_24.filter.list = self.luFilter
        param_24.value = u'0 Meters'
        param_24.displayOrder = 4 

        param_25 = arcpy.Parameter()
        param_25.name = u'refractivityCoefficient'
        param_25.displayName = u'Refractivity Coefficient'
        param_25.parameterType = 'Optional'
        param_25.direction = 'Input'
        param_25.datatype = 'GPDouble'
        param_25.value = 0.13
        param_25.displayOrder = 5

        param_26 = arcpy.Parameter()
        param_26.name = u'horizontalStartAngle'
        param_26.displayName = u'Horizontal Start Angle'
        param_26.parameterType = 'Optional'
        param_26.direction = 'Input'
        param_26.datatype = 'GPString'
        param_26.value = '0'
        param_26.displayOrder = 22

        param_27 = arcpy.Parameter()
        param_27.name = u'horizontalEndAngle'
        param_27.displayName = u'Horizontal End Angle'
        param_27.parameterType = 'Optional'
        param_27.direction = 'Input'
        param_27.datatype = 'GPString'
        param_27.value = '360'
        param_27.displayOrder = 23

        param_28 = arcpy.Parameter()
        param_28.name = u'verticalUpperAngle'
        param_28.displayName = u'Vertical Upper Angle'
        param_28.parameterType = 'Optional'
        param_28.direction = 'Input'
        param_28.datatype = 'GPString'
        param_28.value = '90'
        param_28.displayOrder = 24

        param_29 = arcpy.Parameter()
        param_29.name = u'verticalLowerAngle'
        param_29.displayName = u'Vertical Lower Angle'
        param_29.parameterType = 'Optional'
        param_29.direction = 'Input'
        param_29.datatype = 'GPString'
        param_29.value = '-90'
        param_29.displayOrder = 25

        params = [param_1, param_2, param_3, param_4, param_5, param_6, param_7,
        param_8, param_9, param_10, param_11, param_12, param_13, param_14,
        param_15, param_16, param_17, param_18, param_19, param_20, param_21,
        param_22, param_23, param_24, param_25, param_26, param_27, param_28, param_29]
        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        self.validateInputType(4, "DISTANCE", parameters)
        self.validateInputType(7, "DISTANCE", parameters)
        self.validateInputType(11, "ELEVATION", parameters)
        self.validateInputType(14, "HEIGHT", parameters)
        self.validateInputType(17, "HEIGHT", parameters)

        inputObsLayer = parameters[1]

        if not inputObsLayer.hasBeenValidated:           
            try:
                if not (inputObsLayer.value in ["", "#", None]):
                    listN = listFields(inputObsLayer.valueAsText, ['Single', 'Double', 'Integer', 'SmallInteger', 'String'])
                    parameters[25].filter.list = listN
                    parameters[26].filter.list = listN
                    parameters[27].filter.list = listN
                    parameters[28].filter.list = listN
            except:
                pass

        # hide the verticalError parameter when optimization is SPEED
        if parameters[3].valueAsText.upper() == "SPEED":
            parameters[23].enabled = False
        else:
            parameters[23].enabled = True
            
        return

    def validateInputType(self, pIndex, valKey, parameters):
        if not parameters[pIndex].hasBeenValidated:
            if parameters[pIndex].valueAsText != None:
                if parameters[pIndex].valueAsText.upper() in [valKey, "", "#"]:
                    parameters[pIndex + 1].enabled = True
                    parameters[pIndex + 2].enabled = False
                else:
                    parameters[pIndex + 1].enabled = False
                    parameters[pIndex + 2].enabled = True
            else:
                parameters[pIndex + 1].enabled = True
                parameters[pIndex + 2].enabled = False

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inputRasterParam = parameters[0]
        validateNonLocalRaster(inputRasterParam)

        if not (parameters[25].value in ["", "#", None]):
            try:
                v = float(parameters[25].valueAsText)
                parameters[25].clearMessage()
            except:
                pass

        if not (parameters[26].value in ["", "#", None]):
            try:
                v = float(parameters[26].valueAsText)
                parameters[26].clearMessage()
            except:
                pass

        if not (parameters[27].value in ["", "#", None]):
            try:
                v = float(parameters[27].valueAsText)
                parameters[27].clearMessage()
            except:
                pass

        if not (parameters[28].value in ["", "#", None]):
            try:
                v = float(parameters[28].valueAsText)
                parameters[28].clearMessage()
            except:
                pass
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        analysis_type = "Create Viewshed"

        import json

        inputRas = parameters[0].valueAsText
        url = getRasterURL(inputRas)

        aglOutName = parameters[20].valueAsText
        if aglOutName == "" or aglOutName == "#" or aglOutName == None:
            aglOutNameJS = None
        else:
            aglOutNameJS = json.dumps({"serviceProperties":{"name":aglOutName}})

        if parameters[4].valueAsText.upper() == "FIELD":
            maxDistLU = ""
            maxDistFld = parameters[6].valueAsText
        else:
            maxDistLU = parameters[5].value
            maxDistFld = ""

        if parameters[7].valueAsText.upper() == "FIELD":
            minDistLU = ""
            minDistFld = parameters[9].valueAsText
        else:
            minDistLU = parameters[8].value
            minDistFld = ""

        if parameters[11].valueAsText.upper() == "FIELD":
            obsElevLU = ""
            obsElevFld = parameters[13].valueAsText
        else:
            obsElevLU = parameters[12].value
            obsElevFld = ""

        if parameters[14].valueAsText.upper() == "FIELD":
            obsHtLU = ""
            obsHtFld = parameters[16].valueAsText
        else:
            obsHtLU = parameters[15].value
            obsHtFld = ""

        if parameters[17].valueAsText.upper() == "FIELD":
            tgtHtLU = ""
            tgtHtFld = parameters[19].valueAsText
        else:
            tgtHtLU = parameters[18].value
            tgtHtFld = ""

        vertErr = parameters[23].valueAsText
        refractCoeffLU = parameters[24].value
        horizStAng = parameters[25].valueAsText
        horizEndAng = parameters[26].valueAsText
        vertUpperAng = parameters[27].valueAsText
        vertLowerAng = parameters[28].valueAsText
        
        params = dict(inputElevationSurface=json.dumps({"url":url}),
                inputObserverFeatures=parameters[1].value,
                outputName=json.dumps({"serviceProperties":{"name":parameters[2].valueAsText}}),
                optimizeFor=parameters[3].valueAsText,
                maximumViewingDistance=maxDistLU,
                maximumViewingDistanceField=maxDistFld,
                minimumViewingDistance=minDistLU,
                minimumViewingDistanceField=minDistFld,
                viewingDistanceIs3D=parameters[10].value,
                observersElevation=obsElevLU,
                observersElevationField=obsElevFld,
                observersHeight=obsHtLU,
                observersHeightField=obsHtFld,
                targetHeight=tgtHtLU,
                targetHeightField=tgtHtFld,
                aboveGroundLevelOutputName=aglOutNameJS,
                verticalError=vertErr,
                refractivityCoefficient=refractCoeffLU,
                horizontalStartAngle=horizStAng,
                horizontalEndAngle=horizEndAng,
                verticalUpperAngle=vertUpperAng,
                verticalLowerAngle=vertLowerAng)

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        outLayerName = parameters[2].valueAsText
        outAglLayerName = parameters[20].valueAsText

        try:
            jdict = json.loads(output[0])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outLayerName)
            parameters[21].value = outLayerName
        except:
            pass

        #add second output
        if outAglLayerName == "" or outAglLayerName == None or outAglLayerName == "#":
            pass
        else:
            try:
                jdict = json.loads(output[1])
                arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outAglLayerName)
                parameters[22].value = outAglLayerName
            except:
                pass

        return
