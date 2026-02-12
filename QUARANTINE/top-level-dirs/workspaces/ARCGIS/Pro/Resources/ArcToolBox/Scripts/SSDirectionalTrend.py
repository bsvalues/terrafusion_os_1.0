from math import e
import os as OS
import arcpy as ARCPY
import arcgisscripting as ARC
import numpy as NUM
import SSUtilities as UTILS
import SSDataObject as SSDO
import uuid
import csv
import statsmodels.api as sm 
import locale as LOCALE
LOCALE.setlocale(LOCALE.LC_ALL, '')

globalParams = {}

def execute(parameters, messages):
    global globalParams
    if not UTILS.hasActiveMap():
        ARCPY.AddIDMessage("ERROR", 110558)
        raise SystemExit()

    inputFC = UTILS.getInputAppendParameter(0, parameters)
    inputField = UTILS.getTextParameter(1, parameters)
    directionOfTrend = UTILS.getNumericParameter(2, parameters)
    determineDirection = parameters[3].value
    order = UTILS.getNumericParameter(4, parameters)
    outFC = parameters[5]

    #### Get unique identifier of dataset ####
    ssdo = SSDO.SSDataObject(inputFC, displayProjectionWarning=False)
    ssdo.obtainData(ssdo.oidName, [inputField.upper()],minNumObs=7, useNullinFields = [inputField.upper()])
    
    

    if ssdo.numUnique < 7:
        ARCPY.AddIDMessage("ERROR", 110559)
        raise SystemExit()

    #### Get centroid arrays ####
    points = ssdo.createCentroidGeometries()
    xPosData = NUM.zeros(ssdo.numObs,dtype=float)
    yPosData = NUM.zeros(ssdo.numObs,dtype=float)
    for i in range(len(points)):
        xPosData[i] = points[i].centroid.X
        yPosData[i] = points[i].centroid.Y

    analysisData = ssdo.fields[inputField.upper()].returnDouble(replaceNullInts = True)
    nonNull_ys = ~NUM.isnan(analysisData)

    analysisData = analysisData[nonNull_ys]
    xPosData = xPosData[nonNull_ys]
    yPosData = yPosData[nonNull_ys]
    
    #### [["Polynomial Order", "Direction","R-Squared","AIC"]]
    gpMessageTable = [[ARCPY.GetIDMessage(220851),ARCPY.GetIDMessage(84805),ARCPY.GetIDMessage(84826),ARCPY.GetIDMessage(84114)]] 

    #### Determine Best Direction of Trend (highest rSquared) and ####
    #### Best Order of Polynomial (lowest AIC) ####
    for orderOfPolynomial in range(1,7):
        if determineDirection:
            minX, modelRes = determineBestDirectionOfTrend(analysisData, xPosData, yPosData, orderOfPolynomial)
            gpMessageTable.append([orderOfPolynomial, 
                                    ARCPY.GetIDMessage(220852).format( modelRes[0]), #degrees
                                    LOCALE.format_string("%0.6f",modelRes[1].rsquared), 
                                    LOCALE.format_string("%0.6f",modelRes[1].aic)])
            if orderOfPolynomial == order:
                directionOfTrend = modelRes[0]
                bestMinX = minX
        else:
            bestMinX, modelRes = getFittedPolynomialModel(analysisData, xPosData, yPosData, orderOfPolynomial, directionOfTrend)
            gpMessageTable.append([orderOfPolynomial, 
                                    ARCPY.GetIDMessage(220852).format( directionOfTrend), #degrees
                                    LOCALE.format_string("%0.6f",modelRes.rsquared), 
                                    LOCALE.format_string("%0.6f",modelRes.aic)])


    
    #### Display GP Message ####
    ARCPY.AddMessage(UTILS.outputTextTable(gpMessageTable))




    desc_Input = ARCPY.Describe(inputFC)
    layer = None
    outFC.value = None
    featureClass = False
    

    if (not desc_Input or \
        desc_Input.dataType.upper() != 'FEATURELAYER' or \
        parameters[0].valueAsText.endswith(".lyrx") or \
        parameters[0].valueAsText.endswith(".lpkx") ):
        
        project = ARCPY.mp.ArcGISProject("CURRENT")
        mapObj = project.activeMap
        
        featureClass = True
        fields = ARCPY.ListFields(inputFC)
        fieldinfo = ARCPY.FieldInfo()
        allFields = []
        for field in fields:
            fieldinfo.addField(field.name,field.name,"VISIBLE","NONE")
            allFields.append(field.name.upper())

        res = ARCPY.management.MakeFeatureLayer(inputFC, field_info= fieldinfo)
        
        layer = res[0]
        outFC.value = layer
        layerName = layer.name
    elif UTILS.hasActiveMap():
        layerName = parameters[0].valueAsText
        layer = getLayerFromActiveProject(layerName)

    if layer:
        desc_layer = ARCPY.Describe(layer)
        distanceInfo = UTILS.DistanceInfo(desc_layer.SpatialReference, useChordalDistances=False)
        if distanceInfo.type == "GEOGRAPHIC":
            ARCPY.AddIDMessage('WARNING', 3873)
            
        #### Set Unique Chart ID ####
        chartId = "DirectionalTrend_{}".format(str(uuid.uuid4()))
        
        #### Make Chart ####
        chart = ARCPY.Chart(chartId)

        #### Set Basic Scatter Plot Params, Add to Layer ####
        chart.type = "scatter"
        chart.title = ARCPY.GetIDMessage(220853).format(inputField, directionOfTrend) #### "Trend of {} at {} degrees" ####
        chart.xAxis.field = inputField
        chart.xAxis.title = ARCPY.GetIDMessage(84077).format(distanceInfo.localizedOutputString)  #e.g. "Distance (meters)"
        chart.yAxis.field = inputField
        chart.description = chartId #### spoof description with unique id to find it later ####

        if featureClass:
            outFC.charts = [chart]
        else:
            chart.addToLayer(layer)
            
        global globalParams
        globalParams['layerName'] = layerName
        globalParams['chartId'] = chartId
        globalParams['directionOfTrend'] = directionOfTrend
        globalParams['bestMinX'] = bestMinX
        globalParams['isPoints'] = ssdo.shapeType.upper() in ["POINT", "MULTIPOINT"]

def postExecute(parameters):
    global globalParams
    
    if globalParams:
        layerName = globalParams['layerName']
        chartId = globalParams['chartId']
        directionOfTrend = globalParams['directionOfTrend']
        bestMinX = globalParams['bestMinX']
        order = UTILS.getNumericParameter(4, parameters)

        layer = getLayerFromActiveProject(layerName)        



        #### Get CIM of chart from Layer ####
        layerDef = layer.getDefinition('V3')
       
        if chartId and layerDef.charts:
            for c in layerDef.charts:
                if c.generalProperties.footer != chartId:
                    continue
                
                #### Replace description with correct text "The direction is degrees clockwise from North." ####
                c.generalProperties.footer = ARCPY.GetIDMessage(220854) 
                
                #### Set new X-Axis ####
                ser = c.series[0]
                strUUID = str(uuid.uuid4())
                fieldExpression = ARCPY.cim.CIMSymbolizers.CIMExpressionInfo()
                fieldExpression.name = strUUID
                
                if globalParams['isPoints'] :
                    #### Use Geometry Function ####
                    fieldExpression.expression = f'var angleFromNorth = {directionOfTrend}; \nvar adjustedAngleDegrees = 90 - angleFromNorth;\nadjustedAngleDegrees = adjustedAngleDegrees%360;\nvar angleInRadians = adjustedAngleDegrees * PI / 180;\nvar transformedX = Geometry($feature).X * Cos(angleInRadians) + Geometry($feature).Y * Sin(angleInRadians);\nvar minimumTransformedX = {bestMinX};\n\nreturn transformedX - minimumTransformedX;';
                else:
                    #### Use Centroid Function ####
                    fieldExpression.expression = f'var angleFromNorth = {directionOfTrend}; \nvar adjustedAngleDegrees = 90 - angleFromNorth;\nadjustedAngleDegrees = adjustedAngleDegrees%360;\nvar angleInRadians = adjustedAngleDegrees * PI / 180;\nvar transformedX = Centroid($feature).X * Cos(angleInRadians) + Centroid($feature).Y * Sin(angleInRadians);\nvar minimumTransformedX = {bestMinX};\n\nreturn transformedX - minimumTransformedX;';
                fieldExpression.title = ARCPY.GetIDMessage(220855) #### 'Transformed X' ####
                fieldExpression.returnType = 'Default'
                ser.fieldExpressions.clear()
                ser.fieldExpressions.append(fieldExpression)

                ser.fields[0] = strUUID

                #### Set trend line ####
                ser.trendLineFitType = 'ChartTrendLineFitType_Polynomial'
                ser.trendOrder = int(order)
                ser.showTrendLine = True

                #### Save Changes ####
                layer.setDefinition(layerDef)

                ARCPY.charts._openChartView(layer,c.name)
                break
    globalParams = {}


#### Analyze angles for best rSquared value ####
def determineBestDirectionOfTrend(analysisData, xpos, ypos, orderOfPolyNomial):
    max10Ang = 0
    maxR2 = 0
    bestMinX = 0
    results = None

    for angFromNorth in range(0,180,10):
        minX, modelRes = getFittedPolynomialModel(analysisData, xpos, ypos, orderOfPolyNomial, angFromNorth, continueIfErr=True)

        if modelRes != None and (angFromNorth == 0 or modelRes.rsquared > maxR2):
            results = (angFromNorth,modelRes)
            maxR2 = modelRes.rsquared
            max10Ang = angFromNorth
            bestMinX = minX

    if results == None:
        #### model failed for all angles 0 to 180 ####
        #### run again and shoot out the error ####
        getFittedPolynomialModel(analysisData, xpos, ypos, orderOfPolyNomial, 0)
    
    for angFromNorth in range(max10Ang-9,max10Ang+10):
        inRangeAng = angFromNorth%180
        minX, modelRes = getFittedPolynomialModel(analysisData, xpos, ypos, orderOfPolyNomial, inRangeAng, continueIfErr=True)

        if modelRes != None and modelRes.rsquared > maxR2:
            results = (inRangeAng,modelRes)
            maxR2 = modelRes.rsquared
            bestMinX = minX

    return bestMinX, results

#### Given (n x 1) array of x, produce (n x power) array ####
#### where each column is a power of x from 0 to specified Power ###
def generatePowerMatrix(x, power):
    return NUM.vander(x, power + 1, increasing=True)


#### Generate and fit polynomial regression model ####
def getFittedPolynomialModel(analysisData, xpos, ypos, orderOfPolyNomial, angFromNorth, continueIfErr =False):
    ang = ((90-angFromNorth)%360)*NUM.pi/180
    x =  xpos*NUM.cos(ang) + ypos*NUM.sin(ang)
    minX = NUM.min(x)
    x = x - minX

    if len(NUM.unique(x)) < 7 and not continueIfErr:
        ARCPY.AddIDMessage('ERROR', 110561, angFromNorth);
        raise SystemExit();

    try:
        model = sm.OLS(analysisData, generatePowerMatrix(x,orderOfPolyNomial)).fit(method='qr')
    except NUM.linalg.LinAlgError as err:
        if continueIfErr:
            return minX, None
        if err.args[0] == "Singular matrix":
            ARCPY.AddIDMessage('ERROR', 40040);
            raise SystemExit();
        else:
            ARCPY.AddIDMessage('ERROR', 10463);
            raise SystemExit();


    return minX, model


def getLayerFromActiveProject(inputAsText):
    project = ARCPY.mp.ArcGISProject('CURRENT')
    mapObj = project.activeMap


    layersInOrder = inputAsText.split('\\')
    groupLayer = None
    
    for i in range(len(layersInOrder)):
        if groupLayer:
            nextLayer = groupLayer.listLayers(layersInOrder[i])
            if nextLayer:
                if nextLayer[0].isGroupLayer and i != len(layersInOrder)-1:
                    groupLayer = nextLayer[0]
                    continue
                elif i == len(layersInOrder)-1:
                    return nextLayer[0]
                return None

            return None
        
        nextLayer = mapObj.listLayers(layersInOrder[i])
        if nextLayer:
            if nextLayer[0].isGroupLayer and i != len(layersInOrder)-1:
                groupLayer = nextLayer[0]
                continue
            elif i == len(layersInOrder)-1:
                return nextLayer[0]
            return None

        return None


#### Plug in for running code from script factory ####
if __name__ == '__main__':
    import SSDirectionalTrend as directionalTrend
    p = ARCPY.GetParameterInfo()
    directionalTrend.execute(p, None)

